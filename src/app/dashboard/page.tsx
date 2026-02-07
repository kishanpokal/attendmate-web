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
        /* 1️⃣ USER INFO */
        const userSnap = await getDoc(doc(db, "users", user.uid));
        setUsername(userSnap.data()?.username ?? "User");

        /* 2️⃣ ACTIVE LECTURE CHECK */
        const today = new Date();
        const day = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
        const now = today.toTimeString().slice(0, 5);

        const timetableSnap = await getDocs(
          query(
            collection(db, "users", user.uid, "timetable"),
            where("day", "==", day)
          )
        );

        for (const d of timetableSnap.docs) {
          const { startTime, endTime, subjectId, subjectName } = d.data();
          if (now > startTime && now < endTime) {
            const dateKey = today.toISOString().split("T")[0];
            const lectureId = `${dateKey}_${startTime.replace(":", "")}_${endTime.replace(":", "")}`;
            const attRef = doc(
              db,
              "users",
              user.uid,
              "subjects",
              subjectId,
              "attendance",
              lectureId
            );
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

        /* 3️⃣ SUBJECTS + ATTENDANCE */
        const subjectsSnap = await getDocs(
          collection(db, "users", user.uid, "subjects")
        );

        let t = 0;
        let a = 0;
        const todayList: TodayLecture[] = [];
        const statsMap: Map<string, SubjectStats> = new Map();

        for (const s of subjectsSnap.docs) {
          const subjectName = s.data().name;
          const attSnap = await getDocs(collection(s.ref, "attendance"));
          let subjectTotal = 0;
          let subjectAttended = 0;

          for (const att of attSnap.docs) {
            const status = att.data().status?.toUpperCase();
            t++;
            subjectTotal++;
            if (status === "PRESENT") {
              a++;
              subjectAttended++;
            }

            const date =
              att.data().date?.toDate?.().toISOString().split("T")[0] ??
              att.data().date;
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

  /* 🕒 GREETING */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" :
    hour < 17 ? "Good Afternoon" :
    hour < 21 ? "Good Evening" : "Good Night";
  const greetingEmoji =
    hour < 12 ? "🌅" :
    hour < 17 ? "☀️" :
    hour < 21 ? "🌆" : "🌙";

  const percentage = total === 0 ? 0 : Number(((attended * 100) / total).toFixed(1));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 pb-24 transition-colors duration-300">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm"
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
              >
                <span className="text-xl sm:text-2xl lg:text-3xl">👋</span>
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {greeting}, {username}!
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <span className="text-base sm:text-lg">{greetingEmoji}</span>
                  <span>Welcome back to your dashboard</span>
                </p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                <p className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-10">
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
              className="space-y-6 sm:space-y-8 lg:space-y-10"
            >
              {/* Quick Stats Row */}
              <QuickStatsGrid
                total={total}
                attended={attended}
                percentage={percentage}
                todayCount={todayLectures.length}
              />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {/* Left Column - 2/3 width */}
                <div className="xl:col-span-2 space-y-6 sm:space-y-8 lg:space-y-10">
                  {/* Attendance Chart */}
                  <AttendanceOverviewCard
                    total={total}
                    attended={attended}
                    percentage={percentage}
                  />

                  {/* Today's Lectures */}
                  <TodayLecturesSection lectures={todayLectures} />
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                  {/* Subject Performance */}
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
            if (!saving) {
              setShowDialog(false);
              setActiveLecture(null);
              setNote("");
            }
          }}
          onSubmit={async (status) => {
            setSaving(true);
            try {
              await runTransaction(db, async (tx) => {
                const subjectRef = doc(
                  db,
                  "users",
                  user!.uid,
                  "subjects",
                  activeLecture.subjectId
                );
                const today = new Date();
                const dateKey = today.toISOString().split("T")[0];
                const lectureId = `${dateKey}_${activeLecture.startTime.toTimeString().slice(0,5).replace(":", "")}_${activeLecture.endTime.toTimeString().slice(0,5).replace(":", "")}`;
                const attRef = doc(subjectRef, "attendance", lectureId);

                if ((await tx.get(attRef)).exists()) throw new Error("Already marked");

                const snap = await tx.get(subjectRef);
                const attendanceData: any = {
                  status,
                  date: Timestamp.fromDate(today),
                  startTime: Timestamp.fromDate(activeLecture.startTime),
                  endTime: Timestamp.fromDate(activeLecture.endTime),
                  createdAt: Timestamp.now(),
                };

                if (note.trim() !== "") {
                  attendanceData.note = note.trim();
                }

                tx.set(attRef, attendanceData);
                tx.update(subjectRef, {
                  totalClasses: (snap.data()?.totalClasses ?? 0) + 1,
                  attendedClasses:
                    (snap.data()?.attendedClasses ?? 0) +
                    (status === "Present" ? 1 : 0),
                });
              });

              setSaving(false);
              setShowDialog(false);
              setNote("");
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

/* ---------------- QUICK STATS GRID ---------------- */
function QuickStatsGrid({
  total,
  attended,
  percentage,
  todayCount
}: {
  total: number;
  attended: number;
  percentage: number;
  todayCount: number;
}) {
  const absent = total - attended;
  const stats = [
    {
      label: "Overall Attendance",
      value: `${percentage}%`,
      icon: "📊",
      gradient: "from-indigo-600 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30",
      borderColor: "border-indigo-200/50 dark:border-indigo-800/50"
    },
    {
      label: "Classes Attended",
      value: attended,
      subtitle: `of ${total}`,
      icon: "✅",
      gradient: "from-emerald-600 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
      borderColor: "border-emerald-200/50 dark:border-emerald-800/50"
    },
    {
      label: "Classes Missed",
      value: absent,
      subtitle: `of ${total}`,
      icon: "❌",
      gradient: "from-red-600 to-orange-600",
      bgGradient: "from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30",
      borderColor: "border-red-200/50 dark:border-red-800/50"
    },
    {
      label: "Today's Lectures",
      value: todayCount,
      icon: "📅",
      gradient: "from-blue-600 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
      borderColor: "border-blue-200/50 dark:border-blue-800/50"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative group overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br ${stat.bgGradient} border ${stat.borderColor} p-5 sm:p-6 lg:p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl lg:text-4xl">{stat.icon}</span>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </span>
              {stat.subtitle && (
                <span className="text-sm lg:text-base text-gray-500 dark:text-gray-400">{stat.subtitle}</span>
              )}
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-600 dark:text-gray-400">
              {stat.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------- PERFECT CIRCULAR PROGRESS ---------------- */
function CircularProgress({ percentage, size = 280 }: { percentage: number; size?: number }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const strokeWidth = size / 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: 'drop-shadow(0 10px 30px rgba(99, 102, 241, 0.3))' }}
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-800"
        />
        
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {animatedPercent}%
        </span>
        <span className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mt-2 font-medium">
          Overall
        </span>
      </div>
    </div>
  );
}

/* ---------------- ATTENDANCE OVERVIEW CARD ---------------- */
function AttendanceOverviewCard({ total, attended, percentage }: { total: number; attended: number; percentage: number }) {
  const absent = total - attended;
  const statusColor = percentage >= 75 ? "emerald" : percentage >= 60 ? "amber" : "red";
  const statusText = percentage >= 75 ? "Excellent Performance 🎉" : percentage >= 60 ? "Good Progress 👍" : "Needs Improvement 📈";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl lg:rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden"
    >
      <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 lg:mb-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Attendance Analytics
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Comprehensive overview of your performance
              </p>
            </div>
          </div>
        </div>

        {/* Circular Progress & Stats */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 xl:gap-16 mb-8 lg:mb-10">
          {/* Perfect Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress percentage={percentage} size={window.innerWidth < 640 ? 220 : window.innerWidth < 1024 ? 260 : 300} />
          </div>

          {/* Stats Breakdown */}
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-2xl lg:rounded-3xl mb-6 lg:mb-8 ${
              statusColor === "emerald"
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : statusColor === "amber"
                ? "bg-amber-100 dark:bg-amber-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <span className={`text-base sm:text-lg lg:text-xl font-bold ${
                statusColor === "emerald"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : statusColor === "amber"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-red-700 dark:text-red-400"
              }`}>
                {statusText}
              </span>
            </div>

            {/* Stats Cards */}
            <div className="space-y-4 lg:space-y-5">
              <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg lg:rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300">
                    Classes Attended
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {attended}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg lg:rounded-xl bg-red-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300">
                    Classes Missed
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 dark:text-red-400">
                  {absent}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg lg:rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300">
                    Total Classes
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  {total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- SUBJECT PERFORMANCE CARD ---------------- */
function SubjectPerformanceCard({ subjects }: { subjects: SubjectStats[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl lg:rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden"
    >
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Subject Performance
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Ranked by attendance
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-12 lg:py-16">
            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400">No subjects yet</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {subjects.slice(0, 5).map((subject, index) => {
              const color = subject.percentage >= 75 ? "emerald" : subject.percentage >= 60 ? "amber" : "red";
             
              return (
                <div
                  key={subject.name}
                  className="p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-400 dark:text-gray-600 flex-shrink-0">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-gray-100 truncate">
                        {subject.name}
                      </span>
                    </div>
                    <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg lg:rounded-xl text-sm sm:text-base font-bold flex-shrink-0 ml-2 ${
                      color === "emerald"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : color === "amber"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {subject.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                    <span>{subject.attended} / {subject.total} classes</span>
                  </div>
                  <div className="mt-2 h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        color === "emerald"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : color === "amber"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-gradient-to-r from-red-500 to-rose-500"
                      } transition-all duration-500`}
                      style={{ width: `${subject.percentage}%` }}
                    />
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

/* ---------------- TODAY'S LECTURES SECTION ---------------- */
function TodayLecturesSection({ lectures }: { lectures: TodayLecture[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Today's Schedule
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Your lectures for today
            </p>
          </div>
        </div>
        {lectures.length > 0 && (
          <span className="px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl lg:rounded-2xl text-sm sm:text-base font-bold shadow-lg shadow-blue-500/30">
            {lectures.length} {lectures.length === 1 ? 'Lecture' : 'Lectures'}
          </span>
        )}
      </div>

      {lectures.length === 0 ? (
        <EmptyLectures />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {lectures.map((lecture, index) => (
            <LectureCard key={index} lecture={lecture} index={index} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- EMPTY LECTURES STATE ---------------- */
function EmptyLectures() {
  return (
    <div className="rounded-3xl lg:rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 p-12 sm:p-16 lg:p-20 text-center shadow-xl">
      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-3xl lg:rounded-[2rem] bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6 lg:mb-8">
        <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        No lectures today
      </h3>
      <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Enjoy your free day! 🎉</p>
    </div>
  );
}

/* ---------------- LECTURE CARD ---------------- */
function LectureCard({ lecture, index }: { lecture: TodayLecture; index: number }) {
  const isPresent = lecture.status === "PRESENT";
 
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-7 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isPresent
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-300 dark:border-emerald-700"
          : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-300 dark:border-red-700"
      }`}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Icon */}
        <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 flex-shrink-0 ${
          isPresent
            ? "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/30"
            : "bg-gradient-to-br from-red-600 to-orange-600 shadow-red-500/30"
        }`}>
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white"
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
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900 dark:text-gray-100 truncate mb-2 sm:mb-3">
            {lecture.subjectName}
          </h3>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{lecture.startTime} - {lecture.endTime}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-bold flex-shrink-0 shadow-lg ${
            isPresent
              ? "bg-emerald-600 text-white shadow-emerald-500/30"
              : "bg-red-600 text-white shadow-red-500/30"
          }`}
        >
          {lecture.status}
        </span>
      </div>
    </motion.div>
  );
}

/* ---------------- ERROR STATE ---------------- */
function ErrorState({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24"
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-3xl lg:rounded-[2rem] bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mb-6 lg:mb-8 shadow-xl">
        <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 text-center px-4">
        Oops! Something went wrong
      </h3>
      <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 text-center max-w-md px-4">{error}</p>
    </motion.div>
  );
}

/* ---------------- LOADING STATE ---------------- */
function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 sm:space-y-8 lg:space-y-10"
    >
      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl lg:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-7 lg:p-8 h-32 sm:h-36 lg:h-40 animate-pulse" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        <div className="xl:col-span-2 space-y-6 sm:space-y-8 lg:space-y-10">
          <div className="rounded-3xl lg:rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-10 lg:p-12 h-80 sm:h-96 lg:h-[32rem] animate-pulse" />
          <div className="rounded-3xl lg:rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-10 lg:p-12 h-56 sm:h-64 lg:h-80 animate-pulse" />
        </div>
        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
          <div className="rounded-3xl lg:rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 h-80 sm:h-96 lg:h-[32rem] animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- ATTENDANCE DIALOG ---------------- */
function AttendanceDialog({
  lecture,
  saving,
  note,
  onNoteChange,
  onClose,
  onSubmit
}: {
  lecture: ActiveLecture;
  saving: boolean;
  note: string;
  onNoteChange: (note: string) => void;
  onClose: () => void;
  onSubmit: (status: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg lg:max-w-xl bg-white dark:bg-gray-900 rounded-3xl lg:rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-6 sm:p-8 lg:p-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl text-gray-900 dark:text-gray-100">
                Mark Attendance
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{lecture.subjectName}</p>
            </div>
          </div>

          {/* Time Info */}
          <div className="p-5 lg:p-6 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/30 mb-6 lg:mb-8">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-sm sm:text-base lg:text-lg">
                {lecture.startTime.toTimeString().slice(0, 5)} - {lecture.endTime.toTimeString().slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300 mb-3">
              Add Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add any remarks or notes about this lecture..."
              className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl lg:rounded-3xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              rows={4}
              disabled={saving}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <button
              onClick={() => onSubmit("Present")}
              disabled={saving}
              className="group relative overflow-hidden py-4 sm:py-5 lg:py-6 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base sm:text-lg lg:text-xl transition-all shadow-xl hover:shadow-2xl shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {saving ? "Saving..." : "Present"}
              </span>
            </button>
            <button
              onClick={() => onSubmit("Absent")}
              disabled={saving}
              className="group relative overflow-hidden py-4 sm:py-5 lg:py-6 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-base sm:text-lg lg:text-xl transition-all shadow-xl hover:shadow-2xl shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {saving ? "Saving..." : "Absent"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}