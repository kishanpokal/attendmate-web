"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
} from "lucide-react";
import AttendMateBottomNav from "@/components/navigation/AttendMateBottomNav";

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

export default function AttendancePage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      } catch (e) {}
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
      if (!auth.currentUser) { router.push("/login"); return; }
      const uid = auth.currentUser.uid;
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
  }, [router]);

  /* ── Delete ── */
  const deleteAttendance = async (item: Attendance) => {
    if (!auth.currentUser) return;
    setDeleteLoading(true);
    const uid = auth.currentUser.uid;
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
        day: "2-digit", month: "short", year: "numeric",
      });
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, Attendance[]>),
  [filteredAttendance]);

  /* ── Circular Progress ── */
  const radius = 72;
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-400">Loading records…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── PAGE WRAPPER ── */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

        {/* ── HEADER ── */}
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-3 h-14 sm:h-16">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/25 flex-shrink-0">
              <School className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-none">
                Attendance Tracker
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                Monitor your academic progress
              </p>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">

          {/* Stats Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  Performance Overview
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                {/* Circular */}
                <div className="relative flex-shrink-0">
                  <svg
                    width="160" height="160" viewBox="0 0 200 200"
                    style={{ filter: "drop-shadow(0 4px 12px rgba(99,102,241,0.18))" }}
                  >
                    <circle cx="100" cy="100" r={radius} fill="none" stroke="currentColor"
                      strokeWidth="14" className="text-gray-100 dark:text-gray-800" />
                    <circle cx="100" cy="100" r={radius} fill="none" stroke="url(#attGrad)"
                      strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      transform="rotate(-90 100 100)"
                      style={{ transition: "stroke-dashoffset 1s ease-out" }} />
                    <defs>
                      <linearGradient id="attGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
                      {stats.percentage}%
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Attendance</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {stats.present}/{stats.total}
                    </span>
                  </div>
                </div>

                {/* Stat rows */}
                <div className="flex-1 w-full space-y-2.5">
                  {[
                    { label: "Attended", val: stats.present, col: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
                    { label: "Missed",   val: stats.absent,  col: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20",         icon: <XCircle className="w-4 h-4 text-red-500" /> },
                    { label: "Total",    val: stats.total,   col: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-900/20",   icon: <List className="w-4 h-4 text-indigo-500" /> },
                  ].map((row) => (
                    <div key={row.label} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl ${row.bg}`}>
                      <div className="flex items-center gap-2">
                        {row.icon}
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{row.label}</span>
                      </div>
                      <span className={`text-lg font-bold ${row.col}`}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject or date…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chips + Dropdown */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex gap-2">
                {(["ALL", "PRESENT", "ABSENT"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filter === f
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {f === "ALL" ? <Filter className="w-3.5 h-3.5" /> :
                     f === "PRESENT" ? <CheckCircle className="w-3.5 h-3.5" /> :
                     <XCircle className="w-3.5 h-3.5" />}
                    {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendance List */}
          {Object.keys(groupedAttendance).length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No records found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filter !== "ALL"
                  ? `No ${filter.toLowerCase()} records match your filters`
                  : "Start tracking to see records here"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedAttendance).map(([date, items]) => (
                <div key={date} className="space-y-2.5">
                  {/* Date header */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{date}</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
                      {items.length} {items.length === 1 ? "class" : "classes"}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedAttendance(item)}
                        className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all hover:shadow-md active:scale-[0.98] ${
                          item.status === "PRESENT"
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
                            : "bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            item.status === "PRESENT"
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/20"
                              : "bg-gradient-to-br from-red-500 to-orange-500 shadow-sm shadow-red-500/20"
                          }`}>
                            {item.status === "PRESENT"
                              ? <CheckCircle className="w-5 h-5 text-white" />
                              : <XCircle className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {item.subjectName}
                            </p>
                            {item.startTime && item.endTime && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {formatTime(item.startTime)} – {formatTime(item.endTime)}
                              </p>
                            )}
                            {item.note && (
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                📝 {item.note}
                              </p>
                            )}
                          </div>
                          <span className={`w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 flex items-center justify-center ${
                            item.status === "PRESENT"
                              ? "bg-emerald-500 text-white"
                              : "bg-red-500 text-white"
                          }`}>
                            {item.status === "PRESENT" ? "✓" : "✗"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM NAV (always on top of everything except modal) ── */}
      <AttendMateBottomNav />

      {/* ── DETAIL MODAL — perfectly centered, above everything including nav ── */}
      {selectedAttendance && (
        <div
          onClick={() => setSelectedAttendance(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        >
          {/* Backdrop blur layer */}
          <div className="absolute inset-0 backdrop-blur-sm" />

          {/* Modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            style={{
              animation: "modalIn 0.2s ease-out",
            }}
          >
            {/* Colored header */}
            <div className={`px-5 py-4 ${
              selectedAttendance.status === "PRESENT"
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-b border-emerald-200/70 dark:border-emerald-800/40"
                : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border-b border-red-200/70 dark:border-red-800/40"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    selectedAttendance.status === "PRESENT"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25"
                      : "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/25"
                  }`}>
                    {selectedAttendance.status === "PRESENT"
                      ? <CheckCircle className="w-6 h-6 text-white" />
                      : <XCircle className="w-6 h-6 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-base text-gray-900 dark:text-gray-100 truncate leading-tight">
                      {selectedAttendance.subjectName}
                    </p>
                    <span className={`text-xs font-bold ${
                      selectedAttendance.status === "PRESENT"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {selectedAttendance.status === "PRESENT" ? "✓ Attended" : "✗ Missed"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAttendance(null)}
                  className="w-8 h-8 rounded-xl bg-white/70 dark:bg-gray-800/70 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors flex-shrink-0 border border-gray-200/50 dark:border-gray-700/50"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-2.5">
              {/* Date */}
              <div className="flex items-center gap-3 px-3.5 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {selectedAttendance.date.toDate().toLocaleDateString("en-US", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Time */}
              {selectedAttendance.startTime && selectedAttendance.endTime && (
                <div className="flex items-center gap-3 px-3.5 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Time</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatTime(selectedAttendance.startTime)} – {formatTime(selectedAttendance.endTime)}
                    </p>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="flex items-center gap-3 px-3.5 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <School className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Subject</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {selectedAttendance.subjectName}
                  </p>
                </div>
              </div>

              {/* Note */}
              {selectedAttendance.note && (
                <div className="px-3.5 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Note</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    📝 {selectedAttendance.note}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    router.push(
                      `/attendance/edit/${selectedAttendance.subjectId}/${selectedAttendance.lectureKey || selectedAttendance.id.split("_")[1]}`
                    );
                    setSelectedAttendance(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteAttendance(selectedAttendance)}
                  disabled={deleteLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/20 active:scale-95 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Modal animation keyframe */}
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.92) translateY(8px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}