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
  return newTotal === 0 ? 0 : Number(((present * 100) / newTotal).toFixed(1));
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

function getStatusTheme(percent: number) {
  if (percent >= 75) return { color: "emerald", hex: "#10b981", text: "Safe Zone" };
  if (percent >= 60) return { color: "amber", hex: "#f59e0b", text: "At Risk" };
  return { color: "rose", hex: "#f43f5e", text: "Critical" };
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
      // Sort globally by date
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
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30 pb-24 transition-colors duration-300">
      
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 text-white">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight">Intelligence</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Analytics & Forecasts</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
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
              className="space-y-6 sm:space-y-8"
            >
              {/* === TOP KPI ROW === */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                <div className="md:col-span-8">
                  <OverallCard percentage={percentage} present={present} total={total} neededFor75={neededFor75} bunkable={bunkable} />
                </div>
                <div className="md:col-span-4">
                  <QuickStatsCard present={present} total={total} percentage={percentage} />
                </div>
              </div>

              {/* === MIDDLE BENTO ROW === */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TrendLineChart attendance={attendance} />
                </div>
                <div className="lg:col-span-1">
                  <SubjectPieChart data={bySubject} />
                </div>
              </div>

              {/* === BOTTOM BENTO ROW === */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubjectBarGraph data={bySubject} />
                <AttendanceCalendar attendance={attendance} monthOffset={monthOffset} setMonthOffset={setMonthOffset} onDateClick={setSelectedDate} />
              </div>

              {/* === WHAT-IF PREDICTOR === */}
              <SkipPrediction present={present} total={total} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Dialog Modal */}
      {selectedDate && <DateDialog date={selectedDate} attendance={attendance} onClose={() => setSelectedDate(null)} />}

      <AttendMateBottomNav />
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-lg shadow-indigo-500/20 mb-6" />
      <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest animate-pulse">Synthesizing Data...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-28 h-28 rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl flex items-center justify-center mb-6">
        <span className="text-5xl">📊</span>
      </div>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Not Enough Data</h3>
      <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm text-center">
        Your analytics engine will activate once you log your first attendance record.
      </p>
    </div>
  );
}

function OverallCard({ percentage, present, total, neededFor75, bunkable }: any) {
  const theme = getStatusTheme(percentage);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm h-full relative overflow-hidden flex flex-col justify-center">
      <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-[0.15] blur-3xl pointer-events-none bg-${theme.color}-500`} />
      
      <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-xl">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-800/50" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={theme.hex} strokeWidth="10" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={251.2 - (percentage / 100) * 251.2} className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl sm:text-4xl font-black" style={{ color: theme.hex }}>{percentage}%</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Performance</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border bg-${theme.color}-50 dark:bg-${theme.color}-500/10 text-${theme.color}-600 dark:text-${theme.color}-400 border-${theme.color}-200 dark:border-${theme.color}-500/20`}>
              {theme.text}
            </span>
          </div>

          <div className={`p-5 rounded-2xl border bg-${theme.color}-50/50 dark:bg-${theme.color}-500/5 border-${theme.color}-100 dark:border-${theme.color}-500/10`}>
            {percentage < 75 ? (
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                You need to attend <strong className={`text-${theme.color}-600 dark:text-${theme.color}-400 text-lg`}>{neededFor75}</strong> consecutive classes to reach the safe zone.
              </p>
            ) : (
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                You have a buffer of <strong className={`text-${theme.color}-600 dark:text-${theme.color}-400 text-lg`}>{bunkable}</strong> classes you can skip while staying above 75%.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStatsCard({ present, total }: any) {
  const absent = total - present;
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm h-full flex flex-col justify-center gap-4">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tracked</p>
        <p className="text-4xl font-black text-gray-900 dark:text-white">{total}</p>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-500/10">
          <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-1">Present</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{present}</p>
        </div>
        <div className="flex-1 bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl p-5 border border-rose-100 dark:border-rose-500/10">
          <p className="text-xs font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-widest mb-1">Absent</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{absent}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADVANCED SVG TREND LINE CHART ---------------- */
function TrendLineChart({ attendance }: { attendance: AnalyticsAttendance[] }) {
  const [svgWidth, setSvgWidth] = useState(800);
  const svgHeight = 220;
  const svgRef = useRef<SVGSVGElement>(null);
  
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
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 h-full flex flex-col items-center justify-center text-center shadow-sm">
        <span className="text-4xl mb-4 opacity-50">📈</span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chart Building...</h3>
        <p className="text-sm text-gray-500">Need at least 2 days of data to show trends.</p>
      </div>
    );
  }

  const yMax = 100;
  const yMin = Math.max(0, Math.min(...trendData.map(d => d.percent)) - 10);
  const yRange = yMax - yMin;
  const stepX = svgWidth / Math.max(1, trendData.length - 1);

  const points = trendData.map((d, i) => ({
    x: i * stepX,
    y: svgHeight - ((d.percent - yMin) / yRange) * svgHeight,
    ...d
  }));

  // Create smooth curve
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i].x + points[i + 1].x) / 2;
    path += ` C ${cpX} ${points[i].y}, ${cpX} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  const areaPath = `${path} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  // Grid lines
  const gridLines = [100, 75, 50].filter(val => val >= yMin);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Progression</h3>
        </div>
      </div>

      <div 
        className="relative flex-1 w-full min-h-[220px]"
        ref={node => { if (node && node.clientWidth !== svgWidth) setSvgWidth(node.clientWidth) }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <clipPath id="chartReveal">
              <motion.rect x="0" y="-10" width={svgWidth} height={svgHeight + 20} initial={{ width: 0 }} animate={{ width: svgWidth }} transition={{ duration: 1.5, ease: "easeOut" }} />
            </clipPath>
          </defs>

          {/* Horizontal Grid */}
          {gridLines.map((val) => {
            const y = svgHeight - ((val - yMin) / yRange) * svgHeight;
            return (
              <g key={val}>
                <line x1="0" y1={y} x2={svgWidth} y2={y} stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-gray-800" strokeWidth="1.5" />
                <text x="-10" y={y + 4} textAnchor="end" fill="currentColor" className="text-[10px] font-bold text-gray-400">{val}%</text>
              </g>
            );
          })}

          <g clipPath="url(#chartReveal)">
            <path d={areaPath} fill="url(#lineGradient)" />
            <path d={path} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="5" className="fill-white dark:fill-gray-900 stroke-indigo-500" strokeWidth="3" />
                <circle cx={p.x} cy={p.y} r="15" fill="transparent" /> {/* Hover target */}
              </g>
            ))}
          </g>
        </svg>
      </div>
      
      {/* X Axis Labels */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400">
        <span>{new Date(points[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

/* ---------------- BEAUTIFUL DONUT CHART ---------------- */
function SubjectPieChart({ data }: { data: Record<string, AnalyticsAttendance[]> }) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6'];
  const total = Object.values(data).reduce((s, l) => s + l.length, 0);

  let currentAngle = 0;
  const slices = Object.entries(data).sort((a,b)=>b[1].length - a[1].length).map(([subject, list], index) => {
    const count = list.length;
    const angle = (count / total) * 360;
    const x1 = 100 + 80 * Math.cos((currentAngle - 90) * (Math.PI / 180));
    const y1 = 100 + 80 * Math.sin((currentAngle - 90) * (Math.PI / 180));
    const x2 = 100 + 80 * Math.cos((currentAngle + angle - 90) * (Math.PI / 180));
    const y2 = 100 + 80 * Math.sin((currentAngle + angle - 90) * (Math.PI / 180));
    const largeArc = angle > 180 ? 1 : 0;
    const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
    currentAngle += angle;
    return { subject, count, percent: ((count/total)*100).toFixed(0), pathData, color: colors[index % colors.length] };
  });

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm h-full flex flex-col">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Subject Mix</h3>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
            {slices.map((s, i) => (
              <motion.path 
                key={s.subject} d={s.pathData} fill={s.color}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="hover:opacity-80 transition-opacity origin-center cursor-pointer"
              />
            ))}
            {/* Cutout for Donut */}
            <circle cx="100" cy="100" r="55" className="fill-white dark:fill-gray-900" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{total}</span>
          </div>
        </div>
        
        <div className="w-full space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
          {slices.map(s => (
            <div key={s.subject} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3 truncate">
                <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{s.subject}</span>
              </div>
              <span className="text-xs font-bold text-gray-400 flex-shrink-0">{s.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- HORIZONTAL STACKED PROGRESS BARS ---------------- */
function SubjectBarGraph({ data }: { data: Record<string, AnalyticsAttendance[]> }) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm h-full">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Subject Performance</h3>
      <div className="space-y-5">
        {Object.entries(data).sort((a,b) => b[1].length - a[1].length).map(([subject, list]) => {
          const present = list.filter(l => l.status === "PRESENT").length;
          const total = list.length;
          const percent = Number(((present / total) * 100).toFixed(1));
          const theme = getStatusTheme(percent);

          return (
            <div key={subject} className="group">
              <div className="flex justify-between items-end mb-2">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate pr-4">{subject}</p>
                <p className={`font-black text-sm text-${theme.color}-500`}>{percent}%</p>
              </div>
              <div className="relative h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute top-0 bottom-0 left-[75%] w-[2px] bg-red-500/50 z-10" />
                <motion.div 
                  initial={{ width: 0 }} 
                  whileInView={{ width: `${percent}%` }} 
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full bg-${theme.color}-500 relative z-0`} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- GITHUB STYLE CALENDAR HEATMAP ---------------- */
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

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Timeline</h3>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-24 text-center">{currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7-7" /></svg></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-gray-400">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 content-start">
        {days.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayData = attendance.filter((a: any) => a.date === dateStr);
          const hasData = dayData.length > 0;
          
          let bgColor = "bg-transparent border-transparent hover:border-gray-200 dark:hover:border-gray-700";
          if (hasData) {
            const allP = dayData.every((a: any) => a.status === "PRESENT");
            const allA = dayData.every((a: any) => a.status === "ABSENT");
            bgColor = allP ? "bg-emerald-500 shadow-md shadow-emerald-500/20 text-white border-emerald-500" : 
                      allA ? "bg-rose-500 shadow-md shadow-rose-500/20 text-white border-rose-500" : 
                             "bg-amber-500 shadow-md shadow-amber-500/20 text-white border-amber-500";
          }

          return (
            <button key={i} onClick={() => hasData && onDateClick(dateStr)} disabled={!hasData}
              className={`aspect-square rounded-[10px] sm:rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${bgColor} ${!hasData ? 'text-gray-400 dark:text-gray-600' : 'hover:scale-110 active:scale-95'}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- WHAT-IF PREDICTOR ---------------- */
function SkipPrediction({ present, total }: any) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Forecasting Engine</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Predict the impact of skipping future classes.</p>
        </div>
      </div>
      
      {/* Scrollable Row for Mobile, Grid for Desktop */}
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 pb-4 custom-scrollbar snap-x">
        {[1, 2, 3, 4].map(skip => {
          const newPercent = percentageAfterSkipping(present, total, skip);
          const theme = getStatusTheme(newPercent);
          return (
            <div key={skip} className={`min-w-[240px] lg:min-w-0 snap-center rounded-2xl border-2 p-5 bg-${theme.color}-50/30 dark:bg-${theme.color}-900/10 border-${theme.color}-100 dark:border-${theme.color}-800/40`}>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">If you skip</p>
              <div className="flex items-end justify-between mb-4">
                <span className={`text-4xl font-black text-${theme.color}-600 dark:text-${theme.color}-400`}>{skip}</span>
                <div className="text-right">
                  <p className={`text-lg font-bold text-${theme.color}-600 dark:text-${theme.color}-400`}>{newPercent}%</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider text-${theme.color}-500/70`}>{theme.text}</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full bg-${theme.color}-500`} style={{ width: `${newPercent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- DATE MODAL ---------------- */
function DateDialog({ date, attendance, onClose }: any) {
  const dayData = attendance.filter((a: any) => a.date === date);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm px-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-[#121827] rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
          {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
        </h3>
        <p className="text-sm font-semibold text-gray-500 mb-6">{dayData.length} records</p>
        
        <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {dayData.map((item: any, i: number) => (
            <div key={i} className={`p-4 rounded-2xl border-2 flex justify-between items-center ${item.status === 'PRESENT' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30'}`}>
              <span className="font-bold text-gray-900 dark:text-white truncate pr-4">{item.subject}</span>
              <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${item.status === 'PRESENT' ? 'bg-emerald-200/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-200/50 text-rose-700 dark:text-rose-400'}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}