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
  note?: string;
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

            const attNote = att.data().note || ""; 

            todayList.push({
              subjectName,
              status,
              startTime: att.data().startTime?.toDate?.().toTimeString().slice(0, 5) ?? att.data().startTime,
              endTime: att.data().endTime?.toDate?.().toTimeString().slice(0, 5) ?? att.data().endTime,
              note: attNote, 
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
    <main className="min-h-screen relative bg-[#F8FAFC] dark:bg-[#0B1120] pb-24 overflow-x-hidden selection:bg-indigo-500/30 font-sans">
      
      {/* ── ANIMATED BACKGROUND ORBS ── */}
      <AnimatedBackground />

      {/* ── PREMIUM GLASS HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20 sm:h-24">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 flex-shrink-0 border border-white/20 dark:border-white/10">
              <span className="text-2xl sm:text-3xl leading-none">{greetingEmoji}</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase mb-1">Good {greeting}</p>
              <h1 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
                {username}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center">
            <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {new Date().toLocaleDateString("en-US", { weekday: 'long', month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── MAIN CONTENT (BENTO GRID) ── */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-8 lg:space-y-10"
            >
              {/* Top Stats Strip */}
              <QuickStatsGrid total={total} attended={attended} percentage={percentage} todayCount={todayLectures.length} />

              {/* Main Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* Center / Left Column */}
                <div className="lg:col-span-8 xl:col-span-8 space-y-6 lg:space-y-8">
                  <AttendanceOverviewCard total={total} attended={attended} percentage={percentage} />
                  <TodayLecturesSection lectures={todayLectures} />
                </div>
                
                {/* Right Sidebar Column */}
                <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-32">
                  <SubjectPerformanceCard subjects={subjectStats} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ATTENDANCE DIALOG (NATIVE MODAL STYLE) ── */}
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
  } catch (error) {
    console.error("Failed to save snapshot", error);
  }
}

