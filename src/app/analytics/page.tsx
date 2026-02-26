"use client";
import { useEffect, useMemo, useState, useRef } from "react";
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
  if (percent >= 75) return "bg-emerald-500 dark:bg-emerald-500";
  if (percent >= 60) return "bg-amber-500 dark:bg-amber-500";
  return "bg-red-500 dark:bg-red-500";
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-24 transition-colors duration-300">
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
                Professional insights & predictions
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
              <div className="lg:col-span-2">
                <OverallCard 
                  percentage={percentage} 
                  present={present} 
                  total={total} 
                  neededFor75={neededFor75} 
                  bunkable={bunkable} 
                />
              </div>
              <div className="lg:col-span-1">
                <QuickStatsCard present={present} total={total} percentage={percentage} />
              </div>
            </div>

            {/* All-Time Trend Line Chart */}
            <TrendLineChart attendance={attendance} />

            {/* Subject Analysis */}
            <SubjectBarGraph data={bySubject} />

            {/* Calendar and Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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

/* ---------------- LOADING & EMPTY STATES ---------------- */
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

/* ---------------- RESPONSIVE CIRCULAR PROGRESS ---------------- */
function CircularProgress({ percentage, size = 160, strokeWidth = 12 }: { percentage: number; size?: number; strokeWidth?: number }) {
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
    // Replaced fixed pixels with aspect-square and responsive widths to fit flawlessly
    <div className="relative inline-flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 shrink-0">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90 drop-shadow-md">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
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
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none"
          style={{ color: statusColor }}
        >
          {animatedPercent}%
        </span>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
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
      className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden h-full relative"
    >
      <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br from-${statusColor}-500 to-transparent pointer-events-none`} />
      
      <div className="p-6 lg:p-8 relative z-10 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Overall Performance
          </h3>
          <span 
            className={`px-4 py-1.5 rounded-full text-sm font-bold self-start sm:self-auto ${
              statusColor === "emerald" 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                : statusColor === "amber" 
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
            }`}
          >
            {statusText}
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-8 lg:gap-12 flex-1">
          {/* Centered Circular Progress on mobile, side-by-side on desktop */}
          <div className="flex justify-center w-full md:w-auto">
            <CircularProgress percentage={percentage} size={180} strokeWidth={14} />
          </div>

          <div className="w-full flex flex-col justify-center space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{present}</p>
                <p className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70">Present</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{total}</p>
                <p className="text-sm font-medium text-indigo-600/70 dark:text-indigo-400/70">Total</p>
              </div>
            </div>

            {/* Action Alert */}
            <div 
              className={`rounded-2xl p-4 flex items-start gap-3 border ${
                percentage < 75 
                  ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" 
                  : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30"
              }`}
            >
              <svg 
                className={`w-6 h-6 flex-shrink-0 ${percentage < 75 ? "text-red-500" : "text-emerald-500"}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={percentage < 75 ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
              </svg>
              <div>
                <p className={`font-bold text-sm ${percentage < 75 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                  {percentage < 75 ? "Action Required" : "Great Performance!"}
                </p>
                <p className={`text-sm ${percentage < 75 ? "text-red-600/80 dark:text-red-400/80" : "text-emerald-600/80 dark:text-emerald-400/80"}`}>
                  {percentage < 75 ? `Attend ${neededFor75} more lecture${neededFor75 !== 1 ? 's' : ''} to reach 75%` : `You can skip ${bunkable} lecture${bunkable !== 1 ? 's' : ''} safely`}
                </p>
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
      className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 lg:p-8 h-full flex flex-col"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Stats</h3>
      
      <div className="flex-1 flex flex-col justify-between space-y-4">
        {/* Progress Bar */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Attendance Rate</span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
        </div>

        {/* Present/Absent */}
        <div className="flex gap-4">
          <div className="flex-1 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
            <p className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 mb-1">PRESENT</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{present}</p>
          </div>
          <div className="flex-1 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
            <p className="text-xs font-semibold text-red-600/70 dark:text-red-400/70 mb-1">ABSENT</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absent}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- ALL-TIME TREND LINE CHART (WITH EXPORT) ---------------- */
function TrendLineChart({ attendance }: { attendance: AnalyticsAttendance[] }) {
  const [svgWidth, setSvgWidth] = useState(800);
  const svgHeight = 200;
  const svgRef = useRef<SVGSVGElement>(null);
  
  const trendData = useMemo(() => {
    const dates = Array.from(new Set(attendance.map(a => a.date))).sort();
    if (dates.length < 2) return [];

    return dates.map(date => {
      const upToDate = attendance.filter(a => a.date <= date);
      const present = upToDate.filter(a => a.status === "PRESENT").length;
      const total = upToDate.length;
      const percent = total > 0 ? (present / total) * 100 : 0;
      return { date, percent };
    });
  }, [attendance]);

  if (trendData.length < 2) return null;

  const maxP = Math.min(100, Math.max(...trendData.map(d => d.percent)) + 5);
  const minP = Math.max(0, Math.min(...trendData.map(d => d.percent)) - 5);
  const yRange = maxP - minP || 100;
  const stepX = svgWidth / (trendData.length - 1);

  const points = trendData.map((d, i) => {
    const x = i * stepX;
    const y = svgHeight - ((d.percent - minP) / yRange) * svgHeight;
    return { x, y, ...d };
  });

  let pathString = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    pathString += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const fillPathString = `${pathString} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  const numLabels = 5;
  const labelIndices = points.length <= numLabels 
    ? points.map((_, i) => i) 
    : Array.from({ length: numLabels }).map((_, i) => Math.floor(i * (points.length - 1) / (numLabels - 1)));

  // Download Chart Logic
  const handleDownload = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    
    // We clone it to remove the motion clipPath briefly so full chart exports instantly 
    // without waiting for the animation if user clicks too fast.
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    const gTag = clonedSvg.querySelector("g");
    if (gTag) gTag.removeAttribute("clip-path");

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = svgWidth;
      canvas.height = svgHeight + 50; // Extra height for padding
      if (ctx) {
        // Fill background based on theme for clean PNG
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG offset slightly to not touch the edges
        ctx.drawImage(img, 0, 20);
        
        const a = document.createElement("a");
        a.download = `Attendance-Trend-${new Date().toISOString().slice(0, 10)}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden"
    >
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">All-Time Trend</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Since {new Date(trendData[0].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">Save Image</span>
          </button>
        </div>

        <div 
          className="relative w-full h-[200px]"
          ref={(node) => {
            if (node) {
              const rect = node.getBoundingClientRect();
              if (rect.width !== svgWidth) setSvgWidth(rect.width);
            }
          }}
        >
          {/* xmlns added strictly for canvas export compatibility */}
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="absolute inset-0 overflow-visible w-full h-full">
            <defs>
              <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
              <clipPath id="revealClip">
                <motion.rect 
                  x="0" y="-20" width={svgWidth} height={svgHeight + 40}
                  initial={{ width: 0 }}
                  animate={{ width: svgWidth }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </clipPath>
            </defs>

            <g clipPath="url(#revealClip)">
              <path d={fillPathString} fill="url(#gradientArea)" />
              {/* Used explicit hex colors here to ensure it exports cleanly to canvas without CSS */}
              <path 
                d={pathString} 
                fill="none" 
                stroke="#4f46e5" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" />
                  <circle cx={p.x} cy={p.y} r="5" fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                </g>
              ))}
            </g>
          </svg>
        </div>

        <div className="flex justify-between items-center mt-4 text-xs font-medium text-gray-400 dark:text-gray-500 relative">
          {labelIndices.map((idx, i) => (
            <span 
              key={i} 
              className="absolute transform -translate-x-1/2" 
              style={{ left: `${(idx / (points.length - 1)) * 100}%` }}
            >
              {new Date(points[idx].date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
            </span>
          ))}
          <span className="invisible">Spacer</span>
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
      transition={{ delay: 0.3 }}
      className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 lg:p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Subject-wise Analysis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{Object.keys(data).length} subjects tracked</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/50 text-xs font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Red line indicates 75% threshold
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(data).sort((a,b) => b[1].length - a[1].length).map(([subject, list], index) => {
          const present = list.filter((l) => l.status === "PRESENT").length;
          const total = list.length;
          const percent = Number(((present * 100) / total).toFixed(2));
          const [animatedWidth, setAnimatedWidth] = useState(0);

          useEffect(() => {
            const timer = setTimeout(() => setAnimatedWidth(percent), index * 100);
            return () => clearTimeout(timer);
          }, [percent, index]);

          return (
            <div key={subject} className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200">{subject}</h4>
                  <p className="text-xs font-medium text-gray-500">{present} / {total} lectures</p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-extrabold ${percent >= 75 ? 'text-emerald-500' : percent >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {percent}%
                  </span>
                </div>
              </div>
              
              <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: '75%' }} />
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative z-0 ${subjectBgColor(percent)}`}
                  style={{ width: `${animatedWidth}%` }}
                />
              </div>
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
      transition={{ delay: 0.4 }}
      className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 lg:p-8 flex flex-col h-full"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
          Attendance Calendar
        </h3>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setMonthOffset(monthOffset - 1)}
          className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center border border-gray-200 dark:border-gray-700"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{monthName}</span>
        <button
          onClick={() => setMonthOffset(monthOffset + 1)}
          className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center border border-gray-200 dark:border-gray-700"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1">
        {days.map((day, index) => {
          if (!day) return <div key={index} className="aspect-square" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayAttendance = attendance.filter((a: AnalyticsAttendance) => a.date === dateStr);
          const hasData = dayAttendance.length > 0;
          const allPresent = dayAttendance.every((a: AnalyticsAttendance) => a.status === "PRESENT");
          const allAbsent = dayAttendance.every((a: AnalyticsAttendance) => a.status === "ABSENT");

          const bgColor = !hasData
            ? "bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent"
            : allPresent
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 hover:bg-emerald-100"
            : allAbsent
            ? "bg-red-50 dark:bg-red-900/20 border-red-500 hover:bg-red-100"
            : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 hover:bg-indigo-100";

          const textColor = !hasData
            ? "text-gray-500 dark:text-gray-400"
            : allPresent
            ? "text-emerald-700 dark:text-emerald-400"
            : allAbsent
            ? "text-red-700 dark:text-red-400"
            : "text-indigo-700 dark:text-indigo-400";

          return (
            <button
              key={index}
              onClick={() => hasData && onDateClick(dateStr)}
              disabled={!hasData}
              className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 ${bgColor} ${textColor} ${hasData ? "cursor-pointer active:scale-95" : ""}`}
            >
              {day}
              {hasData && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border-2 border-emerald-500" /><span className="text-xs font-semibold text-gray-500">Present</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100 border-2 border-red-500" /><span className="text-xs font-semibold text-gray-500">Absent</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-100 border-2 border-indigo-500" /><span className="text-xs font-semibold text-gray-500">Mixed</span></div>
      </div>
    </motion.div>
  );
}

/* ---------------- ANIMATED PIE CHART ---------------- */
function SubjectPieChart({ data }: { data: Record<string, AnalyticsAttendance[]> }) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4'];
  const total = Object.values(data).reduce((sum, list) => sum + list.length, 0);

  const slices = useMemo(() => {
    let currentAngle = 0;
    return Object.entries(data).map(([subject, list], index) => {
      const percent = (list.length / total) * 100;
      const angle = (percent / 100) * 360;
      
      const x1 = 100 + 80 * Math.cos((currentAngle - 90) * Math.PI / 180);
      const y1 = 100 + 80 * Math.sin((currentAngle - 90) * Math.PI / 180);
      const x2 = 100 + 80 * Math.cos((currentAngle + angle - 90) * Math.PI / 180);
      const y2 = 100 + 80 * Math.sin((currentAngle + angle - 90) * Math.PI / 180);
      const largeArc = angle > 180 ? 1 : 0;
      
      const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
      currentAngle += angle;

      return { subject, count: list.length, pathData, color: colors[index % colors.length] };
    });
  }, [data, total]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 lg:p-8 flex flex-col h-full"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
          Distribution
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="relative w-48 h-48 mx-auto">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {slices.map((slice, i) => (
              <motion.path
                key={slice.subject}
                d={slice.pathData}
                fill={slice.color}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "backOut" }}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
            <circle cx="100" cy="100" r="50" className="fill-white dark:fill-gray-900" />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">{total}</span>
            <span className="text-xs font-medium text-gray-400">Total</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto px-1">
          {slices.map((slice) => {
            const percent = ((slice.count / total) * 100).toFixed(0);
            return (
              <div key={slice.subject} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{slice.subject}</p>
                  <p className="text-[10px] font-semibold text-gray-500">{slice.count} ({percent}%)</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- ADVANCED SKIP PREDICTION COMPONENT ---------------- */
function AdvancedPredictionCard({ skip, present, total }: { skip: number, present: number, total: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const percent = percentageAfterSkipping(present, total, skip);
  const recover = lecturesNeededToReach75(present, total, skip);
  
  const statusColor = percent >= 75 ? "emerald" : percent >= 60 ? "amber" : "red";
  const statusText = percent >= 75 ? "Safe" : percent >= 60 ? "Risk Zone" : "Critical";

  const currentPercent = total > 0 ? (present / total) * 100 : 0;
  const difference = (currentPercent - percent).toFixed(1);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
        statusColor === "emerald" 
          ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20" 
          : statusColor === "amber" 
          ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100/50 dark:hover:bg-amber-900/20" 
          : "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 hover:bg-red-100/50 dark:hover:bg-red-900/20"
      }`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
              statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 
              statusColor === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' : 
              'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
            }`}>
              {skip}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100">Skip {skip} lecture{skip > 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500">{total + skip} total after skip</p>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <span className={`text-2xl font-extrabold ${
              statusColor === "emerald" ? "text-emerald-600 dark:text-emerald-400" : 
              statusColor === "amber" ? "text-amber-600 dark:text-amber-400" : 
              "text-red-600 dark:text-red-400"
            }`}>
              {percent}%
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${
              statusColor === "emerald" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : 
              statusColor === "amber" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : 
              "bg-red-500/20 text-red-700 dark:text-red-300"
            }`}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Expandable Recovery Info section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="h-px w-full bg-gray-200 dark:bg-gray-700/50 my-4" />
              
              <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${
                recover === 0 ? "bg-emerald-100/50 dark:bg-emerald-900/30" : "bg-indigo-50 dark:bg-indigo-900/20"
              }`}>
                {recover === 0 ? (
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                )}
                <div>
                  <p className={`text-sm font-bold ${recover === 0 ? "text-emerald-800 dark:text-emerald-300" : "text-indigo-800 dark:text-indigo-300"}`}>
                    {recover === 0 ? "You're safe!" : "Recovery Plan"}
                  </p>
                  <p className={`text-xs ${recover === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                    {recover === 0 ? "Already maintaining ≥75% attendance" : `Attend ${recover} more lecture${recover > 1 ? 's' : ''} to reach 75%`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                  <svg className="w-4 h-4 text-emerald-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="font-bold text-gray-900 dark:text-white">{present}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Present</span>
                </div>
                <div className="flex flex-col items-center">
                  <svg className="w-4 h-4 text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-bold text-gray-900 dark:text-white">{total + skip}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">After Skip</span>
                </div>
                <div className="flex flex-col items-center">
                  <svg className="w-4 h-4 text-red-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  <span className="font-bold text-red-600 dark:text-red-400">-{difference}%</span>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Diff.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 text-center w-full">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {isExpanded ? "Tap to collapse" : "Tap for details"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SkipPrediction({ present, total }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 lg:p-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Skip Predictor</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">See impact before you skip</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((skip) => (
          <AdvancedPredictionCard key={skip} skip={skip} present={present} total={total} />
        ))}
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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{formattedDate}</h3>
                <p className="text-sm text-gray-500">{dayAttendance.length} lecture(s)</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-4 flex flex-col items-center">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{presentCount}</span>
              <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mt-1">Present</span>
            </div>
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 p-4 flex flex-col items-center">
              <span className="text-3xl font-black text-red-600 dark:text-red-400">{absentCount}</span>
              <span className="text-xs font-bold text-red-600/70 uppercase tracking-wider mt-1">Absent</span>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {dayAttendance.map((item: AnalyticsAttendance, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.subject}</span>
                <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  item.status === "PRESENT" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}