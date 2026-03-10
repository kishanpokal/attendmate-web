"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AttendMateBottomNav from "@/components/navigation/AttendMateBottomNav";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";

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
  return newTotal === 0 ? 0 : Number(((present * 100) / newTotal).toFixed(1));
}

function getStatusTheme(percent: number) {
  if (percent >= 75) return { color: "emerald", hex: "#10b981", text: "Optimal", lightBg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (percent >= 60) return { color: "amber", hex: "#f59e0b", text: "Warning", lightBg: "bg-amber-500/10", border: "border-amber-500/20" };
  return { color: "rose", hex: "#f43f5e", text: "Critical", lightBg: "bg-rose-500/10", border: "border-rose-500/20" };
}

// Fade in up animation variant
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

/* ---------------- MAIN PAGE ---------------- */
export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AnalyticsAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const { scrollYProgress } = useScroll();
  const yRange = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const ySpring = useSpring(yRange, { stiffness: 400, damping: 90 });

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

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  const datesSet = new Set(attendance.map((a) => a.date));
  const uniqueDates = Array.from(datesSet).sort();

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

  currentStreak = 0;
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
    <main className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-500 overflow-x-hidden pb-40">

      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/10 dark:bg-indigo-900/20 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-purple-500/10 dark:bg-purple-900/20 blur-[120px]"
        />
      </div>

      {/* HEADER */}
      <header className="relative z-40 px-6 pt-12 pb-6 md:px-10 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
          <h2 className="text-sm font-bold tracking-widest text-[#6467f2] uppercase mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Intelligence
          </h2>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 dark:text-white">
            Analytics
          </h1>
        </motion.div>
      </header>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingState key="loading" />
          ) : attendance.length === 0 ? (
            <EmptyState key="empty" />
          ) : (
            <motion.div
              key="content"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6 md:space-y-8"
              style={{ y: ySpring }}
            >
              {/* === Top Cards === */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Main Gauge Card */}
                <motion.div variants={fadeInUp} className="md:col-span-8 lg:col-span-8 bg-white/60 dark:bg-[#111111]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-white/5 relative overflow-hidden group">
                  <div className={`absolute -right-20 -top-20 w-64 h-64 bg-${getStatusTheme(percentage).color}-500/20 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-1000`} />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10 h-full">
                    <div className="flex-1 space-y-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-xl bg-${getStatusTheme(percentage).color}-500/10 text-${getStatusTheme(percentage).color}-500`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">System Status</h3>
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm">
                          {percentage >= 75
                            ? `You have a buffer of ${maxBunkableLectures(present, total)} classes you can safely miss.`
                            : `Critical status. You need ${lecturesNeededFor75(present, total)} consecutive classes to reach 75%.`}
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <div className="bg-gray-50 dark:bg-black/50 rounded-2xl p-4 border border-gray-100 dark:border-white/5 flex-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-900 cursor-default">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                          <p className="text-2xl font-black text-gray-800 dark:text-gray-200">{total}</p>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/10 flex-1 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-default">
                          <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest mb-1">Present</p>
                          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{present}</p>
                        </div>
                        <div className="bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl p-4 border border-rose-100 dark:border-rose-500/10 flex-1 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-default">
                          <p className="text-[10px] font-bold text-rose-600/70 dark:text-rose-500/70 uppercase tracking-widest mb-1">Absent</p>
                          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{total - present}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl absolute inset-0">
                        <circle cx="50%" cy="50%" r="42%" className="stroke-gray-100 dark:stroke-white/5" strokeWidth="6" fill="transparent" />
                        <motion.circle cx="50%" cy="50%" r="42%" fill="transparent" className={`stroke-${getStatusTheme(percentage).color}-500`} strokeWidth="12" strokeLinecap="round" strokeDasharray="264" initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (percentage / 100) * 264 }} transition={{ duration: 2, ease: "easeOut", delay: 0.5 }} />
                      </svg>
                      <div className="flex flex-col items-center justify-center z-10 text-center">
                        <span className="text-5xl font-black tracking-tighter" style={{ color: getStatusTheme(percentage).hex }}>{percentage}%</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-${getStatusTheme(percentage).color}-500/80`}>{getStatusTheme(percentage).text}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Streak Card */}
                <motion.div variants={fadeInUp} className="md:col-span-4 lg:col-span-4 bg-gradient-to-br from-[#6467f2] to-[#8a2be2] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-[#6467f2]/20 group flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-colors duration-700" />

                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-xl flex items-center justify-center mb-6">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                    </div>
                    <p className="text-sm font-bold text-white/70 uppercase tracking-widest mb-1">Consistency Streak</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-6xl font-black tracking-tighter leading-none">{currentStreak}</h3>
                      <span className="text-xl font-bold text-white/80 pb-1">Days</span>
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 bg-black/20 rounded-2xl p-4 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider">All-time Best</span>
                    <span className="text-lg font-black">{maxStreak} Days</span>
                  </div>
                </motion.div>
              </div>

              {/* === Middle Row === */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={fadeInUp} className="h-[380px]">
                  <TrendLineChart attendance={attendance} />
                </motion.div>
                <motion.div variants={fadeInUp} className="h-[380px]">
                  <WeeklyHeatmap attendance={attendance} />
                </motion.div>
              </div>

              {/* === Bottom Row === */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <motion.div variants={fadeInUp} className="lg:col-span-5 h-[420px]">
                  <SubjectBarGraph data={bySubject} />
                </motion.div>
                <motion.div variants={fadeInUp} className="lg:col-span-7 h-[420px]">
                  <AttendanceCalendar attendance={attendance} monthOffset={monthOffset} setMonthOffset={setMonthOffset} onDateClick={setSelectedDate} />
                </motion.div>
              </div>

              {/* === FORECASTING TRAY === */}
              <motion.div variants={fadeInUp}>
                <SkipPrediction present={present} total={total} />
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Dialog Modal */}
      <AnimatePresence>
        {selectedDate && <DateDialog date={selectedDate} attendance={attendance} onClose={() => setSelectedDate(null)} router={router} />}
      </AnimatePresence>

      <AttendMateBottomNav />
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

/* ThemeToggle is now in @/components/ThemeToggle.tsx and used globally in AttendMateBottomNav */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative w-24 h-24">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-[#6467f2]/20 border-t-[#6467f2] rounded-full" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border-4 border-purple-500/20 border-b-purple-500 rounded-full" />
      </div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Aggregating Metrics</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }} className="w-32 h-32 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center mb-8 border border-indigo-100 dark:border-indigo-800/20">
        <svg className="w-16 h-16 text-[#6467f2]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      </motion.div>
      <h3 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3">No Data Yet</h3>
      <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm text-center">
        Your analytics engine will activate once you log your first attendance record. Start tracking to see insights.
      </p>
    </div>
  );
}

/* ---------------- ADVANCED SVG TREND LINE CHART ---------------- */
function TrendLineChart({ attendance }: { attendance: AnalyticsAttendance[] }) {
  const [svgWidth, setSvgWidth] = useState(800);
  const svgHeight = 220;

  const trendData = useMemo(() => {
    const dates = Array.from(new Set(attendance.map(a => a.date))).sort(); // All-time data
    if (dates.length < 2) return [];
    return dates.map(date => {
      const upToDate = attendance.filter(a => a.date <= date);
      const percent = (upToDate.filter(a => a.status === "PRESENT").length / upToDate.length) * 100;
      return { date, percent };
    });
  }, [attendance]);

  if (trendData.length < 2) {
    return (
      <div className="bg-white/60 dark:bg-[#111111]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 dark:border-white/5 h-full flex items-center justify-center text-center">
        <div>
          <span className="text-4xl mb-4 block opacity-30 text-[#6467f2]">📈</span>
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Needs More History</h3>
          <p className="text-sm text-gray-500 mt-2">Log at least 2 unique days to see progression trends.</p>
        </div>
      </div>
    );
  }

  const yMax = 100;
  const yMin = Math.max(0, Math.min(...trendData.map(d => d.percent)) - 5);
  const yRange = yMax - yMin || 1;
  const stepX = svgWidth / Math.max(1, trendData.length - 1);

  const points = trendData.map((d, i) => ({
    x: i * stepX,
    y: svgHeight - ((d.percent - yMin) / yRange) * svgHeight,
    ...d
  }));

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i].x + points[i + 1].x) / 2;
    path += ` C ${cpX} ${points[i].y}, ${cpX} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  const areaPath = `${path} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <div className="bg-white/60 dark:bg-[#111111]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 dark:border-white/5 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Progression Velocity</h3>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">All-time cumulative trend</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
      </div>

      <div className="relative flex-1 w-full" ref={node => { if (node && node.clientWidth !== svgWidth) setSvgWidth(node.clientWidth) }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6467f2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6467f2" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="revealVelocity">
              <motion.rect x="-20" y="-20" width={svgWidth + 40} height={svgHeight + 40} initial={{ width: 0 }} animate={{ width: svgWidth + 40 }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
            </clipPath>
          </defs>

          {[100, 75].filter(val => val >= yMin).map(val => {
            const y = svgHeight - ((val - yMin) / yRange) * svgHeight;
            return (
              <g key={val}>
                <line x1="0" y1={y} x2={svgWidth} y2={y} stroke="currentColor" strokeDasharray="6 6" className="text-gray-200 dark:text-white/10" strokeWidth="1.5" />
                <text x="0" y={y - 6} fill="currentColor" className="text-[10px] font-bold text-gray-400">{val}%</text>
              </g>
            )
          })}

          <g clipPath="url(#revealVelocity)">
            <path d={areaPath} fill="url(#velocityGrad)" />
            <path d={path} fill="none" stroke="#6467f2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="5" className="fill-white dark:fill-black stroke-[#6467f2]" strokeWidth="3" />
            ))}
          </g>
        </svg>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-white/5 text-[11px] font-bold text-gray-400 uppercase tracking-widest relative">
        <span>{new Date(points[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

/* ---------------- WEEKLY HEATMAP ---------------- */
function WeeklyHeatmap({ attendance }: { attendance: AnalyticsAttendance[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = days.map(d => ({ name: d, present: 0, absent: 0 }));

  attendance.forEach(a => {
    const dayIndex = new Date(a.date).getDay();
    if (a.status === 'PRESENT') dayStats[dayIndex].present++;
    else dayStats[dayIndex].absent++;
  });

  const sortedStats = [...dayStats.slice(1), dayStats[0]];
  const maxClasses = Math.max(...sortedStats.map(s => s.present + s.absent), 1);

  return (
    <div className="bg-white/60 dark:bg-[#111111]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 dark:border-white/5 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Performance</h3>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Distribution by day</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
      </div>

      <div className="flex h-40 items-end justify-between gap-3 sm:gap-4 flex-1">
        {sortedStats.map((stat, i) => {
          const total = stat.present + stat.absent;
          const percent = total > 0 ? (stat.present / total) * 100 : 0;
          const pHeight = total > 0 ? (stat.present / maxClasses) * 100 : 0;
          const aHeight = total > 0 ? (stat.absent / maxClasses) * 100 : 0;
          const theme = getStatusTheme(percent);

          return (
            <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
              <div className="w-full max-w-[32px] bg-gray-100 dark:bg-white/5 rounded-full h-full flex flex-col-reverse justify-start overflow-hidden relative group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">
                <motion.div
                  initial={{ height: 0 }} whileInView={{ height: `${pHeight}%` }} viewport={{ once: true }} transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                  className={`w-full bg-${total > 0 ? theme.color : 'gray'}-500 rounded-b-full`}
                />
                <motion.div
                  initial={{ height: 0 }} whileInView={{ height: `${aHeight}%` }} viewport={{ once: true }} transition={{ duration: 0.8, type: "spring", stiffness: 100, delay: 0.1 }}
                  className="w-full bg-gray-300 dark:bg-gray-600 rounded-t-full"
                />
              </div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{stat.name.substring(0, 3)}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20"></div><span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Present</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Absent</span></div>
      </div>
    </div>
  );
}


/* ---------------- SUBJECT BAR GRAPH ---------------- */
function SubjectBarGraph({ data }: { data: Record<string, AnalyticsAttendance[]> }) {
  return (
    <div className="bg-white/60 dark:bg-[#111111]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 dark:border-white/5 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Subject Drilldown</h3>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Individual course health</p>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(data).sort((a, b) => b[1].length - a[1].length).map(([subject, list]) => {
          const present = list.filter(l => l.status === "PRESENT").length;
          const total = list.length;
          const percent = Number(((present / total) * 100).toFixed(1));
          const theme = getStatusTheme(percent);

          return (
            <div key={subject} className="group">
              <div className="flex justify-between items-end mb-2">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate pr-4">{subject}</p>
                <div className="text-right">
                  <p className={`font-black text-sm text-${theme.color}-500`}>{percent}%</p>
                </div>
              </div>
              <div className="relative h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div className="absolute top-0 bottom-0 left-[75%] w-[2px] bg-red-500/50 z-10 box-content px-px bg-clip-content" />
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
                  className={`h-full rounded-full bg-${theme.color}-500 shadow-[0_0_10px_rgba(0,0,0,0.2)] shadow-${theme.color}-500/50 relative z-0`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- CONSISTENCY MAP (improved layout) ---------------- */
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

  // Fill trailing nulls so the grid ends on a complete row
  while (days.length % 7 !== 0) days.push(null);

  return (
    <div className="bg-white/60 dark:bg-[#111111]/80 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 border border-white/50 dark:border-white/5 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      {/* Header with Month Nav */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Consistency Map</h3>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Daily activity pulse</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-white/5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMonthOffset(monthOffset - 1)} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></motion.button>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-28 text-center">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMonthOffset(monthOffset + 1)} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></motion.button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => <div key={i} className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 py-1">{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 flex-1 content-start">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayData = attendance.filter((a: any) => a.date === dateStr);
          const hasData = dayData.length > 0;

          let cellClasses = "bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-600 border-transparent";
          if (hasData) {
            const presentCount = dayData.filter((a: any) => a.status === "PRESENT").length;
            const percent = (presentCount / dayData.length) * 100;

            if (percent === 100) cellClasses = "bg-emerald-500 text-white border-emerald-500/50 shadow-lg shadow-emerald-500/20";
            else if (percent >= 75) cellClasses = "bg-emerald-400 text-white border-emerald-400/50 shadow-md shadow-emerald-400/15";
            else if (percent >= 50) cellClasses = "bg-amber-400 text-white border-amber-400/50 shadow-md shadow-amber-400/15";
            else if (percent > 0) cellClasses = "bg-rose-400 text-white border-rose-400/50 shadow-md shadow-rose-400/15";
            else cellClasses = "bg-rose-500 text-white border-rose-500/50 shadow-lg shadow-rose-500/20";
          }

          return (
            <motion.button
              key={i}
              onClick={() => hasData && onDateClick(dateStr)}
              disabled={!hasData}
              whileHover={hasData ? { scale: 1.2, zIndex: 10 } : {}}
              whileTap={hasData ? { scale: 0.9 } : {}}
              className={`h-10 sm:h-12 rounded-lg flex items-center justify-center text-xs font-bold border transition-all duration-200 ${cellClasses} ${hasData ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-400/50 dark:hover:ring-offset-black' : 'cursor-default'}`}
            >
              {day}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-emerald-500"></div><span className="text-[10px] text-gray-400 font-bold">100%</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-amber-400"></div><span className="text-[10px] text-gray-400 font-bold">50-74%</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-rose-500"></div><span className="text-[10px] text-gray-400 font-bold">&lt;50%</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-gray-100 dark:bg-white/5"></div><span className="text-[10px] text-gray-400 font-bold">No data</span></div>
      </div>
    </div>
  );
}

