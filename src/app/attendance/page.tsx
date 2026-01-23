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
  ArrowLeft,
} from "lucide-react";

type Attendance = {
  id: string;
  subjectId: string;
  subjectName: string;
  date: Timestamp;
  startTime: Timestamp | string;
  endTime: Timestamp | string;
  status: "PRESENT" | "ABSENT";
  lectureKey?: string;
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
            attendanceList.push({
              id: docSnap.id,
              subjectId: subject.id,
              subjectName: subject.data().name || "Unknown Subject",
              date: data.date || Timestamp.now(),
              startTime: data.startTime || "",
              endTime: data.endTime || "",
              status: status,
              lectureKey: data.lectureKey || undefined,
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
      item.id
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
      // Update local state immediately
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

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter((a) => a.status === "PRESENT").length;
    const absent = filteredAttendance.filter((a) => a.status === "ABSENT").length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, absent, percentage };
  }, [filteredAttendance]);

  // Group by date
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

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading attendance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <School className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Attendance Tracker
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Monitor your academic progress
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Stats Overview Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Overview
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Circular Progress - FIXED */}
            <div className="flex items-center justify-center md:col-span-2 lg:col-span-1">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-gray-200 dark:text-gray-800"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.percentage / 100)}`}
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))",
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-none">
                    {stats.percentage}%
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    Attended
                  </span>
                </div>
              </div>
            </div>
            {/* Stats Cards */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200 dark:border-green-900">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700 dark:text-green-400">
                {stats.present}
              </p>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-500 mt-1 font-medium">
                Classes Attended
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-red-200 dark:border-red-900">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-700 dark:text-red-400">
                {stats.absent}
              </p>
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-500 mt-1 font-medium">
                Classes Missed
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center justify-between mb-2">
                <List className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 dark:text-blue-400">
                {stats.total}
              </p>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-500 mt-1 font-medium">
                Total Classes
              </p>
            </div>
          </div>
        </div>
        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-200 dark:border-gray-800 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {["ALL", "PRESENT", "ABSENT"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-medium transition-all text-sm sm:text-base ${
                  filter === f
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f === "ALL" ? (
                  <Filter className="w-4 h-4" />
                ) : f === "PRESENT" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {/* Subject Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm sm:text-base"
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 shadow-xl border border-gray-200 dark:border-gray-800 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Records Found
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {filter !== "ALL"
                ? `No ${filter.toLowerCase()} attendance records`
                : "Start tracking your attendance to see records here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(groupedAttendance).map(([date, items]) => (
              <div key={date} className="space-y-3 sm:space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3 px-1">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    {date}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700"></div>
                </div>
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAttendance(item)}
                      className="group bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                              item.status === "PRESENT"
                                ? "bg-green-100 dark:bg-green-950/30"
                                : "bg-red-100 dark:bg-red-950/30"
                            }`}
                          >
                            {item.status === "PRESENT" ? (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {item.subjectName}
                            </h4>
                            {item.startTime && item.endTime && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {formatTime(item.startTime)} -{" "}
                                  {formatTime(item.endTime)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "PRESENT"
                            ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {item.status === "PRESENT" ? "✓ Present" : "✗ Absent"}
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div
              className={`p-6 sm:p-8 ${
                selectedAttendance.status === "PRESENT"
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
                  : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      selectedAttendance.status === "PRESENT"
                        ? "bg-green-600 dark:bg-green-700"
                        : "bg-red-600 dark:bg-red-700"
                    }`}
                  >
                    {selectedAttendance.status === "PRESENT" ? (
                      <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    ) : (
                      <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {selectedAttendance.subjectName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAttendance(null)}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div
                className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl font-medium ${
                  selectedAttendance.status === "PRESENT"
                    ? "bg-green-600 dark:bg-green-700 text-white"
                    : "bg-red-600 dark:bg-red-700 text-white"
                }`}
              >
                {selectedAttendance.status === "PRESENT"
                  ? "✓ Attended"
                  : "✗ Missed"}
              </div>
            </div>

            {/* Details */}
            <div className="p-6 sm:p-8 space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </label>
                <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-base sm:text-lg font-semibold">
                    {selectedAttendance.date.toDate().toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {selectedAttendance.startTime && selectedAttendance.endTime && (
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </label>
                  <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-base sm:text-lg font-semibold">
                      {formatTime(selectedAttendance.startTime)} -{" "}
                      {formatTime(selectedAttendance.endTime)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subject
                </label>
                <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-base sm:text-lg font-semibold">
                    {selectedAttendance.subjectName}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => {
                    router.push(
                      `/attendance/edit/${selectedAttendance.subjectId}/${selectedAttendance.id}`
                    );
                    setSelectedAttendance(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg shadow-indigo-600/30"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Edit</span>
                </button>
                <button
                  onClick={() => deleteAttendance(selectedAttendance)}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg shadow-red-600/30 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm sm:text-base">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}