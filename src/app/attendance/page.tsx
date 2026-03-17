"use client";
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  School,
  Search,
  Edit2,
  Trash2,
  X,
  List,
  Filter,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Zap,
} from "lucide-react";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import { useAuth } from "@/context/AuthContext";

type Attendance = {
  id: string;
  subjectId: string;
  subjectName: string;
  date: Timestamp;
  startTime: Timestamp | string;
  endTime: Timestamp | string;
  status: "PRESENT" | "ABSENT";
  lectureKey?: string;
  note?: string;
};

type Subject = {
  id: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
};

function AttendanceContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  // Set initial search query from date parameter when mounted
  useEffect(() => {
    if (dateParam) {
      const [y, m, d] = dateParam.split('-');
      if (y && m && d) {
        const dObj = new Date(Number(y), Number(m) - 1, Number(d));
        setSearchQuery(dObj.toLocaleDateString());
      }
    }
  }, [dateParam]);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Parse Time ── */
  const parseTime = (timeValue: any): Date => {
    if (!timeValue) return new Date();
    if (timeValue.toDate && typeof timeValue.toDate === "function") return timeValue.toDate();
    if (timeValue instanceof Date) return timeValue;
    if (typeof timeValue === "string") {
      try {
        const today = new Date();
        const match = timeValue.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const meridiem = match[3]?.toUpperCase();
          if (meridiem === "PM" && hours !== 12) hours += 12;
          if (meridiem === "AM" && hours === 12) hours = 0;
          today.setHours(hours, minutes, 0, 0);
          return today;
        }
      } catch (e) { }
    }
    if (typeof timeValue === "number") return new Date(timeValue);
    return new Date();
  };

  const formatTime = (timeValue: any): string => {
    try {
      return parseTime(timeValue).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  /* ── Fetch Data ── */
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      if (!user) { router.replace("/login"); return; }
      const uid = user.uid;
      try {
        const subjectSnap = await getDocs(collection(db, "users", uid, "subjects"));
        const subjectList: Subject[] = subjectSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || "Unknown Subject",
          totalClasses: d.data().totalClasses || 0,
          attendedClasses: d.data().attendedClasses || 0,
        }));
        setSubjects(subjectList);

        const attendanceList: Attendance[] = [];
        for (const subject of subjectSnap.docs) {
          const attSnap = await getDocs(
            collection(db, "users", uid, "subjects", subject.id, "attendance")
          );
          attSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const statusStr = String(data.status || "").toUpperCase().trim();
            attendanceList.push({
              id: `${subject.id}_${docSnap.id}`,
              subjectId: subject.id,
              subjectName: subject.data().name || "Unknown Subject",
              date: data.date || Timestamp.now(),
              startTime: data.startTime || "",
              endTime: data.endTime || "",
              status: statusStr === "PRESENT" ? "PRESENT" : "ABSENT",
              lectureKey: docSnap.id,
              note: typeof data.note === "string" ? data.note : undefined,
            });
          });
        }
        attendanceList.sort((a, b) => b.date.toMillis() - a.date.toMillis());
        setAttendance(attendanceList);
      } catch (error) {
        console.error("Error loading attendance:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router, user, authLoading]);

  /* ── Delete ── */
  const deleteAttendance = async (item: Attendance) => {
    if (!user) return;
    setDeleteLoading(true);
    const uid = user.uid;
    const subjectRef = doc(db, "users", uid, "subjects", item.subjectId);
    const attendanceRef = doc(
      db, "users", uid, "subjects", item.subjectId,
      "attendance", item.lectureKey || item.id.split("_")[1]
    );
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(subjectRef);
        if (!snap.exists()) return;
        const s = snap.data();
        tx.delete(attendanceRef);
        tx.update(subjectRef, {
          totalClasses: Math.max(0, s.totalClasses - 1),
          attendedClasses: item.status === "PRESENT"
            ? Math.max(0, s.attendedClasses - 1)
            : s.attendedClasses,
        });
      });
      setAttendance((prev) => prev.filter((a) => a.id !== item.id));
      setSubjects((prev) => prev.map((s) => s.id !== item.subjectId ? s : {
        ...s,
        totalClasses: Math.max(0, s.totalClasses - 1),
        attendedClasses: item.status === "PRESENT"
          ? Math.max(0, s.attendedClasses - 1)
          : s.attendedClasses,
      }));
      setSelectedAttendance(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Filters ── */
  const filteredAttendance = useMemo(() => attendance.filter((a) => {
    const matchesStatus = filter === "ALL" || a.status === filter;
    const matchesSubject = selectedSubject === "ALL" || a.subjectId === selectedSubject;
    const dateStr = a.date.toDate().toLocaleDateString();
    const matchesSearch =
      searchQuery === "" ||
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dateStr.includes(searchQuery);
    return matchesStatus && matchesSubject && matchesSearch;
  }), [attendance, filter, selectedSubject, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter((a) => a.status === "PRESENT").length;
    const absent = filteredAttendance.filter((a) => a.status === "ABSENT").length;
    return {
      total, present, absent,
      percentage: total === 0 ? 0 : Number(((present / total) * 100).toFixed(1)),
    };
  }, [filteredAttendance]);

  const groupedAttendance = useMemo(() =>
    filteredAttendance.reduce((acc, item) => {
      const key = item.date.toDate().toLocaleDateString("en-US", {
        weekday: 'short', day: "numeric", month: "short", year: "numeric",
      });
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, Attendance[]>),
    [filteredAttendance]);

  /* ── Circular Progress ── */
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (stats.percentage / 100) * circ;

  /* ── Lock body scroll when modal open ── */
  useEffect(() => {
    if (selectedAttendance) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedAttendance]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ProfessionalPageLayout>
      {/* NOTE: pb-32 ensures the content doesn't get hidden behind the mobile bottom navigation bar */}
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-32 sm:pb-10 lg:pb-12">

        {/* ── PROFESSIONAL HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Attendance History
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              Review, filter, and manage your academic presence logs.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Overall</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {stats.percentage}%
              </p>
            </div>
          </div>
        </header>

        {/* ── CONTENT BODY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN: STATS & LIST ── */}
          <div className="lg:col-span-8 space-y-8">

            {/* STICKY FILTER BAR */}
            <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-3">

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records or dates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Status Tabs */}
                <div className="flex bg-gray-50 dark:bg-zinc-800 rounded-xl p-1 border border-gray-200 dark:border-zinc-700 shrink-0">
                  {(["ALL", "PRESENT", "ABSENT"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f
                          ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TIMELINE VIEW */}
            {Object.keys(groupedAttendance).length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Records Found</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {filter !== "ALL" || searchQuery
                    ? "No records match your current filters. Try clearing them."
                    : "You haven't logged any attendance yet. Add a record to get started."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedAttendance).map(([date, items]) => (
                  <div key={date} className="relative">
                    {/* Date Header */}
                    <div className="sticky top-20 z-10 bg-gray-50/95 dark:bg-zinc-950/95 py-2 inline-block w-full">
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{date}</span>
                        <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1" />
                      </div>
                    </div>

                    {/* Records List */}
                    <div className="mt-4 space-y-3">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedAttendance(item)}
                          className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-md text-left group"
                        >
                          <div className={`w-2 h-10 rounded-full shrink-0 ${item.status === "PRESENT" ? "bg-emerald-500" : "bg-rose-500"}`} />

                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">{item.subjectName}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {item.startTime && item.endTime ? `${formatTime(item.startTime)} - ${formatTime(item.endTime)}` : "Recorded"}
                              </span>
                              {item.note && (
                                <span className="flex items-center gap-1 text-primary">
                                  <List className="w-3.5 h-3.5" /> Note
                                </span>
                              )}
                            </div>
                          </div>

                          <span className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold ${item.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                            }`}>
                            {item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: SIDEBAR ── */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

            {/* Filter Subject Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Filter by Subject</label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Quick Stats Summary Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Current View Summary</h3>

              <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-zinc-800" />
                    <motion.circle
                      initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1 }}
                      cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={circ} className="text-primary drop-shadow-md"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{stats.percentage}<span className="text-sm font-bold opacity-50">%</span></span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-semibold uppercase">Present</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.present}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.total ? (stats.present / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-semibold uppercase">Absent</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">{stats.absent}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${stats.total ? (stats.absent / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL / BOTTOM SHEET ── */}
      {mounted && createPortal(
        <AnimatePresence>
          {selectedAttendance && (
            <div className="fixed inset-0 z-[99999] flex flex-col justify-end sm:justify-center items-center sm:p-6 pb-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAttendance(null)}
                className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden mt-auto sm:mt-0 pb-6 sm:pb-0"
              >
                {/* Mobile drag handle */}
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Modal Header */}
                <div className="p-6 pt-2 sm:pt-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">Record Details</h3>
                    <p className="text-xs text-gray-500">{selectedAttendance.date.toDate().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                  </div>
                  <button onClick={() => setSelectedAttendance(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">

                  {/* Status Badge */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-700/50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-bold ${selectedAttendance.status === "PRESENT"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                      }`}>
                      {selectedAttendance.status === "PRESENT" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {selectedAttendance.status}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Subject</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selectedAttendance.subjectName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Timing</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedAttendance.startTime ? formatTime(selectedAttendance.startTime) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  {selectedAttendance.note && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Attached Note</label>
                      <div className="bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm italic">
                        "{selectedAttendance.note}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => {
                      router.push(`/attendance/edit/${selectedAttendance.subjectId}/${selectedAttendance.lectureKey || selectedAttendance.id.split("_")[1]}`);
                      setSelectedAttendance(null);
                    }}
                    className="flex-1 py-3 sm:py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => deleteAttendance(selectedAttendance)}
                    disabled={deleteLoading}
                    className="flex-1 py-3 sm:py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {deleteLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ProfessionalPageLayout>
  );
}

export default function AttendancePage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <AttendanceContent />
    </React.Suspense>
  );
}