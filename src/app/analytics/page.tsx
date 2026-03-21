"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import {
  BarChart3,
  Clock,
  Calendar as CalendarIcon,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type AnalyticsAttendance = {
  subject: string;
  date: string;
  status: "PRESENT" | "ABSENT";
  startTime?: string | { toDate: () => Date };
};

/* ---------------- UTILS ---------------- */
function getAttendanceDeficit(present: number, total: number) {
  if (total === 0) return 0;
  if (present / total >= 0.75) return 0;
  return Math.ceil(0.75 * total - present);
}

function maxBunkableLectures(present: number, total: number) {
  if (total === 0) return 0;
  return Math.max(Math.floor(present / 0.75 - total), 0);
}

function percentageAfterSkipping(present: number, total: number, skip: number) {
  const newTotal = total + skip;
  return newTotal === 0 ? 0 : Number(((present * 100) / newTotal).toFixed(1));
}

// Strict Tailwind theme map to prevent purging issues
function getTheme(percent: number) {
  if (percent >= 75) return {
    color: "emerald", hex: "#10b981",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
    fill: "bg-emerald-500", stroke: "stroke-emerald-500",
    label: "Optimal"
  };
  if (percent >= 60) return {
    color: "amber", hex: "#f59e0b",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
    fill: "bg-amber-500", stroke: "stroke-amber-500",
    label: "Warning"
  };
  return {
    color: "rose", hex: "#f43f5e",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/20",
    fill: "bg-rose-500", stroke: "stroke-rose-500",
    label: "Critical"
  };
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
            startTime: doc.data().startTime,
          });
        });
      }
      temp.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setAttendance(temp);
      setLoading(false);
    };
    load();
  }, [router]);

  /* ---------- CALCULATIONS ---------- */
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const percentage = total === 0 ? 0 : Number(((present * 100) / total).toFixed(1));
  const theme = getTheme(percentage);

  // Streak calculations
  const datesSet = new Set(attendance.map((a) => a.date));
  const uniqueDates = Array.from(datesSet).sort();

  let maxStreak = 0;
  let tempStreak = 0;
  for (const date of uniqueDates) {
    const dayRecords = attendance.filter(a => a.date === date);
    const didMiss = dayRecords.some(a => a.status === "ABSENT");
    if (!didMiss && dayRecords.length > 0) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  let currentStreak = 0;
  for (let i = uniqueDates.length - 1; i >= 0; i--) {
    const date = uniqueDates[i];
    const dayRecords = attendance.filter(a => a.date === date);
    const didMiss = dayRecords.some(a => a.status === "ABSENT");
    if (!didMiss && dayRecords.length > 0) currentStreak++;
    else break;
  }

  const bySubject = useMemo(() => {
    return attendance.reduce<Record<string, AnalyticsAttendance[]>>((acc, a) => {
      acc[a.subject] = acc[a.subject] || [];
      acc[a.subject].push(a);
      return acc;
    }, {});
  }, [attendance]);

  return (
    <ProfessionalPageLayout>
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Data synced
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Performance Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-2xl">
              Advanced insights, consistency tracking, and attendance forecasting.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className={`p-2 rounded-lg ${theme.bg} ${theme.text}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Global Rate</p>
              <p className={`text-lg font-bold ${theme.text}`}>
                {percentage}%
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingState key="loading" />
            ) : attendance.length === 0 ? (
              <EmptyState key="empty" />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* ── Top Row: Overview & Streak ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Gauge Card */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                        <circle cx="50%" cy="50%" r="42%" className="stroke-gray-100 dark:stroke-zinc-800" strokeWidth="10" fill="transparent" />
                        <motion.circle
                          cx="50%" cy="50%" r="42%" fill="transparent"
                          className={theme.stroke}
                          strokeWidth="10" strokeLinecap="round"
                          strokeDasharray="264"
                          initial={{ strokeDashoffset: 264 }}
                          animate={{ strokeDashoffset: 264 - (percentage / 100) * 264 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="flex flex-col items-center justify-center z-10 text-center">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.text}`}>{theme.label}</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Attendance Health</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          {percentage >= 75
                            ? `You are in excellent standing. You can safely skip ${maxBunkableLectures(present, total)} upcoming classes while maintaining the required 75% threshold.`
                            : `Warning: You are currently short of the 75% threshold. You have a deficit of ${getAttendanceDeficit(present, total)} class${getAttendanceDeficit(present, total) > 1 ? 'es' : ''}. Attend upcoming classes to cover this deficit.`}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Attended</p>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">{present}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Missed</p>
                          <p className="text-xl font-bold text-rose-600 dark:text-rose-500">{total - present}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Streak Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-1">Attendance Streak</h4>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Current Consistency</p>

                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-end px-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current</span>
                        <span className="text-2xl font-bold text-primary">{currentStreak} <span className="text-sm font-medium text-gray-500">Days</span></span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((currentStreak / 30) * 100, 100)}%` }}
                          transition={{ duration: 1 }}
                          className="bg-primary h-full rounded-full"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 pt-1">Personal Best: {maxStreak} days</p>
                    </div>
                  </div>
                </div>

                {/* ── Middle Row: Charts ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[400px]">
                    <TrendLineChart attendance={attendance} themeHex={theme.hex} />
                  </div>
                  <div className="h-[400px]">
                    <TimeOfDayAnalysis attendance={attendance} />
                  </div>
                </div>

                {/* ── Bottom Row: Subjects & Calendar ── */}
                {/* Changed to remove fixed h-[450px] constraint, allowing content flex and natural stacking */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-5 h-full min-h-[400px]">
                    <SubjectBarGraph data={bySubject} />
                  </div>
                  <div className="lg:col-span-7 h-full min-h-[400px]">
                    <AttendanceCalendar
                      attendance={attendance}
                      monthOffset={monthOffset}
                      setMonthOffset={setMonthOffset}
                      onDateClick={setSelectedDate}
                    />
                  </div>
                </div>

                {/* ── Forecasting Section ── */}
                <SkipPrediction present={present} total={total} bySubject={bySubject} />

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date Dialog Modal */}
        <AnimatePresence>
          {selectedDate && <DateDialog date={selectedDate} attendance={attendance} onClose={() => setSelectedDate(null)} router={router} />}
        </AnimatePresence>
      </div>
    </ProfessionalPageLayout>
  );
}

/* ---------------- COMPONENTS ---------------- */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading analytics...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
        <Activity className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Data Yet</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Your analytics engine will activate once you log your first attendance record. Check back later!
      </p>
    </div>
  );
}

/* ---------------- TREND LINE CHART ---------------- */
function TrendLineChart({ attendance, themeHex }: { attendance: AnalyticsAttendance[], themeHex: string }) {
  const [svgWidth, setSvgWidth] = useState(800);
  const svgHeight = 220;

  const trendData = useMemo(() => {
    const dates = Array.from(new Set(attendance.map(a => a.date))).sort();
    if (dates.length < 2) return [];
    return dates.map(date => {
      const upToDate = attendance.filter(a => a.date <= date);
      const percent = (upToDate.filter(a => a.status === "PRESENT").length / upToDate.length) * 100;
      return { date, percent };
    });
  }, [attendance]);

  if (trendData.length < 2) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 h-full flex items-center justify-center text-center">
        <div>
          <TrendingUp className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Needs More History</h3>
          <p className="text-xs text-gray-500 mt-1">Log at least 2 unique days to see trends.</p>
        </div>
      </div>
    );
  }

  const yMax = 100;
  const yMin = Math.max(0, Math.min(...trendData.map(d => d.percent)) - 5);
  const yRange = yMax - yMin || 1;
  const paddingX = 20;
  const usableWidth = svgWidth - (paddingX * 2);
  const stepX = usableWidth / Math.max(1, trendData.length - 1);

  const points = trendData.map((d, i) => ({
    x: paddingX + (i * stepX),
    y: 20 + (svgHeight - 40) - ((d.percent - yMin) / yRange) * (svgHeight - 40),
    ...d
  }));

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i].x + points[i + 1].x) / 2;
    path += ` C ${cpX} ${points[i].y}, ${cpX} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  const areaPath = `${path} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Trend</h3>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Historical Progression</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-500 border border-gray-100 dark:border-zinc-700">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      <div className="relative flex-1 w-full" ref={node => { if (node && node.clientWidth !== svgWidth) setSvgWidth(node.clientWidth) }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeHex} stopOpacity="0.2" />
              <stop offset="100%" stopColor={themeHex} stopOpacity="0" />
            </linearGradient>
            <clipPath id="revealVelocity">
              <motion.rect
                x="0" y="0" width={svgWidth} height={svgHeight}
                initial={{ width: 0 }}
                animate={{ width: svgWidth }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </clipPath>
          </defs>

          {/* Grid Lines */}
          {[100, 75].filter(val => val >= yMin).map(val => {
            const y = 20 + (svgHeight - 40) - ((val - yMin) / yRange) * (svgHeight - 40);
            return (
              <g key={val}>
                <line x1="0" y1={y} x2={svgWidth} y2={y} stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-zinc-800" strokeWidth="1" />
                <text x="0" y={y - 6} fill="currentColor" className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500">{val}%</text>
              </g>
            )
          })}

          <g clipPath="url(#revealVelocity)">
            <path d={areaPath} fill="url(#velocityGrad)" />
            <path d={path} fill="none" stroke={themeHex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" className="fill-white dark:fill-zinc-900" stroke={themeHex} strokeWidth="2" />
            ))}
          </g>
        </svg>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        <span>{new Date(points[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

/* ---------------- TIME OF DAY ANALYSIS ---------------- */
function TimeOfDayAnalysis({ attendance }: { attendance: AnalyticsAttendance[] }) {
  const periods = [
    { id: 'morning', name: 'Morning', icon: '🌅', desc: 'Before 12 PM', present: 0, absent: 0 },
    { id: 'afternoon', name: 'Afternoon', icon: '☀️', desc: '12 PM - 4 PM', present: 0, absent: 0 },
    { id: 'evening', name: 'Evening', icon: '🌙', desc: 'After 4 PM', present: 0, absent: 0 }
  ];

  attendance.forEach(a => {
    if (!a.startTime) return;
    try {
      let hours = 12;
      const timeStr = typeof a.startTime === 'string' ? a.startTime :
        (a.startTime as any).toDate ? (a.startTime as any).toDate().toLocaleTimeString() : "";

      const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1]);
        const meridiem = match[3]?.toUpperCase();
        if (meridiem === "PM" && hours !== 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;
      }

      let periodIdx = 0;
      if (hours >= 12 && hours < 16) periodIdx = 1;
      else if (hours >= 16) periodIdx = 2;

      if (a.status === 'PRESENT') periods[periodIdx].present++;
      else periods[periodIdx].absent++;
    } catch { }
  });

  const maxClasses = Math.max(...periods.map(s => s.present + s.absent), 1);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Time Analysis</h3>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Attendance by Period</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-500 border border-gray-100 dark:border-zinc-700">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="flex flex-col justify-around flex-1 gap-6">
        {periods.map((stat, i) => {
          const total = stat.present + stat.absent;
          const percent = total > 0 ? (stat.present / total) * 100 : 0;
          const width = total > 0 ? ((stat.present + stat.absent) / maxClasses) * 100 : 0;
          const pWidth = total > 0 ? (stat.present / total) * 100 : 0;
          const theme = getTheme(percent);

          return (
            <div key={i} className="flex flex-col gap-2.5">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{stat.icon}</span>
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{stat.name}</span>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{stat.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-gray-500 mr-2 uppercase tracking-wider">{total} Classes</span>
                  <span className={`text-sm font-bold ${total > 0 ? theme.text : 'text-gray-400'}`}>
                    {total > 0 ? `${percent.toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Background track relative to max classes */}
              <div className="w-full h-2.5 rounded-full flex items-center">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.8 }}
                  className="h-full bg-gray-100 dark:bg-zinc-800 rounded-full relative overflow-hidden flex"
                >
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pWidth}%` }} transition={{ duration: 1, delay: 0.1 }}
                    className={`h-full ${total > 0 ? theme.fill : 'bg-gray-300 dark:bg-zinc-700'}`}
                  />
                  <div className="flex-1 bg-transparent h-full" />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- SUBJECT BAR GRAPH ---------------- */
function SubjectBarGraph({ data }: { data: Record<string, AnalyticsAttendance[]> }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subject Breakdown</h3>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Individual Metrics</p>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(data).sort((a, b) => b[1].length - a[1].length).map(([subject, list]) => {
          const present = list.filter(l => l.status === "PRESENT").length;
          const total = list.length;
          const percent = Number(((present / total) * 100).toFixed(1));
          const theme = getTheme(percent);

          return (
            <div key={subject}>
              <div className="flex justify-between items-end mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate pr-4">{subject}</p>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{total} Sessions</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${theme.text}`}>{percent}%</p>
                </div>
              </div>
              <div className="relative h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="absolute top-0 bottom-0 left-[75%] w-[2px] bg-gray-300 dark:bg-zinc-600 z-10" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1 }}
                  className={`h-full rounded-full ${theme.fill} relative z-0`}
                />
              </div>
            </div>
          );
        })}
        {Object.keys(data).length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">No subjects tracked yet.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- CONSISTENCY MAP ---------------- */
function AttendanceCalendar({ attendance, monthOffset, setMonthOffset, onDateClick }: any) {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + monthOffset);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  while (days.length % 7 !== 0) days.push(null);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Calendar View</h3>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Daily Log</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-bold text-gray-900 dark:text-white w-28 text-center">{currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-gray-500"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-center text-xs font-bold text-gray-400 dark:text-zinc-500 py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3 flex-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} className="w-full aspect-square bg-transparent" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayData = attendance.filter((a: any) => a.date === dateStr);
          const hasData = dayData.length > 0;

          let cellClasses = "bg-gray-50 dark:bg-[#1C1C1E] text-gray-400 dark:text-zinc-600 border border-gray-100 dark:border-zinc-800/50";
          if (hasData) {
            const presentCount = dayData.filter((a: any) => a.status === "PRESENT").length;
            const percent = (presentCount / dayData.length) * 100;

            if (percent === 100) cellClasses = "bg-emerald-500 text-white shadow-sm border-transparent";
            else if (percent >= 75) cellClasses = "bg-emerald-400 text-white shadow-sm border-transparent";
            else if (percent >= 50) cellClasses = "bg-amber-400 text-white shadow-sm border-transparent";
            else cellClasses = "bg-rose-500 text-white shadow-sm border-transparent";
          }

          return (
            <button
              key={i}
              onClick={() => hasData && onDateClick(dateStr)}
              disabled={!hasData}
              className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${cellClasses} ${hasData ? 'cursor-pointer hover:scale-[1.05] active:scale-95 hover:shadow-md' : 'cursor-default'}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800">
        {[
          { color: "bg-emerald-500", label: "100%" },
          { color: "bg-amber-400", label: "50-74%" },
          { color: "bg-rose-500", label: "< 50%" },
          { color: "bg-gray-100 dark:bg-[#1C1C1E]", label: "Empty" }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-md ${item.color}`}></div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- FORECASTING ENGINE ---------------- */
function SkipPrediction({ present, total, bySubject }: { present: number, total: number, bySubject: Record<string, AnalyticsAttendance[]> }) {
  const [selectedSubject, setSelectedSubject] = useState<string>("Global");

  const currentStats = useMemo(() => {
    if (selectedSubject === "Global") {
      return { p: present, t: total };
    }
    const list = bySubject[selectedSubject] || [];
    return {
      p: list.filter(l => l.status === "PRESENT").length,
      t: list.length
    };
  }, [selectedSubject, present, total, bySubject]);

  return (
    <div className="pt-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Smart Forecast</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Impact analysis for skipping upcoming classes</p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setSelectedSubject("Global")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${selectedSubject === "Global" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
          >
            Overall
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700" />
          <select
            value={selectedSubject === "Global" ? "" : selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value || "Global")}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-semibold bg-transparent outline-none cursor-pointer appearance-none ${selectedSubject !== "Global" ? "text-primary" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <option value="" disabled className="dark:bg-zinc-900">Subjects</option>
            {Object.keys(bySubject).map(s => (
              <option key={s} value={s} className="dark:bg-zinc-900">{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(skip => {
          const newPercent = percentageAfterSkipping(currentStats.p, currentStats.t, skip);
          const theme = getTheme(newPercent);

          let severityIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
          let advice = "Safe to skip";

          if (newPercent < 75) {
            severityIcon = <AlertCircle className="w-5 h-5 text-rose-500" />;
            const needed = Math.ceil((0.75 * (currentStats.t + skip) - currentStats.p) / 0.25);
            advice = `Will require +${needed} classes`;
          } else if (newPercent < 80) {
            severityIcon = <AlertCircle className="w-5 h-5 text-amber-500" />;
            advice = "Buffer getting thin";
          }

          return (
            <div key={skip} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Miss {skip} Class{skip > 1 ? 'es' : ''}</span>
                {severityIcon}
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{newPercent.toFixed(1)}%</span>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                <span className={`text-xs font-semibold ${theme.text}`}>{theme.label}</span>
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{advice}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- DATE MODAL ---------------- */
function DateDialog({ date, attendance, onClose, router }: any) {
  const dayData = attendance.filter((a: any) => a.date === date);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {new Date(date).toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily Attendance Log</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {dayData.length === 0 ? (
            <p className="text-sm text-center text-gray-500 py-10">No records found for this date.</p>
          ) : (
            dayData.map((item: any, idx: number) => {
              const isPresent = item.status === 'PRESENT';
              return (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{item.subject}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {typeof item.startTime === 'string' ? item.startTime : 'Recorded'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${isPresent ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                    {item.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <button
            onClick={() => {
              router.push(`/attendance?date=${date}`);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold text-sm transition-colors"
          >
            View Full Timeline
          </button>
        </div>
      </motion.div>
    </div>
  );
}