/* ──────────────────────────────────────────
   ANIMATED BACKGROUND
────────────────────────────────────────── */
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-70">
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[150px]"
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
    { label: "Overall Rate", value: `${percentage}%`, icon: "🎯", gradient: "from-indigo-500 to-blue-600", light: "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/10 dark:border-indigo-500/20 dark:text-indigo-400" },
    { label: "Attended", value: `${attended}/${total}`, icon: "✨", gradient: "from-emerald-400 to-teal-500", light: "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-500/20 dark:text-emerald-400" },
    { label: "Missed", value: absent, icon: "⚠️", gradient: "from-rose-400 to-red-500", light: "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/10 dark:border-rose-500/20 dark:text-rose-400" },
    { label: "Classes Today", value: todayCount, icon: "📅", gradient: "from-purple-500 to-pink-500", light: "bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-900/10 dark:border-purple-500/20 dark:text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className={`relative overflow-hidden rounded-[2rem] p-5 sm:p-6 backdrop-blur-xl border ${s.light} bg-white/60 dark:bg-[#121827]/60 shadow-sm hover:shadow-xl transition-all duration-300`}
        >
          <div className="relative z-10 flex items-center justify-between mb-4">
            <span className="text-3xl drop-shadow-md">{s.icon}</span>
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${s.gradient} shadow-lg`} />
          </div>
          <p className="relative z-10 text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">{s.value}</p>
          <p className="relative z-10 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</p>
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

  const size = 180;
  const sw = 18;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center filter drop-shadow-2xl">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={sw} fill="none" className="text-gray-100 dark:text-gray-800/50" />
        <circle cx={size/2} cy={size/2} r={r} stroke="url(#cpGrad)" strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-[1.5s] ease-out drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]" />
        <defs>
          <linearGradient id="cpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500">{animated}%</span>
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
    percentage >= 75 ? { color: "emerald", text: "On Track", icon: "🔥" } :
    percentage >= 60 ? { color: "amber",   text: "Warning", icon: "⚠️" } :
                       { color: "red",     text: "Critical", icon: "🚨" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-[2.5rem] border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden"
    >
      <div className="p-6 sm:p-8 xl:p-10">
        <div className="flex flex-col sm:flex-row items-center gap-8 xl:gap-12">
          <div className="flex-shrink-0 relative">
            <CircularProgress percentage={percentage} />
          </div>

          <div className="flex-1 w-full flex flex-col justify-center space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Performance Overview</h2>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">Your current attendance standing.</p>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-wider ${
                color === "emerald" ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                color === "amber"   ? "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
                                      "bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
              }`}>
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: "Attended", val: attended, col: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10" },
                { label: "Missed",   val: absent,   col: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10" },
                { label: "Total",    val: total,    col: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/10" },
              ].map((row) => (
                <div key={row.label} className={`flex flex-col items-center justify-center p-4 rounded-[1.5rem] border ${row.bg}`}>
                  <span className={`text-2xl sm:text-3xl font-black ${row.col} mb-1`}>{row.val}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{row.label}</span>
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
   TODAY'S LECTURES (TIMELINE DESIGN)
────────────────────────────────────────── */
function TodayLecturesSection({ lectures }: { lectures: TodayLecture[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-[2.5rem] border border-gray-200/50 dark:border-gray-800/50 p-6 sm:p-8 xl:p-10 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
          Today's Timeline 
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-black border border-indigo-200 dark:border-indigo-500/20">
            {lectures.length}
          </span>
        </h2>
      </div>

      {lectures.length === 0 ? (
        <EmptyLectures />
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 dark:border-gray-800 space-y-8">
          {lectures.map((lec, i) => <LectureTimelineCard key={i} lecture={lec} index={i} />)}
        </div>
      )}
    </motion.div>
  );
}

function EmptyLectures() {
  return (
    <div className="bg-gray-50/50 dark:bg-[#121827]/30 rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
      <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <span className="text-5xl">☕</span>
      </div>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">No Classes Today</h3>
      <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Take a break, relax, and recharge your energy.</p>
    </div>
  );
}

function LectureTimelineCard({ lecture, index }: { lecture: TodayLecture; index: number }) {
  const isPresent = lecture.status === "PRESENT";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: "spring" }}
      className="relative"
    >
      {/* Timeline Node */}
      <div className={`absolute -left-[35px] sm:-left-[43px] top-6 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 shadow-sm z-10 ${
        isPresent ? "bg-emerald-500" : "bg-rose-500"
      }`} />

      {/* Card */}
      <div className={`group relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-md ${
        isPresent
          ? "bg-white dark:bg-gray-800/50 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/50"
          : "bg-white dark:bg-gray-800/50 border-rose-100 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/50"
      }`}>
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 shadow-inner ${
          isPresent ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" : "bg-rose-50 dark:bg-rose-500/10 text-rose-500"
        }`}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={isPresent ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-black text-lg sm:text-xl text-gray-900 dark:text-white truncate mb-1">{lecture.subjectName}</p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/80 px-3 py-1.5 rounded-xl w-max">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {lecture.startTime} – {lecture.endTime}
            </p>
            {lecture.note && (
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px] xl:max-w-[300px] flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                {lecture.note}
              </p>
            )}
          </div>
        </div>

        <span className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest flex-shrink-0 border self-start sm:self-auto ${
          isPresent ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                    : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
        }`}>
          {lecture.status}
        </span>
      </div>
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
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-[2.5rem] border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden h-full flex flex-col"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 tracking-tight flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          Stats by Subject
        </h2>

        {subjects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-4xl block mb-3 opacity-50">📚</span>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No data available yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {subjects.map((s, i) => {
              const color = s.percentage >= 75 ? "emerald" : s.percentage >= 60 ? "amber" : "red";
              return (
                <div key={s.name} className="group p-5 rounded-[1.5rem] bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-black text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                        {i + 1}
                      </span>
                      <span className="text-base font-black text-gray-900 dark:text-gray-100 truncate">{s.name}</span>
                    </div>
                    <span className={`text-sm font-black px-3 py-1.5 rounded-xl flex-shrink-0 ml-2 border ${
                      color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" :
                      color === "amber"   ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" :
                                            "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20"
                    }`}>
                      {s.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        color === "emerald" ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
                        color === "amber"   ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                                              "bg-gradient-to-r from-red-400 to-rose-500"
                      }`}
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {s.attended}/{s.total} Classes
                    </p>
                    {s.percentage < 60 && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Needs Work
                      </span>
                    )}
                  </div>
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
      <div className="w-24 h-24 rounded-[2rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 border border-red-200 dark:border-red-500/20">
        <span className="text-5xl">🔌</span>
      </div>
      <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Connection Issue</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg font-medium">{error}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse max-w-[1600px] mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-36 rounded-[2rem] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="h-72 rounded-[2.5rem] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />
          <div className="h-64 rounded-[2.5rem] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />
        </div>
        <div className="lg:col-span-4 h-[600px] rounded-[2.5rem] bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ATTENDANCE DIALOG (NATIVE MODAL STYLE)
────────────────────────────────────────── */
function AttendanceDialog({ lecture, saving, note, onNoteChange, onClose, onSubmit }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] bg-white dark:bg-[#121827] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative flex flex-col"
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-2 tracking-tight">Active Lecture</h3>
            <p className="text-lg font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-1.5 rounded-xl">{lecture.subjectName}</p>
          </div>

          <div className="flex flex-col gap-5 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Time Frame</label>
              <span className="text-lg font-black text-gray-900 dark:text-white">
                {lecture.startTime.toTimeString().slice(0, 5)} — {lecture.endTime.toTimeString().slice(0, 5)}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Topic covered..."
                className="w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
                rows={2}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => onSubmit("Present")} disabled={saving}
              className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95">
              {saving ? "..." : "Present"}
            </button>
            <button onClick={() => onSubmit("Absent")} disabled={saving}
              className="py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-lg transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 active:scale-95">
              {saving ? "..." : "Absent"}
            </button>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
      `}} />
    </motion.div>
  );
}