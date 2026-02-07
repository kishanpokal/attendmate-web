"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AttendMateBottomNav from "@/components/navigation/AttendMateBottomNav";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- TYPES ---------------- */
type AnalyticsAttendance = {
  subject: string;
  date: string;
  status: "PRESENT" | "ABSENT";
};

/* ---------------- UTILS ---------------- */
function lecturesNeededFor75(present: number, total: number) {
  if (total === 0) return 0;
  if (present / total >= 0.75) return 0;
  return Math.ceil((0.75 * total - present) / 0.25);
}

function maxBunkableLectures(present: number, total: number) {
  if (total === 0) return 0;
  return Math.max(Math.floor(present / 0.75 - total), 0);
}

function percentageAfterSkipping(present: number, total: number, skip: number) {
  const newTotal = total + skip;
  return newTotal === 0 ? 0 : Number(((present * 100) / newTotal).toFixed(2));
}

function lecturesNeededToReach75(present: number, total: number, skip: number) {
  let currPresent = present;
  let currTotal = total + skip;
  let needed = 0;
  while (currTotal > 0 && (currPresent * 100) / currTotal < 75) {
    currPresent++;
    currTotal++;
    needed++;
  }
  return needed;
}

function subjectBgColor(percent: number): string {
  if (percent >= 75) return "bg-emerald-500 dark:bg-emerald-600";
  if (percent >= 60) return "bg-amber-500 dark:bg-amber-600";
  return "bg-red-500 dark:bg-red-600";
}

/* ---------------- MAIN PAGE ---------------- */
export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AnalyticsAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }
      const temp: AnalyticsAttendance[] = [];
      const subjectsSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
      for (const subjectDoc of subjectsSnap.docs) {
        const subjectName = subjectDoc.data().name;
        const attendanceSnap = await getDocs(collection(subjectDoc.ref, "attendance"));
        attendanceSnap.forEach((doc) => {
          const raw = doc.data().date;
          let dateStr = "";
          if (raw instanceof Timestamp) {
            dateStr = raw.toDate().toISOString().slice(0, 10);
          } else if (typeof raw === 'string') {
            dateStr = raw;
          } else if (raw?.toDate) {
            dateStr = raw.toDate().toISOString().slice(0, 10);
          }
          temp.push({
            subject: subjectName,
            date: dateStr,
            status: doc.data().status?.toUpperCase() || "ABSENT",
          });
        });
      }
      setAttendance(temp);
      setLoading(false);
    };
    load();
  }, [router]);

  /* ---------- CALCULATIONS ---------- */
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const percentage = total === 0 ? 0 : Number(((present * 100) / total).toFixed(2));
  const neededFor75 = lecturesNeededFor75(present, total);
  const bunkable = maxBunkableLectures(present, total);

  const bySubject = useMemo(() => {
    return attendance.reduce<Record<string, AnalyticsAttendance[]>>((acc, a) => {
      acc[a.subject] = acc[a.subject] || [];
      acc[a.subject].push(a);
      return acc;
    }, {});
  }, [attendance]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 pb-24 transition-colors duration-300">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                Analytics Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Insights & predictions for your attendance
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingState key="loading" />
        ) : attendance.length === 0 ? (
          <EmptyState key="empty" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8"
          >
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Overall Performance */}
              <div className="lg:col-span-2">
                <OverallCard 
                  percentage={percentage} 
                  present={present} 
                  total={total} 
                  neededFor75={neededFor75} 
                  bunkable={bunkable} 
                />
              </div>
              
              {/* Quick Stats */}
              <div className="lg:col-span-1">
                <QuickStatsCard present={present} total={total} percentage={percentage} />
              </div>
            </div>

            {/* Subject Analysis */}
            <SubjectBarGraph data={bySubject} />

            {/* Calendar and Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <AttendanceCalendar 
                attendance={attendance} 
                monthOffset={monthOffset} 
                setMonthOffset={setMonthOffset} 
                onDateClick={setSelectedDate} 
              />
              <SubjectPieChart data={bySubject} />
            </div>

            {/* Skip Prediction */}
            <SkipPrediction present={present} total={total} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Dialog */}
      {selectedDate && (
        <DateDialog date={selectedDate} attendance={attendance} onClose={() => setSelectedDate(null)} />
      )}

      <AttendMateBottomNav />
    </main>
  );
}

/* ---------------- LOADING STATE ---------------- */
function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium text-center">
        Analyzing your data...
      </p>
    </motion.div>
  );
}

/* ---------------- EMPTY STATE ---------------- */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-6">
        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
        No Data Available
      </h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
        Start tracking your attendance to see analytics here
      </p>
    </motion.div>
  );
}