/* ---------------- FORECASTING TRAY ---------------- */
function SkipPrediction({ present, total }: any) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">Forecasting Engine</h3>
          <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">Predict safe skipping limits</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-8 custom-scrollbar snap-x">
        {[1, 2, 3, 4].map(skip => {
          const newPercent = percentageAfterSkipping(present, total, skip);
          const theme = getStatusTheme(newPercent);

          let severityText = "SAFE";
          if (newPercent < 75) severityText = "DANGER ZONE";
          else if (newPercent < 80) severityText = "CAUTION";

          return (
            <motion.div
              key={skip}
              whileHover={{ y: -10 }}
              className={`snap-center shrink-0 w-72 bg-white/60 dark:bg-[#111111]/80 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border relative overflow-hidden ${theme.border}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${theme.lightBg} blur-2xl rounded-full -mr-10 -mt-10`} />

              <div className="relative z-10">
                <p className={`text-[10px] font-black uppercase tracking-widest text-${theme.color}-500 mb-2`}>{severityText}</p>
                <p className="text-base font-bold text-gray-800 dark:text-gray-200">If you skip {skip} {skip === 1 ? 'class' : 'classes'}</p>

                <div className="mt-6 flex items-end justify-between">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{newPercent.toFixed(0)}%</span>
                    <span className={`text-${theme.color}-500 mb-1.5`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={newPercent >= 75 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} /></svg>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-wider text-${theme.color}-500/70`}>Result</p>
                    <p className={`text-sm font-bold text-${theme.color}-500`}>{theme.text}</p>
                  </div>
                </div>
              </div>
            </motion.div>
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
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, backdropFilter: "blur(8px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} onClick={onClose} className="absolute inset-0 bg-gray-900/40 dark:bg-black/80" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col max-h-[85vh]"
      >
        <div className="px-8 py-6 bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight relative z-10">
            {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 relative z-10">{dayData.length} records</p>

          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-200/50 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors z-20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {dayData.map((item: any, i: number) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className={`p-4 rounded-2xl border-2 flex justify-between items-center ${item.status === 'PRESENT' ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10' : 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10'}`}
            >
              <div className="flex items-center gap-3 truncate pr-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-rose-500 text-white shadow-rose-500/30'} shadow-md`}>
                  {item.status === 'PRESENT' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                </div>
                <span className="font-bold text-gray-900 dark:text-white truncate">{item.subject}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-white dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-white/5 pb-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onClose();
              router.push(`/attendance?date=${date}`);
            }}
            className="w-full py-4 bg-gradient-to-r from-[#6467f2] to-[#8a2be2] text-white rounded-[1.25rem] font-black text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 tracking-wide"
          >
            Open in Attendance List
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}