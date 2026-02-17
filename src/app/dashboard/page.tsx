"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, getDoc, query, where, runTransaction, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AttendMateBottomNav from "@/components/navigation/AttendMateBottomNav";
import { motion, AnimatePresence } from "framer-motion";

type TodayLecture = {
  subjectName: string;
  status: "PRESENT" | "ABSENT";
  startTime: string;
  endTime: string;
};

type ActiveLecture = {
  subjectId: string;
  subjectName: string;
  startTime: Date;
  endTime: Date;
};

type SubjectStats = {
  name: string;
  attended: number;
  total: number;
  percentage: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const user = auth.currentUser;
  const [username, setUsername] = useState("User");
  const [todayLectures, setTodayLectures] = useState<TodayLecture[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [total, setTotal] = useState(0);
  const [attended, setAttended] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLecture, setActiveLecture] = useState<ActiveLecture | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  /* 🔐 AUTH GUARD */
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  /* 🔄 DATA LOAD */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        setUsername(userSnap.data()?.username ?? "User");

        const today = new Date();
        const day = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
        const now = today.toTimeString().slice(0, 5);

        const timetableSnap = await getDocs(
          query(collection(db, "users", user.uid, "timetable"), where("day", "==", day))
        );

        for (const d of timetableSnap.docs) {
          const { startTime, endTime, subjectId, subjectName } = d.data();
          if (now > startTime && now < endTime) {
            const dateKey = today.toISOString().split("T")[0];
            const lectureId = `${dateKey}_${startTime.replace(":", "")}_${endTime.replace(":", "")}`;
            const attRef = doc(db, "users", user.uid, "subjects", subjectId, "attendance", lectureId);
            if (!(await getDoc(attRef)).exists()) {
              setActiveLecture({
                subjectId,
                subjectName,
                startTime: new Date(`${dateKey}T${startTime}`),
                endTime: new Date(`${dateKey}T${endTime}`),
              });
              setShowDialog(true);
            }
            break;
          }
        }

        const subjectsSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
        let t = 0, a = 0;
        const todayList: TodayLecture[] = [];
        const statsMap: Map<string, SubjectStats> = new Map();

        for (const s of subjectsSnap.docs) {
          const subjectName = s.data().name;
          const attSnap = await getDocs(collection(s.ref, "attendance"));
          let subjectTotal = 0, subjectAttended = 0;

          for (const att of attSnap.docs) {
            const status = att.data().status?.toUpperCase();
            t++; subjectTotal++;
            if (status === "PRESENT") { a++; subjectAttended++; }

            const date = att.data().date?.toDate?.().toISOString().split("T")[0] ?? att.data().date;
            if (date !== new Date().toISOString().split("T")[0]) continue;

            todayList.push({
              subjectName,
              status,
              startTime: att.data().startTime?.toDate?.().toTimeString().slice(0, 5) ?? att.data().startTime,
              endTime: att.data().endTime?.toDate?.().toTimeString().slice(0, 5) ?? att.data().endTime,
            });
          }

          if (subjectTotal > 0) {
            statsMap.set(subjectName, {
              name: subjectName,
              attended: subjectAttended,
              total: subjectTotal,
              percentage: Number(((subjectAttended * 100) / subjectTotal).toFixed(1))
            });
          }
        }

        setTodayLectures(todayList.sort((a, b) => a.startTime.localeCompare(b.startTime)));
        setSubjectStats(Array.from(statsMap.values()).sort((a, b) => b.percentage - a.percentage));
        setTotal(t);
        setAttended(a);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";
  const greetingEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : hour < 21 ? "🌆" : "🌙";
  const percentage = total === 0 ? 0 : Number(((attended * 100) / total).toFixed(1));

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* ── COMPACT HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          {/* Left: avatar + greeting */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/25 flex-shrink-0">
              <span className="text-base leading-none">{greetingEmoji}</span>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-none mb-0.5">Good {greeting}</p>
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-none">
                {username} 👋
              </h1>
            </div>
          </div>

          {/* Right: date chip */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {error ? (
            <ErrorState key="error" error={error} />
          ) : loading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 sm:space-y-5"
            >
              {/* Quick Stats — 2x2 grid on mobile, 4-col on desktop */}
              <QuickStatsGrid
                total={total}
                attended={attended}
                percentage={percentage}
                todayCount={todayLectures.length}
              />

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Left 2/3 */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                  <AttendanceOverviewCard total={total} attended={attended} percentage={percentage} />
                  <TodayLecturesSection lectures={todayLectures} />
                </div>
                {/* Right 1/3 */}
                <div>
                  <SubjectPerformanceCard subjects={subjectStats} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ATTENDANCE DIALOG */}
      {showDialog && activeLecture && (
        <AttendanceDialog
          lecture={activeLecture}
          saving={saving}
          note={note}
          onNoteChange={setNote}
          onClose={() => {
            if (!saving) { setShowDialog(false); setActiveLecture(null); setNote(""); }
          }}
          onSubmit={async (status) => {
            setSaving(true);
            try {
              await runTransaction(db, async (tx) => {
                const subjectRef = doc(db, "users", user!.uid, "subjects", activeLecture.subjectId);
                const today = new Date();
                const dateKey = today.toISOString().split("T")[0];
                const lectureId = `${dateKey}_${activeLecture.startTime.toTimeString().slice(0,5).replace(":", "")}_${activeLecture.endTime.toTimeString().slice(0,5).replace(":", "")}`;
                const attRef = doc(subjectRef, "attendance", lectureId);
                if ((await tx.get(attRef)).exists()) throw new Error("Already marked");
                const snap = await tx.get(subjectRef);
                const attendanceData: any = {
                  status, date: Timestamp.fromDate(today),
                  startTime: Timestamp.fromDate(activeLecture.startTime),
                  endTime: Timestamp.fromDate(activeLecture.endTime),
                  createdAt: Timestamp.now(),
                };
                if (note.trim() !== "") attendanceData.note = note.trim();
                tx.set(attRef, attendanceData);
                tx.update(subjectRef, {
                  totalClasses: (snap.data()?.totalClasses ?? 0) + 1,
                  attendedClasses: (snap.data()?.attendedClasses ?? 0) + (status === "Present" ? 1 : 0),
                });
              });
              setSaving(false); setShowDialog(false); setNote("");
              location.reload();
            } catch (error) {
              console.error("Error saving attendance:", error);
              setSaving(false);
            }
          }}
        />
      )}

      <AttendMateBottomNav />
    </main>
  );
}

/* ──────────────────────────────────────────
   QUICK STATS GRID — 2×2 on mobile
────────────────────────────────────────── */
function QuickStatsGrid({ total, attended, percentage, todayCount }: {
  total: number; attended: number; percentage: number; todayCount: number;
}) {
  const absent = total - attended;
  const stats = [
    {
      label: "Attendance",
      value: `${percentage}%`,
      icon: "📊",
      gradient: "from-indigo-500 to-purple-600",
      light: "bg-indigo-50 dark:bg-indigo-950/40",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Attended",
      value: `${attended}/${total}`,
      icon: "✅",
      gradient: "from-emerald-500 to-teal-600",
      light: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Missed",
      value: absent,
      icon: "❌",
      gradient: "from-red-500 to-orange-500",
      light: "bg-red-50 dark:bg-red-950/40",
      text: "text-red-600 dark:text-red-400",
    },
    {
      label: "Today",
      value: todayCount,
      icon: "📅",
      gradient: "from-blue-500 to-cyan-500",
      light: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className={`${s.light} rounded-2xl p-3.5 sm:p-4 border border-white/60 dark:border-gray-700/40 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg leading-none">{s.icon}</span>
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${s.gradient}`} />
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${s.text} leading-none mb-1`}>{s.value}</p>
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   CIRCULAR PROGRESS — responsive, no window
────────────────────────────────────────── */
function CircularProgress({ percentage }: { percentage: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(percentage), 120); return () => clearTimeout(t); }, [percentage]);

  const size = 180;
  const sw = 14;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" style={{ filter: "drop-shadow(0 6px 20px rgba(99,102,241,0.25))" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={sw} fill="none" className="text-gray-100 dark:text-gray-800" />
        <circle cx={size/2} cy={size/2} r={r} stroke="url(#cpGrad)" strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="cpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{animated}%</span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Overall</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ATTENDANCE OVERVIEW CARD
────────────────────────────────────────── */
function AttendanceOverviewCard({ total, attended, percentage }: { total: number; attended: number; percentage: number }) {
  const absent = total - attended;
  const { color, text, icon } =
    percentage >= 75 ? { color: "emerald", text: "Excellent 🎉", icon: "🏆" } :
    percentage >= 60 ? { color: "amber",   text: "Good going 👍", icon: "📈" } :
                       { color: "red",     text: "Needs work 💪", icon: "⚠️" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      <div className="p-4 sm:p-6">
        {/* Title row */}
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/25 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Attendance Analytics</h2>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Your performance overview</p>
          </div>
        </div>

        {/* Progress + stats side by side */}
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
          <div className="flex-shrink-0">
            <CircularProgress percentage={percentage} />
          </div>

          <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
            {/* Status chip */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
              color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
              color === "amber"   ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>

            {/* Stat rows */}
            {[
              { label: "Attended", val: attended, col: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { label: "Missed",   val: absent,   col: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20" },
              { label: "Total",    val: total,    col: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            ].map((row) => (
              <div key={row.label} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl ${row.bg}`}>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{row.label}</span>
                <span className={`text-lg sm:text-xl font-bold ${row.col}`}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────
   TODAY'S LECTURES
────────────────────────────────────────── */
function TodayLecturesSection({ lectures }: { lectures: TodayLecture[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Today's Schedule</h2>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Your lectures for today</p>
          </div>
        </div>
        {lectures.length > 0 && (
          <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold">
            {lectures.length} {lectures.length === 1 ? "class" : "classes"}
          </span>
        )}
      </div>

      {lectures.length === 0 ? (
        <EmptyLectures />
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {lectures.map((lec, i) => <LectureCard key={i} lecture={lec} index={i} />)}
        </div>
      )}
    </motion.div>
  );
}

function EmptyLectures() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 sm:p-12 text-center shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-3">
        <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">No lectures today</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">Enjoy your free day! 🎉</p>
    </div>
  );
}

function LectureCard({ lecture, index }: { lecture: TodayLecture; index: number }) {
  const isPresent = lecture.status === "PRESENT";
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border-2 transition-all ${
        isPresent
          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
          : "bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800/50"
      }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isPresent ? "bg-emerald-500" : "bg-red-500"
      }`}>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={isPresent ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{lecture.subjectName}</p>
        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {lecture.startTime} – {lecture.endTime}
        </p>
      </div>

      {/* Badge */}
      <span className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold flex-shrink-0 ${
        isPresent ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
      }`}>
        {lecture.status}
      </span>
    </motion.div>
  );
}