/* ---------------- CIRCULAR PROGRESS ---------------- */
function CircularProgress({ percentage, size = 160, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  const statusColor = percentage >= 75 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={statusColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-none"
          style={{ color: statusColor }}
        >
          {animatedPercent}%
        </span>
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
          Attendance
        </span>
      </div>
    </div>
  );
}

/* ---------------- OVERALL CARD ---------------- */
function OverallCard({ percentage, present, total, neededFor75, bunkable }: any) {
  const statusColor = percentage >= 75 ? "emerald" : percentage >= 60 ? "amber" : "red";
  const statusText = percentage >= 75 ? "Excellent" : percentage >= 60 ? "Good" : "Needs Attention";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
    >
      <div className="p-5 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Overall Performance
          </h3>
          <span 
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold self-start sm:self-auto ${
              statusColor === "emerald" 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : statusColor === "amber" 
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {statusText}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress percentage={percentage} size={160} strokeWidth={12} />
          </div>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {present}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Present</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 truncate">
                  {total}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total</p>
              </div>
            </div>

            {/* Action Alert - Full Width */}
            <div 
              className={`col-span-2 rounded-xl p-3 sm:p-4 ${
                percentage < 75 
                  ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30" 
                  : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30"
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <svg 
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    percentage < 75 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={percentage < 75 ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} 
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs sm:text-sm ${percentage < 75 ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                    {percentage < 75 ? "Action Required" : "Great Performance!"}
                  </p>
                  <p className={`text-xs sm:text-sm ${percentage < 75 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {percentage < 75 ? `Attend ${neededFor75} more lecture${neededFor75 !== 1 ? 's' : ''} to reach 75%` : `You can skip ${bunkable} lecture${bunkable !== 1 ? 's' : ''} safely`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- QUICK STATS CARD ---------------- */
function QuickStatsCard({ present, total, percentage }: any) {
  const absent = total - present;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden h-full"
    >
      <div className="p-5 sm:p-6 lg:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-5 sm:mb-6">
          Quick Stats
        </h3>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Attendance Rate */}
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-800/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Attendance Rate
              </span>
              <span className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {percentage}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Present Count */}
          <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  Present Days
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 ml-2">
                {present}
              </span>
            </div>
          </div>

          {/* Absent Count */}
          <div className="p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  Absent Days
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 ml-2">
                {absent}
              </span>
            </div>
          </div>

          {/* Total Count */}
          <div className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  Total Lectures
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300 ml-2">
                {total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- SUBJECT BAR GRAPH ---------------- */
function SubjectBarGraph({ data }: { data: Record<string, AnalyticsAttendance[]> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5 sm:p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
          Subject-wise Analysis
        </h3>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {Object.entries(data).map(([subject, list], index) => {
          const present = list.filter((l) => l.status === "PRESENT").length;
          const total = list.length;
          const percent = Number(((present * 100) / total).toFixed(2));
          const [animatedWidth, setAnimatedWidth] = useState(0);

          useEffect(() => {
            const timer = setTimeout(() => setAnimatedWidth(percent), index * 100);
            return () => clearTimeout(timer);
          }, [percent, index]);

          return (
            <div key={subject} className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                  {subject}
                </span>
                <span 
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold self-start sm:self-auto ${
                    percent >= 75 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : percent >= 60 
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {percent}%
                </span>
              </div>
              
              <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${subjectBgColor(percent)}`}
                  style={{ width: `${animatedWidth}%` }}
                />
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {present} / {total} lectures attended
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ---------------- CALENDAR ---------------- */
function AttendanceCalendar({ attendance, monthOffset, setMonthOffset, onDateClick }: any) {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + monthOffset);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5 sm:p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
          Attendance Calendar
        </h3>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-5 sm:mb-6 px-1">
        <button
          onClick={() => setMonthOffset(monthOffset - 1)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center group"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 text-center px-2 truncate">
          {monthName}
        </span>
        
        <button
          onClick={() => setMonthOffset(monthOffset + 1)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center group"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 py-1 sm:py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, index) => {
          if (!day) return <div key={index} className="aspect-square" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayAttendance = attendance.filter((a: AnalyticsAttendance) => a.date === dateStr);
          const hasData = dayAttendance.length > 0;
          const allPresent = dayAttendance.every((a: AnalyticsAttendance) => a.status === "PRESENT");
          const allAbsent = dayAttendance.every((a: AnalyticsAttendance) => a.status === "ABSENT");

          const bgColor = !hasData
            ? "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
            : allPresent
            ? "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 hover:bg-emerald-200 dark:hover:bg-emerald-900/40"
            : allAbsent
            ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 hover:bg-red-200 dark:hover:bg-red-900/40"
            : "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 hover:bg-indigo-200 dark:hover:bg-indigo-900/40";

          const textColor = !hasData
            ? "text-gray-700 dark:text-gray-300"
            : allPresent
            ? "text-emerald-700 dark:text-emerald-300 font-bold"
            : allAbsent
            ? "text-red-700 dark:text-red-300 font-bold"
            : "text-indigo-700 dark:text-indigo-300 font-bold";

          return (
            <button
              key={index}
              onClick={() => hasData && onDateClick(dateStr)}
              disabled={!hasData}
              className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 ${bgColor} ${textColor} ${hasData ? "cursor-pointer active:scale-95" : "border border-gray-200 dark:border-gray-700"}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-5 sm:mt-6 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-md bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 flex-shrink-0" />
          <span className="text-gray-600 dark:text-gray-400">Present</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-md bg-red-100 dark:bg-red-900/30 border-2 border-red-500 flex-shrink-0" />
          <span className="text-gray-600 dark:text-gray-400">Absent</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-md bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 flex-shrink-0" />
          <span className="text-gray-600 dark:text-gray-400">Mixed</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- PIE CHART ---------------- */
function SubjectPieChart({ data }: { data: Record<string, AnalyticsAttendance[]> }) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4'];
  const total = Object.values(data).reduce((sum, list) => sum + list.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5 sm:p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
          Distribution by Subject
        </h3>
      </div>

      {/* Pie Chart */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
          {Object.entries(data).reduce((acc, [_, list], index) => {
            const percent = (list.length / total) * 100;
            const angle = (percent / 100) * 360;
            const prevAngle = acc.angle;

            const x1 = 100 + 80 * Math.cos((prevAngle - 90) * Math.PI / 180);
            const y1 = 100 + 80 * Math.sin((prevAngle - 90) * Math.PI / 180);
            const x2 = 100 + 80 * Math.cos((prevAngle + angle - 90) * Math.PI / 180);
            const y2 = 100 + 80 * Math.sin((prevAngle + angle - 90) * Math.PI / 180);
            const largeArc = angle > 180 ? 1 : 0;

            acc.paths.push(
              <path
                key={index}
                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[index % colors.length]}
                className="transition-opacity hover:opacity-80 cursor-pointer"
              />
            );

            acc.angle += angle;
            return acc;
          }, { paths: [] as any[], angle: 0 }).paths}
          <circle cx="100" cy="100" r="45" fill="white" className="dark:fill-gray-900" />
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-2 sm:space-y-3">
        {Object.entries(data).map(([subject, list], index) => {
          const count = list.length;
          const percent = Number(((count / total) * 100).toFixed(2));

          return (
            <div key={subject} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div 
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: colors[index % colors.length] }} 
                />
                <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                  {subject}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                  {count} lectures
                </span>
                <span 
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold" 
                  style={{ 
                    backgroundColor: colors[index % colors.length] + '20', 
                    color: colors[index % colors.length] 
                  }}
                >
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ---------------- SKIP PREDICTION ---------------- */
function SkipPrediction({ present, total }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5 sm:p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
          Skip Prediction
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((skip) => {
          const percent = percentageAfterSkipping(present, total, skip);
          const recover = lecturesNeededToReach75(present, total, skip);
          const statusColor = percent >= 75 ? "emerald" : percent >= 60 ? "amber" : "red";
          const statusText = percent >= 75 ? "Safe" : percent >= 60 ? "Risk" : "Unsafe";

          return (
            <div 
              key={skip} 
              className={`rounded-xl p-4 sm:p-5 border-2 ${
                statusColor === "emerald" 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700" 
                  : statusColor === "amber" 
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" 
                  : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                  Skip {skip} lecture{skip > 1 ? 's' : ''}
                </span>
                <span 
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold flex-shrink-0 ${
                    statusColor === "emerald" 
                      ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300" 
                      : statusColor === "amber" 
                      ? "bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300" 
                      : "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                  }`}
                >
                  {statusText}
                </span>
              </div>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span 
                  className={`text-2xl sm:text-3xl font-bold ${
                    statusColor === "emerald" 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : statusColor === "amber" 
                      ? "text-amber-600 dark:text-amber-400" 
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {percent}%
                </span>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  new rate
                </span>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {recover === 0 
                  ? "Already ≥ 75% attendance" 
                  : `Attend ${recover} more to reach 75%`
                }
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ---------------- DATE DIALOG ---------------- */
function DateDialog({ date, attendance, onClose }: any) {
  const dayAttendance = attendance.filter((a: AnalyticsAttendance) => a.date === date);
  const presentCount = dayAttendance.filter((a: AnalyticsAttendance) => a.status === "PRESENT").length;
  const absentCount = dayAttendance.filter((a: AnalyticsAttendance) => a.status === "ABSENT").length;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-5 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start gap-3 mb-5 sm:mb-6">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate">
                  {formattedDate}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {dayAttendance.length} lecture{dayAttendance.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-3 sm:p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {presentCount}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Present</p>
            </div>

            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-3 sm:p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                {absentCount}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Absent</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-800 mb-4 sm:mb-5" />

          {/* Details */}
          <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Lecture Details
          </h4>
          <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
            {dayAttendance.map((item: AnalyticsAttendance, index: number) => {
              const isPresent = item.status === "PRESENT";
              return (
                <div 
                  key={index} 
                  className={`rounded-xl p-3 sm:p-4 ${
                    isPresent 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30" 
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <svg 
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                          isPresent ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d={isPresent ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} 
                        />
                      </svg>
                      <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                        {item.subject}
                      </span>
                    </div>
                    <span 
                      className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                        isPresent 
                          ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300" 
                          : "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-5 sm:mt-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl active:scale-98"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}