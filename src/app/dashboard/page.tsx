"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, getDoc, query, where, runTransaction, Timestamp, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AttendMateBottomNav from "@/components/navigation/AttendMateBottomNav";
import { motion, AnimatePresence } from "framer-motion";

type TodayLecture = {
  subjectName: string;
  status: "PRESENT" | "ABSENT";
  startTime: string;
  endTime: string;
  note?: string; // Added note property
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

            const attNote = att.data().note || ""; // Extracting note

            todayList.push({
              subjectName,
              status,
              startTime: att.data().startTime?.toDate?.().toTimeString().slice(0, 5) ?? att.data().startTime,
              endTime: att.data().endTime?.toDate?.().toTimeString().slice(0, 5) ?? att.data().endTime,
              note: attNote, // Saving note
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

        const sortedTodayList = todayList.sort((l1, l2) => l1.startTime.localeCompare(l2.startTime));
        setTodayLectures(sortedTodayList);
        setSubjectStats(Array.from(statsMap.values()).sort((s1, s2) => s2.percentage - s1.percentage));
        setTotal(t);
        setAttended(a);

        // ✅ Save daily snapshot exactly like the Android app
        await saveDailySnapshot(user.uid, sortedTodayList, t, a);

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
    <main className="min-h-screen relative bg-[#f8fafc] dark:bg-[#0b0f19] pb-24 overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* ── ANIMATED BACKGROUND ORBS ── */}
      <AnimatedBackground />

      {/* ── COMPACT GLASS HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-white/60 dark:bg-[#0b0f19]/60 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 supports-[backdrop-filter]:bg-background/60"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 border border-white/20">
              <span className="text-xl sm:text-2xl leading-none">{greetingEmoji}</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-none mb-1 sm:mb-1.5 tracking-wide uppercase">Good {greeting}</p>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                {username}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              {new Date().toLocaleDateString("en-US", { weekday: 'short', month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {error ? (
            <ErrorState key="error" error={error} />
          ) : loading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6 sm:space-y-8"
            >
              <QuickStatsGrid total={total} attended={attended} percentage={percentage} todayCount={todayLectures.length} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Main Left Column (8 cols on desktop) */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                  <AttendanceOverviewCard total={total} attended={attended} percentage={percentage} />
                  <TodayLecturesSection lectures={todayLectures} />
                </div>
                {/* Sidebar Right Column (4 cols on desktop) */}
                <div className="lg:col-span-4">
                  <SubjectPerformanceCard subjects={subjectStats} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ATTENDANCE DIALOG (FIXED CENTER) ── */}
      <AnimatePresence>
        {showDialog && activeLecture && (
          <AttendanceDialog
            lecture={activeLecture}
            saving={saving}
            note={note}
            onNoteChange={setNote}
            onClose={() => {
              if (!saving) { setShowDialog(false); setActiveLecture(null); setNote(""); }
            }}
            onSubmit={async (status: string) => {
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
      </AnimatePresence>

      <AttendMateBottomNav />
    </main>
  );
}

/* ──────────────────────────────────────────
   SNAPSHOT HELPER FUNCTION
────────────────────────────────────────── */
async function saveDailySnapshot(userId: string, todayLectures: TodayLecture[], total: number, attended: number) {
  try {
    const todayDate = new Date().toISOString().split("T")[0];
    const percentage = total === 0 ? 0 : Number(((attended * 100) / total).toFixed(1));

    const lectureMap: Record<string, any> = {};
    todayLectures.forEach((lecture) => {
      const uniqueKey = `${lecture.subjectName}_${lecture.startTime.replace(":", "")}`;
      lectureMap[uniqueKey] = {
        subjectName: lecture.subjectName,
        status: lecture.status,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        note: lecture.note || ""
      };
    });

    const snapshotRef = doc(db, "users", userId, "dailySnapshot", todayDate);
    const data = {
      date: todayDate,
      totalClasses: total,
      attendedClasses: attended,
      percentage: percentage,
      lectures: lectureMap,
      updatedAt: serverTimestamp()
    };

    await setDoc(snapshotRef, data);
    console.log("Successfully saved snapshot with multiple same-subject lectures!");
  } catch (error) {
    console.error("Failed to save snapshot", error);
  }
}

/* ──────────────────────────────────────────
   ANIMATED BACKGROUND
────────────────────────────────────────── */
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[120px]"
      />
    </div>
  );
}

/* ──────────────────────────────────────────
   QUICK STATS GRID
────────────────────────────────────────── */
function QuickStatsGrid({ total, attended, percentage, todayCount }: any) {
  const absent = total - attended;
  const stats = [
    { label: "Overall Rate", value: `${percentage}%`, icon: "🎯", gradient: "from-indigo-500 to-blue-600", light: "bg-indigo-500/5 border-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
    { label: "Attended", value: `${attended}/${total}`, icon: "✨", gradient: "from-emerald-400 to-teal-500", light: "bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    { label: "Missed", value: absent, icon: "⚠️", gradient: "from-rose-400 to-red-500", light: "bg-rose-500/5 border-rose-500/10 text-rose-700 dark:text-rose-400" },
    { label: "Classes Today", value: todayCount, icon: "📅", gradient: "from-purple-500 to-pink-500", light: "bg-purple-500/5 border-purple-500/10 text-purple-700 dark:text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`relative overflow-hidden rounded-[24px] p-5 backdrop-blur-xl border ${s.light} bg-white/40 dark:bg-[#121827]/60 shadow-sm`}
        >
          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="text-2xl drop-shadow-sm">{s.icon}</span>
            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${s.gradient} shadow-lg`} />
          </div>
          <p className="relative z-10 text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">{s.value}</p>
          <p className="relative z-10 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   CIRCULAR PROGRESS
────────────────────────────────────────── */
function CircularProgress({ percentage }: { percentage: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(percentage), 300); return () => clearTimeout(t); }, [percentage]);

  const size = 160;
  const sw = 16;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center filter drop-shadow-2xl">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={sw} fill="none" className="text-gray-100 dark:text-gray-800/50" />
        <circle cx={size/2} cy={size/2} r={r} stroke="url(#cpGrad)" strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-[1.5s] ease-out" />
        <defs>
          <linearGradient id="cpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">{animated}%</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ATTENDANCE OVERVIEW CARD
────────────────────────────────────────── */
function AttendanceOverviewCard({ total, attended, percentage }: any) {
  const absent = total - attended;
  const { color, text, icon } =
    percentage >= 75 ? { color: "emerald", text: "On Track 🎉", icon: "🏆" } :
    percentage >= 60 ? { color: "amber",   text: "Warning ⚠️", icon: "📈" } :
                       { color: "red",     text: "Critical 🚨", icon: "🔥" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 dark:bg-[#121827]/60 backdrop-blur-2xl rounded-[32px] border border-gray-200/50 dark:border-gray-800/50 shadow-xl shadow-indigo-500/5 overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
          <div className="flex-shrink-0">
            <CircularProgress percentage={percentage} />
          </div>

          <div className="flex-1 w-full flex flex-col justify-center space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Performance Overview</h2>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                color === "emerald" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                color === "amber"   ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                                      "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              }`}>
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Attended", val: attended, col: "text-emerald-500", bg: "bg-emerald-500/5 border-emerald-500/10" },
                { label: "Missed",   val: absent,   col: "text-red-500",     bg: "bg-red-500/5 border-red-500/10" },
                { label: "Total",    val: total,    col: "text-indigo-500",  bg: "bg-indigo-500/5 border-indigo-500/10" },
              ].map((row) => (
                <div key={row.label} className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${row.bg}`}>
                  <span className={`text-xl sm:text-2xl font-black ${row.col} mb-1`}>{row.val}</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{row.label}</span>
                </div>
              ))}
            </div>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Timeline <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold border border-indigo-500/20">{lectures.length}</span>
        </h2>
      </div>

      {lectures.length === 0 ? (
        <EmptyLectures />
      ) : (
        <div className="space-y-3">
          {lectures.map((lec, i) => <LectureCard key={i} lecture={lec} index={i} />)}
        </div>
      )}
    </motion.div>
  );
}

function EmptyLectures() {
  return (
    <div className="bg-white/60 dark:bg-[#121827]/60 backdrop-blur-2xl rounded-[32px] border border-gray-200/50 dark:border-gray-800/50 p-10 sm:p-14 text-center shadow-sm">
      <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-5 border border-indigo-500/20">
        <span className="text-4xl">☕</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Classes Today</h3>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Take a break, relax, and recharge.</p>
    </div>
  );
}

function LectureCard({ lecture, index }: { lecture: TodayLecture; index: number }) {
  const isPresent = lecture.status === "PRESENT";
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: "spring" }}
      whileHover={{ scale: 1.01 }}
      className={`group flex items-center gap-4 p-4 sm:p-5 rounded-[24px] border backdrop-blur-md transition-all ${
        isPresent
          ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
          : "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
      }`}
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
        isPresent ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30" : "bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/30"
      }`}>
        <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d={isPresent ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate mb-1">{lecture.subjectName}</p>
        <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {lecture.startTime} – {lecture.endTime}
        </p>
      </div>

      <span className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide flex-shrink-0 border ${
        isPresent ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      }`}>
        {lecture.status}
      </span>
    </motion.div>
  );
}

/* ──────────────────────────────────────────
   SUBJECT PERFORMANCE (SIDEBAR)
────────────────────────────────────────── */
function SubjectPerformanceCard({ subjects }: { subjects: SubjectStats[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/60 dark:bg-[#121827]/60 backdrop-blur-2xl rounded-[32px] border border-gray-200/50 dark:border-gray-800/50 shadow-xl shadow-indigo-500/5 h-full"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">Subject Stats</h2>

        {subjects.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3 opacity-50">📚</span>
            <p className="text-sm font-medium text-gray-400">No data available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((s, i) => {
              const color = s.percentage >= 75 ? "emerald" : s.percentage >= 60 ? "amber" : "red";
              return (
                <div key={s.name} className="group p-4 rounded-[20px] bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-black text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{s.name}</span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0 ml-2 border ${
                      color === "emerald" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                      color === "amber"   ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                                            "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    }`}>
                      {s.percentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        color === "emerald" ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
                        color === "amber"   ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                                              "bg-gradient-to-r from-red-400 to-rose-500"
                      }`}
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-2 text-right">
                    {s.attended}/{s.total} Classes
                  </p>
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
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-20 h-20 rounded-[28px] bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
        <span className="text-4xl">🔌</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Issue</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">{error}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-[24px] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="h-64 rounded-[32px] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />
          <div className="h-40 rounded-[32px] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />
        </div>
        <div className="lg:col-span-4 h-96 rounded-[32px] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ATTENDANCE DIALOG (FIXED CENTER)
────────────────────────────────────────── */
function AttendanceDialog({ lecture, saving, note, onNoteChange, onClose, onSubmit }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0f19]/80 backdrop-blur-xl p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] bg-white dark:bg-[#121827] rounded-[32px] shadow-2xl shadow-indigo-500/20 border border-gray-200/50 dark:border-gray-700 overflow-hidden relative"
      >
        <div className="p-6 sm:p-8">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 border border-white/20">
              <span className="text-3xl">📍</span>
            </div>
            <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-1">Mark Attendance</h3>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{lecture.subjectName}</p>
          </div>

          {/* Time Badge */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 mb-6">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-base font-bold text-indigo-700 dark:text-indigo-400">
              {lecture.startTime.toTimeString().slice(0, 5)} — {lecture.endTime.toTimeString().slice(0, 5)}
            </span>
          </div>

          {/* Note Input */}
          <div className="mb-6">
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full px-4 py-4 rounded-[20px] bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none outline-none"
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => onSubmit("Present")} disabled={saving}
              className="py-4 rounded-[20px] bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-base transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              {saving ? "..." : "Present"}
            </button>
            <button onClick={() => onSubmit("Absent")} disabled={saving}
              className="py-4 rounded-[20px] bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white font-bold text-base transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              {saving ? "..." : "Absent"}
            </button>
          </div>
          
        </div>
      </motion.div>
    </motion.div>
  );
}