"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Lock, Link, AlertCircle, CheckCircle2, ChevronRight,
  GraduationCap, XCircle, CloudOff, Search, Filter, ArrowUpDown,
  ChevronLeft, ChevronDown, ChevronUp, Database, GitCompare,
  Loader2, LogIn, Navigation, Settings2, BookOpen, Clock,
  CalendarDays, Eye, SlidersHorizontal, X, ArrowUp, ArrowDown
} from "lucide-react";
import {
  CollegeAttendanceRecord,
  AppAttendanceRecord,
  SyncSummary,
  SyncProgressEvent,
  compareAttendanceData,
  SyncComparisonResult,
  normalizeDate
} from "@/lib/collegeSync";

// ————————————————————————————————————————————————
// MAIN PAGE COMPONENT
// ————————————————————————————————————————————————
export default function CollegeSyncPage() {
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [appData, setAppData] = useState<AppAttendanceRecord[]>([]);
  const [scrapedData, setScrapedData] = useState<CollegeAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loadingCached, setLoadingCached] = useState(true);

  const [activeTab, setActiveTab] = useState<"college" | "compare">("college");
  const [progressEvents, setProgressEvents] = useState<SyncProgressEvent[]>([]);
  const [currentProgress, setCurrentProgress] = useState<SyncProgressEvent | null>(null);

  // Restore saved credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem("syncEmail");
    const savedPass = localStorage.getItem("syncPass");
    if (savedEmail) setEmail(savedEmail);
    if (savedPass) setPassword(savedPass);
  }, []);

  // Load app records from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchAppRecords = async () => {
      try {
        const subjectsSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
        const records: AppAttendanceRecord[] = [];
        for (const s of subjectsSnap.docs) {
          const subName = s.data().name;
          const attSnap = await getDocs(collection(s.ref, "attendance"));
          attSnap.forEach(doc => {
            let dateStr = "";
            const d = doc.data().date;
            if (d?.toDate) {
              const dateObj = d.toDate();
              dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            } else {
              dateStr = d || "";
            }
            records.push({ id: doc.id, subject: subName, date: dateStr, status: doc.data().status.toUpperCase() });
          });
        }
        setAppData(records);
      } catch (err) {
        console.error("Failed to fetch app data:", err);
      }
    };
    fetchAppRecords();
  }, [user]);

  // Load cached data from file on mount
  useEffect(() => {
    if (!user) return;
    const loadCached = async () => {
      setLoadingCached(true);
      try {
        const res = await fetch(`/api/read-college-data?userId=${user.uid}`);
        const json = await res.json();
        if (json.found && json.records?.length > 0) {
          setScrapedData(json.records);
          setLastSynced(json.lastSynced || null);
        }
      } catch { /* ignore */ }
      setLoadingCached(false);
    };
    loadCached();
  }, [user]);

  // Compute comparison whenever scraped and app data are both available
  useEffect(() => {
    if (scrapedData.length > 0 && appData.length > 0) {
      const comparison = compareAttendanceData(scrapedData, appData);
      setSummary(comparison);
    }
  }, [scrapedData, appData]);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setScrapedData([]);
      setSummary(null);
      setError("Please enter your portal credentials to sync.");
      return;
    }
    if (!user) return;

    setLoading(true);
    setError(null);
    setProgressEvents([]);
    setCurrentProgress(null);

    localStorage.setItem("syncEmail", email);
    localStorage.setItem("syncPass", password);

    try {
      const res = await fetch("/api/sync-college", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userId: user.uid })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("No response stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: SyncProgressEvent = JSON.parse(line.slice(6));
              setCurrentProgress(event);
              setProgressEvents(prev => [...prev, event]);

              if (event.step === "complete" && event.totalRecords) {
                setScrapedData(event.totalRecords);
                setLastSynced(new Date().toISOString());
                const comparison = compareAttendanceData(event.totalRecords, appData);
                setSummary(comparison);
              }
              if (event.step === "error") {
                setError(event.message);
              }
            } catch { /* skip unparseable lines */ }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasData = scrapedData.length > 0;
  const showForm = !hasData && !loading && !loadingCached;

  return (
    <ProfessionalPageLayout>
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-primary" /> College Data Sync
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl">
              Extract, persist, and cross-reference your college attendance portal with your AttendMate records.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {lastSynced && (
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                <Clock className="w-3 h-3" />
                Last synced: {new Date(lastSynced).toLocaleString()}
              </span>
            )}
            {hasData && !loading && (
              <button
                onClick={() => {
                  setScrapedData([]); setSummary(null); setLastSynced(null);
                  setProgressEvents([]); setCurrentProgress(null);
                }}
                className="px-3.5 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-300"
              >
                Clear Data
              </button>
            )}
            {hasData && !loading && (
              <button
                onClick={(e) => handleSync(e as any)}
                className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-sync
              </button>
            )}
          </div>
        </header>

        {/* Loading cached data */}
        {loadingCached && !loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-3 text-sm text-gray-500">Loading saved data...</span>
          </div>
        )}

        {/* ── Credential Form ── */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Link className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Connect Portal</h2>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-8 px-4">
                We securely automate Chrome to read your college records. Your data is saved locally for instant access.
              </p>

              <form onSubmit={handleSync} className="space-y-5">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Portal Email</label>
                  <input
                    type="text" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Portal Password
                  </label>
                  <input
                    type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button type="submit"
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-bold transition-transform active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Start Extraction
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── Live Progress Stepper ── */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 border-3 border-gray-100 dark:border-zinc-800 rounded-full" />
                  <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
                  <GraduationCap className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Extracting Attendance Data</h3>
                  <p className="text-xs text-gray-500">{currentProgress?.message || "Initializing..."}</p>
                </div>
              </div>

              {/* Step Timeline */}
              <div className="space-y-0">
                {progressEvents.map((evt, i) => {
                  const isLast = i === progressEvents.length - 1;
                  const isDone = !isLast || evt.step === 'complete' || evt.step === 'error';
                  const isError = evt.step === 'error';

                  const StepIcon = evt.step === 'login' ? LogIn
                    : evt.step === 'navigate' ? Navigation
                    : evt.step === 'select_params' ? Settings2
                    : evt.step === 'scraping_subject' ? BookOpen
                    : evt.step === 'complete' ? CheckCircle2
                    : AlertCircle;

                  // Skip duplicate messages for same subject page updates (keep the latest)
                  if (evt.step === 'scraping_subject' && i < progressEvents.length - 1) {
                    const next = progressEvents[i + 1];
                    if (next.step === 'scraping_subject' && next.subject === evt.subject && next.page !== undefined && evt.page !== undefined) {
                      // Skip intermediate page updates for same subject, unless it's the completion message
                      if (!evt.message.includes('Completed')) return null;
                    }
                  }

                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isError ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-500'
                          : isDone ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500'
                          : 'bg-primary/10 text-primary'
                        }`}>
                          {isLast && !isDone
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <StepIcon className="w-3.5 h-3.5" />
                          }
                        </div>
                        {i < progressEvents.length - 1 && (
                          <div className="w-0.5 h-4 bg-gray-200 dark:bg-zinc-700" />
                        )}
                      </div>
                      <div className="pb-3 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isError ? 'text-rose-600 dark:text-rose-400'
                          : isLast && !isDone ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {evt.message}
                        </p>
                        {evt.step === 'scraping_subject' && evt.currentSubjectIndex && evt.totalSubjects && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[200px]">
                              <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(evt.currentSubjectIndex / evt.totalSubjects) * 100}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{evt.currentSubjectIndex}/{evt.totalSubjects}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Results Area ── */}
        {hasData && !loading && !loadingCached && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat label="College Records" value={scrapedData.length} icon={Database} color="blue" />
              <MiniStat label="Present" value={scrapedData.filter(r => r.status === 'Present').length} icon={CheckCircle2} color="emerald" />
              <MiniStat label="Absent" value={scrapedData.filter(r => r.status === 'Absent').length} icon={XCircle} color="rose" />
              <MiniStat label="Subjects" value={new Set(scrapedData.map(r => r.subject)).size} icon={BookOpen} color="violet" />
            </div>

            {/* Tab Bar */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800/60 p-1 rounded-xl w-fit">
              <TabButton active={activeTab === "college"} onClick={() => setActiveTab("college")} icon={Database} label="College Data" />
              <TabButton active={activeTab === "compare"} onClick={() => setActiveTab("compare")} icon={GitCompare} label="Comparison" />
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "college" && (
                <motion.div key="college" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <CollegeDataTab data={scrapedData} />
                </motion.div>
              )}
              {activeTab === "compare" && (
                <motion.div key="compare" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <ComparisonTab summary={summary} scrapedData={scrapedData} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </ProfessionalPageLayout>
  );
}

// ————————————————————————————————————————————————
// TAB 1: COLLEGE DATA
// ————————————————————————————————————————————————
function CollegeDataTab({ data }: { data: CollegeAttendanceRecord[] }) {
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Present" | "Absent">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "subject" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 20;

  const subjects = useMemo(() => Array.from(new Set(data.map(r => r.subject))).sort(), [data]);

  const filtered = useMemo(() => {
    let items = [...data];

    if (selectedSubject !== "ALL") items = items.filter(r => r.subject === selectedSubject);
    if (statusFilter !== "ALL") items = items.filter(r => r.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r => r.topic.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q));
    }
    if (dateFrom) {
      items = items.filter(r => normalizeDate(r.date) >= dateFrom);
    }
    if (dateTo) {
      items = items.filter(r => normalizeDate(r.date) <= dateTo);
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = normalizeDate(a.date).localeCompare(normalizeDate(b.date));
      else if (sortKey === "subject") cmp = a.subject.localeCompare(b.subject);
      else cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [data, selectedSubject, statusFilter, searchQuery, sortKey, sortDir, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [selectedSubject, statusFilter, searchQuery, dateFrom, dateTo]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  // Subject-level stats
  const subjectStats = useMemo(() => {
    const map: Record<string, { total: number; present: number }> = {};
    data.forEach(r => {
      if (!map[r.subject]) map[r.subject] = { total: 0, present: 0 };
      map[r.subject].total++;
      if (r.status === 'Present') map[r.subject].present++;
    });
    return map;
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Subject Pills */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSelectedSubject("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSubject === "ALL" ? "bg-primary text-white shadow-sm" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
          All Subjects
        </button>
        {subjects.map(sub => {
          const s = subjectStats[sub];
          const pct = s ? Math.round((s.present / s.total) * 100) : 0;
          return (
            <button key={sub} onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedSubject === sub ? "bg-primary text-white shadow-sm" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
              {sub}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${selectedSubject === sub ? "bg-white/20" : pct >= 75 ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600" : pct >= 50 ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600" : "bg-rose-100 dark:bg-rose-500/10 text-rose-600"}`}>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white"
          />
        </div>

        {/* Status quick filter */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800/60 p-0.5 rounded-lg">
          {(["ALL", "Present", "Absent"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${statusFilter === s ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>

        {/* More filters toggle */}
        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${showFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500"}`}>
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters {(dateFrom || dateTo) && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
        </button>

        {/* Count */}
        <span className="text-[11px] font-bold text-gray-400 ml-auto">{filtered.length} records</span>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                  Clear dates
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table — Desktop */}
      <div className="hidden sm:block bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th onClick={() => toggleSort("subject")} className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700 select-none">
                  <span className="flex items-center gap-1">Subject <SortIcon col="subject" /></span>
                </th>
                <th onClick={() => toggleSort("date")} className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700 select-none">
                  <span className="flex items-center gap-1">Date <SortIcon col="date" /></span>
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Time Range</th>
                <th onClick={() => toggleSort("status")} className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700 select-none">
                  <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Topic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {paged.map((r, i) => (
                <tr key={`${r.date}-${r.fromTime}-${r.subject}-${i}`} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">{r.subject}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.fromTime} – {r.toTime}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate" title={r.topic}>{r.topic || "—"}</td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">No records match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Cards — Mobile */}
      <div className="sm:hidden space-y-2">
        {paged.map((r, i) => (
          <div key={`m-${r.date}-${r.fromTime}-${r.subject}-${i}`}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{r.subject}</h4>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {r.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.fromTime} – {r.toTime}</span>
            </div>
            {r.topic && <p className="text-[11px] text-gray-400 mt-1.5 truncate">{r.topic}</p>}
          </div>
        ))}
        {paged.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No records match your filters.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-30 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pg: number;
              if (totalPages <= 7) { pg = i + 1; }
              else if (currentPage <= 4) { pg = i + 1; }
              else if (currentPage >= totalPages - 3) { pg = totalPages - 6 + i; }
              else { pg = currentPage - 3 + i; }
              return (
                <button key={pg} onClick={() => setCurrentPage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pg ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>
                  {pg}
                </button>
              );
            })}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-30 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ————————————————————————————————————————————————
// TAB 2: COMPARISON ENGINE
// ————————————————————————————————————————————————
function ComparisonTab({ summary, scrapedData }: { summary: SyncSummary | null; scrapedData: CollegeAttendanceRecord[] }) {
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "MATCHED" | "MISMATCHED" | "MISSING_IN_APP" | "MISSING_IN_COLLEGE">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const subjects = useMemo(() => {
    if (!summary) return [];
    const set = new Set<string>();
    [...summary.matched, ...summary.mismatched, ...summary.missingInApp, ...summary.missingInCollege].forEach(r => set.add(r.subject));
    return Array.from(set).sort();
  }, [summary]);

  if (!summary) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
        <CloudOff className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Comparison Available</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Comparison requires both college data and app attendance records. Make sure you have attendance data in your AttendMate app.
        </p>
      </div>
    );
  }

  const allResults = [
    ...summary.matched,
    ...summary.mismatched,
    ...summary.missingInApp,
    ...summary.missingInCollege
  ];

  const filtered = allResults.filter(r => {
    if (selectedSubject !== "ALL" && r.subject !== selectedSubject) return false;
    if (categoryFilter !== "ALL" && r.category !== categoryFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Per-subject stats
  const subjectMatchStats = useMemo(() => {
    const map: Record<string, { matched: number; mismatched: number; missingApp: number; missingCollege: number; total: number }> = {};
    allResults.forEach(r => {
      if (!map[r.subject]) map[r.subject] = { matched: 0, mismatched: 0, missingApp: 0, missingCollege: 0, total: 0 };
      map[r.subject].total++;
      if (r.category === "MATCHED") map[r.subject].matched++;
      if (r.category === "MISMATCHED") map[r.subject].mismatched++;
      if (r.category === "MISSING_IN_APP") map[r.subject].missingApp++;
      if (r.category === "MISSING_IN_COLLEGE") map[r.subject].missingCollege++;
    });
    return map;
  }, [summary]);

  const categoryConfig = {
    MATCHED: { label: "Matched", color: "emerald", icon: CheckCircle2 },
    MISMATCHED: { label: "Mismatched", color: "amber", icon: AlertCircle },
    MISSING_IN_APP: { label: "Missing in App", color: "rose", icon: XCircle },
    MISSING_IN_COLLEGE: { label: "Missing in College", color: "violet", icon: CloudOff },
  };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Matched" value={summary.matched.length} icon={CheckCircle2} color="emerald"
          onClick={() => setCategoryFilter(categoryFilter === "MATCHED" ? "ALL" : "MATCHED")}
          active={categoryFilter === "MATCHED"} />
        <MiniStat label="Mismatched" value={summary.mismatched.length} icon={AlertCircle} color="amber"
          onClick={() => setCategoryFilter(categoryFilter === "MISMATCHED" ? "ALL" : "MISMATCHED")}
          active={categoryFilter === "MISMATCHED"} />
        <MiniStat label="Missing in App" value={summary.missingInApp.length} icon={XCircle} color="rose"
          onClick={() => setCategoryFilter(categoryFilter === "MISSING_IN_APP" ? "ALL" : "MISSING_IN_APP")}
          active={categoryFilter === "MISSING_IN_APP"} />
        <MiniStat label="Missing in College" value={summary.missingInCollege.length} icon={CloudOff} color="violet"
          onClick={() => setCategoryFilter(categoryFilter === "MISSING_IN_COLLEGE" ? "ALL" : "MISSING_IN_COLLEGE")}
          active={categoryFilter === "MISSING_IN_COLLEGE"} />
      </div>

      {/* Subject Filter + Advanced */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          <button onClick={() => setSelectedSubject("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSubject === "ALL" ? "bg-primary text-white shadow-sm" : "bg-gray-100 dark:bg-zinc-800 text-gray-500"}`}>
            All Subjects
          </button>
          {subjects.map(sub => {
            const s = subjectMatchStats[sub];
            const matchRate = s ? Math.round((s.matched / s.total) * 100) : 0;
            return (
              <button key={sub} onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedSubject === sub ? "bg-primary text-white shadow-sm" : "bg-gray-100 dark:bg-zinc-800 text-gray-500"}`}>
                {sub}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${selectedSubject === sub ? "bg-white/20" : matchRate >= 90 ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600" : matchRate >= 60 ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600" : "bg-rose-100 dark:bg-rose-500/10 text-rose-600"}`}>
                  {matchRate}%
                </span>
              </button>
            );
          })}
        </div>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border shrink-0 ${showFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500"}`}>
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
        </button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}
                  className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="ALL">All Categories</option>
                  <option value="MATCHED">Matched</option>
                  <option value="MISMATCHED">Mismatched</option>
                  <option value="MISSING_IN_APP">Missing in App</option>
                  <option value="MISSING_IN_COLLEGE">Missing in College</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                  Clear dates
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count */}
      <div className="text-[11px] font-bold text-gray-400">{filtered.length} comparison results</div>

      {/* Comparison List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
          {filtered.map((item, i) => {
            const cfg = categoryConfig[item.category];
            return (
              <div key={i} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition-colors">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  {/* Category badge */}
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 w-fit
                    bg-${cfg.color}-50 dark:bg-${cfg.color}-500/10 text-${cfg.color}-600 dark:text-${cfg.color}-400 border border-${cfg.color}-200 dark:border-${cfg.color}-500/20`}>
                    <cfg.icon className="w-3 h-3" />
                    {cfg.label}
                  </div>

                  {/* Subject & Date */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.subject}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <CalendarDays className="w-3 h-3" />
                      {item.date}
                      {item.collegeRecord && <span>• {item.collegeRecord.fromTime} – {item.collegeRecord.toTime}</span>}
                    </p>
                  </div>

                  {/* Status comparison */}
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {item.appRecord && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">App</span>
                        <StatusBadge status={item.appRecord.status} />
                      </div>
                    )}
                    {item.appRecord && item.collegeRecord && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                    {item.collegeRecord && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">College</span>
                        <StatusBadge status={item.collegeRecord.status} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-sm">No comparison results match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————
// SHARED COMPONENTS
// ————————————————————————————————————————————————

function StatusBadge({ status }: { status: string }) {
  const isPresent = status.toUpperCase() === "PRESENT";
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
      isPresent
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
    }`}>
      {status.toUpperCase()}
    </span>
  );
}

function MiniStat({ label, value, icon: Icon, color, onClick, active }: {
  label: string; value: number; icon: any; color: string; onClick?: () => void; active?: boolean;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; activeBorder: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/10", text: "text-blue-600 dark:text-blue-400", activeBorder: "border-blue-400 dark:border-blue-500" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", activeBorder: "border-emerald-400 dark:border-emerald-500" },
    rose: { bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-100 dark:border-rose-500/10", text: "text-rose-600 dark:text-rose-400", activeBorder: "border-rose-400 dark:border-rose-500" },
    amber: { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/10", text: "text-amber-600 dark:text-amber-400", activeBorder: "border-amber-400 dark:border-amber-500" },
    violet: { bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-100 dark:border-violet-500/10", text: "text-violet-600 dark:text-violet-400", activeBorder: "border-violet-400 dark:border-violet-500" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-3 transition-all ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } ${active ? `ring-2 ring-offset-1 dark:ring-offset-zinc-950 ${c.activeBorder}` : c.border}`}
    >
      <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <span className={`text-xl font-black ${c.text} leading-none block`}>{value}</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
        active ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      }`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
