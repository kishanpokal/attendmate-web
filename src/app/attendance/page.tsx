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
  TrendingUp,
  AlertCircle,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------------- HELPER: Parse Time Safely ---------------- */
  const parseTime = (timeValue: any): Date => {
    if (!timeValue) return new Date();
    if (timeValue.toDate && typeof timeValue.toDate === "function") {
      return timeValue.toDate();
    }
    if (timeValue instanceof Date) {
      return timeValue;
    }
    if (typeof timeValue === "string") {
      try {
        const today = new Date();
        const timeStr = timeValue.trim();
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const meridiem = match[3]?.toUpperCase();
          if (meridiem === "PM" && hours !== 12) hours += 12;
          if (meridiem === "AM" && hours === 12) hours = 0;
          today.setHours(hours, minutes, 0, 0);
          return today;
        }
      } catch (e) {
        console.error("Error parsing time string:", e);
      }
    }
    if (typeof timeValue === "number") {
      return new Date(timeValue);
    }
    return new Date();
  };

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) {
        router.push("/login");
        return;
      }
      const uid = auth.currentUser.uid;
      try {
        const subjectSnap = await getDocs(
          collection(db, "users", uid, "subjects")
        );
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
            let status: "PRESENT" | "ABSENT" = "ABSENT";
            if (data.status) {
              const statusStr = String(data.status).toUpperCase().trim();
              status = statusStr === "PRESENT" ? "PRESENT" : "ABSENT";
            }
            const uniqueId = `${subject.id}_${docSnap.id}`;
            attendanceList.push({
              id: uniqueId,
              subjectId: subject.id,
              subjectName: subject.data().name || "Unknown Subject",
              date: data.date || Timestamp.now(),
              startTime: data.startTime || "",
              endTime: data.endTime || "",
              status: status,
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

  /* ---------------- DELETE ATTENDANCE ---------------- */
  const deleteAttendance = async (item: Attendance) => {
    if (!auth.currentUser) return;
    setDeleteLoading(true);
    const uid = auth.currentUser.uid;
    const subjectRef = doc(db, "users", uid, "subjects", item.subjectId);
    const attendanceRef = doc(
      db,
      "users",
      uid,
      "subjects",
      item.subjectId,
      "attendance",
      item.lectureKey || item.id.split('_')[1]
    );
    try {
      await runTransaction(db, async (transaction) => {
        const subjectSnap = await transaction.get(subjectRef);
        if (!subjectSnap.exists()) return;
        const subject = subjectSnap.data();
        transaction.delete(attendanceRef);
        transaction.update(subjectRef, {
          totalClasses: Math.max(0, subject.totalClasses - 1),
          attendedClasses:
            item.status === "PRESENT"
              ? Math.max(0, subject.attendedClasses - 1)
              : subject.attendedClasses,
        });
      });
      setAttendance((prev) => prev.filter((a) => a.id !== item.id));
      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id === item.subjectId) {
            return {
              ...s,
              totalClasses: Math.max(0, s.totalClasses - 1),
              attendedClasses:
                item.status === "PRESENT"
                  ? Math.max(0, s.attendedClasses - 1)
                  : s.attendedClasses,
            };
          }
          return s;
        })
      );
      setSelectedAttendance(null);
    } catch (error) {
      console.error("Error deleting attendance:", error);
      alert("Failed to delete attendance. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ---------------- FILTER LOGIC (Memoized) ---------------- */
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchesStatus = filter === "ALL" || a.status === filter;
      const matchesSubject =
        selectedSubject === "ALL" || a.subjectId === selectedSubject;
      const dateStr = a.date.toDate().toLocaleDateString();
      const matchesSearch =
        searchQuery === "" ||
        a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dateStr.includes(searchQuery);
      return matchesStatus && matchesSubject && matchesSearch;
    });
  }, [attendance, filter, selectedSubject, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter((a) => a.status === "PRESENT").length;
    const absent = filteredAttendance.filter((a) => a.status === "ABSENT").length;
    const percentage = total === 0 ? 0 : Number(((present / total) * 100).toFixed(1));
    return { total, present, absent, percentage };
  }, [filteredAttendance]);

  const groupedAttendance = useMemo(() => {
    return filteredAttendance.reduce((acc, item) => {
      const dateKey = item.date.toDate().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, Attendance[]>);
  }, [filteredAttendance]);

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (timeValue: any): string => {
    try {
      const date = parseTime(timeValue);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "";
    }
  };

  /* ---------------- CIRCULAR PROGRESS CALCULATION ---------------- */
  const getCircularProgress = (percentage: number) => {
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return { circumference, offset, radius };
  };

  const { circumference, offset, radius } = getCircularProgress(stats.percentage);

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Loading Attendance
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while we fetch your records...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 pb-24 sm:pb-28 transition-colors duration-300">
      {/* Header */}
      <div className={`backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg sticky top-0 z-40 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <School className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Attendance Tracker
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                Monitor your academic progress
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* Stats Overview Card */}
        <div className={`bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-gray-200/50 dark:border-gray-800/50 transition-all duration-1000 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Performance Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Circular Progress */}
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <svg className="w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72" viewBox="0 0 200 200">
                  {/* Background Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-gray-200 dark:text-gray-800"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 100 100)"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: "drop-shadow(0 0 10px rgba(99, 102, 241, 0.6))",
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-none mb-3">
                    {stats.percentage}%
                  </span>
                  <span className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-semibold">
                    Attendance Rate
                  </span>
                  <div className="mt-4 px-5 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-300 dark:border-indigo-700/50 rounded-full">
                    <span className="text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300">
                      {stats.present} / {stats.total} Classes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
              {/* Present Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-xl group-hover:bg-emerald-600/30 transition-colors">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <p className="text-4xl lg:text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {stats.present}
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                  Classes Attended
                </p>
              </div>

              {/* Absent Card */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-300 dark:border-red-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-xl group-hover:bg-red-600/30 transition-colors">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <p className="text-4xl lg:text-5xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {stats.absent}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
                  Classes Missed
                </p>
              </div>

              {/* Total Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-300 dark:border-blue-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 sm:col-span-2 lg:col-span-1 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl group-hover:bg-blue-600/30 transition-colors">
                    <List className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
                <p className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stats.total}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                  Total Classes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className={`bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50 space-y-5 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by subject or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-14 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {(["ALL", "PRESENT", "ABSENT"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                  filter === f
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                    : "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105"
                }`}
              >
                {f === "ALL" ? (
                  <Filter className="w-5 h-5" />
                ) : f === "PRESENT" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Subject Filter Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white transition-all font-medium"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Attendance List */}
        {Object.keys(groupedAttendance).length === 0 ? (
          <div className={`bg-white dark:bg-gray-900 rounded-3xl p-16 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-300 dark:border-indigo-700/50 rounded-full mb-6">
              <Calendar className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              No Records Found
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {filter !== "ALL"
                ? `No ${filter.toLowerCase()} attendance records match your filters`
                : "Start tracking your attendance to see records here"}
            </p>
          </div>
        ) : (
          <div className={`space-y-8 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {Object.entries(groupedAttendance).map(([date, items]) => (
              <div key={date} className="space-y-5">
                {/* Date Header */}
                <div className="flex items-center gap-4 px-2">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {date}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-gray-700 to-transparent"></div>
                  <span className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold">
                    {items.length} {items.length === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>

                {/* Attendance Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAttendance(item)}
                      className="group bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer hover:scale-105 duration-300"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                            item.status === "PRESENT"
                              ? "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/30"
                              : "bg-gradient-to-br from-red-600 to-orange-600 shadow-red-500/30"
                          }`}
                        >
                          {item.status === "PRESENT" ? (
                            <CheckCircle className="w-7 h-7 text-white" />
                          ) : (
                            <XCircle className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate">
                            {item.subjectName}
                          </h4>
                          {item.startTime && item.endTime && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {item.note && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-base">📝</span>
                            <p className="line-clamp-2 flex-1">{item.note}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold text-sm ${
                            item.status === "PRESENT"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {item.status === "PRESENT" ? "✓ Present" : "✗ Absent"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAttendance && (
        <div
          onClick={() => setSelectedAttendance(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            {/* Modal Header */}
            <div
              className={`p-8 ${
                selectedAttendance.status === "PRESENT"
                  ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-emerald-300 dark:border-emerald-800/50"
                  : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-b border-red-300 dark:border-red-800/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                      selectedAttendance.status === "PRESENT"
                        ? "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/30"
                        : "bg-gradient-to-br from-red-600 to-orange-600 shadow-red-500/30"
                    }`}
                  >
                    {selectedAttendance.status === "PRESENT" ? (
                      <CheckCircle className="w-10 h-10 text-white" />
                    ) : (
                      <XCircle className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {selectedAttendance.subjectName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAttendance(null)}
                  className="w-12 h-12 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-lg ${
                  selectedAttendance.status === "PRESENT"
                    ? "bg-emerald-600 text-white shadow-emerald-600/30"
                    : "bg-red-600 text-white shadow-red-600/30"
                }`}
              >
                {selectedAttendance.status === "PRESENT" ? "✓ Attended" : "✗ Missed"}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedAttendance.date.toDate().toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Time */}
              {selectedAttendance.startTime && selectedAttendance.endTime && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatTime(selectedAttendance.startTime)} - {formatTime(selectedAttendance.endTime)}
                    </span>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subject
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <School className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedAttendance.subjectName}
                  </span>
                </div>
              </div>

              {/* Note */}
              {selectedAttendance.note && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Note
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedAttendance.note}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    router.push(
                      `/attendance/edit/${selectedAttendance.subjectId}/${selectedAttendance.lectureKey || selectedAttendance.id.split('_')[1]}`
                    );
                    setSelectedAttendance(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg shadow-indigo-600/30"
                >
                  <Edit2 className="w-5 h-5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteAttendance(selectedAttendance)}
                  disabled={deleteLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-red-400 disabled:to-rose-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg shadow-red-600/30 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AttendMateBottomNav />
    </div>
  );
}