/* ──────────────────────────────────────────
   SUBJECT PERFORMANCE
────────────────────────────────────────── */
function SubjectPerformanceCard({ subjects }: { subjects: SubjectStats[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm h-full"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/25 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">By Subject</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Ranked by attendance</p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">No subjects yet</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {subjects.slice(0, 6).map((s, i) => {
              const color = s.percentage >= 75 ? "emerald" : s.percentage >= 60 ? "amber" : "red";
              return (
                <div key={s.name} className="p-3 sm:p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold text-gray-300 dark:text-gray-600 flex-shrink-0">#{i + 1}</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{s.name}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ml-2 ${
                      color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      color === "amber"   ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                           "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {s.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        color === "emerald" ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
                        color === "amber"   ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                                             "bg-gradient-to-r from-red-400 to-rose-500"
                      }`}
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{s.attended}/{s.total} classes</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────
   ERROR & LOADING STATES
────────────────────────────────────────── */
function ErrorState({ error }: { error: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{error}</p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 h-24 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 h-64 animate-pulse" />
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 h-40 animate-pulse" />
        </div>
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 h-72 animate-pulse" />
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────
   ATTENDANCE DIALOG
────────────────────────────────────────── */
function AttendanceDialog({ lecture, saving, note, onNoteChange, onClose, onSubmit }: {
  lecture: ActiveLecture; saving: boolean; note: string;
  onNoteChange: (n: string) => void; onClose: () => void; onSubmit: (s: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-5 sm:p-6">
          {/* Drag handle (mobile) */}
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-5 sm:hidden" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Mark Attendance</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{lecture.subjectName}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/30 mb-4">
            <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
              {lecture.startTime.toTimeString().slice(0, 5)} – {lecture.endTime.toTimeString().slice(0, 5)}
            </span>
          </div>

          {/* Note */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add any remarks..."
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all resize-none outline-none"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onSubmit("Present")} disabled={saving}
              className="py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {saving ? "Saving…" : "Present"}
            </button>
            <button onClick={() => onSubmit("Absent")} disabled={saving}
              className="py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/25 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {saving ? "Saving…" : "Absent"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}