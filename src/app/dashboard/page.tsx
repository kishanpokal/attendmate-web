"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, getDoc, query, where, runTransaction, Timestamp, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import {
  Zap,
  Activity,
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  Layout,
  ChevronRight,
  TrendingUp,
  Brain,
  ShieldCheck,
  Calendar,
  Layers,
  X,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";

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
  const { user, loading: authLoading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* 🔒 SCROLL LOCK */
  useEffect(() => {
    if (showDialog) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showDialog]);

  /* 🔐 AUTH GUARD */
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

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
  }, [user, refreshTrigger]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const percentage = total === 0 ? 0 : Number(((attended * 100) / total).toFixed(1));

  return (
    <ProfessionalPageLayout>
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* ── PROFESSIONAL HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Data synced
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              {greeting}, {username}. Here is your attendance performance data.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Today's Date</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {error ? (
            <ErrorState key="error" error={error} />
          ) : loading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* ── METRICS GRID ── */}
              <QuickStatsGrid total={total} attended={attended} percentage={percentage} todayCount={todayLectures.length} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* ── LEFT COLUMN (MAIN PERFORMANCE & TIMELINE) ── */}
                <div className="lg:col-span-2 space-y-8">
                  <AttendanceOverviewCard total={total} attended={attended} percentage={percentage} />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Schedule</h2>
                    </div>
                    <TodayLecturesSection lectures={todayLectures} />
                  </div>
                </div>

                {/* ── RIGHT COLUMN (SIDEBAR METRICS) ── */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subject Performance</h2>
                    </div>
                    <SubjectPerformanceCard subjects={subjectStats} />
                  </div>

                  {/* PREDICTIVE INSIGHT CARD */}
                  <div className="bg-primary text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <Brain className="w-8 h-8 mb-4 text-white/90" />
                    <h3 className="text-lg font-bold mb-1">Smart Predictions</h3>
                    <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
                      AI is analyzing your attendance data to optimize your upcoming class schedule.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-primary bg-white/20" />
                        ))}
                      </div>
                      <span className="text-xs font-semibold tracking-wide bg-white/20 px-2 py-1 rounded-md">
                        +4 Insights Active
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ATTENDANCE DIALOG ── */}
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
                  const lectureId = `${dateKey}_${activeLecture.startTime.toTimeString().slice(0, 5).replace(":", "")}_${activeLecture.endTime.toTimeString().slice(0, 5).replace(":", "")}`;
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
                setRefreshTrigger(prev => prev + 1);
              } catch (error) {
                console.error("Error saving attendance:", error);
                setSaving(false);
              }
            }}
          />
        )}
      </AnimatePresence>

    </ProfessionalPageLayout>
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
   QUICK STATS GRID
────────────────────────────────────────── */
function QuickStatsGrid({ total, attended, percentage, todayCount }: any) {
  const absent = total - attended;
  const stats = [
    { label: "Attendance Rate", value: `${percentage}%`, icon: Target, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Classes Attended", value: attended, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Classes Missed", value: absent, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { label: "Classes Today", value: todayCount, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} ${s.color} border ${s.border}`}>
              <s.icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   CIRCULAR PROGRESS
────────────────────────────────────────── */
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-100 dark:text-zinc-800"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="72"
          cy="72"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          className={percentage >= 75 ? "text-emerald-500" : percentage >= 60 ? "text-amber-500" : "text-rose-500"}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Rating</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ATTENDANCE OVERVIEW CARD
────────────────────────────────────────── */
function AttendanceOverviewCard({ total, attended, percentage }: any) {
  const absent = total - attended;
  const statusDef =
    percentage >= 75 ? { color: "emerald", text: "Excellent Standing", icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" } :
      percentage >= 60 ? { color: "amber", text: "Warning Level", icon: AlertCircle, bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" } :
        { color: "red", text: "Needs Attention", icon: AlertCircle, bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">

        {/* Progress Visual */}
        <div className="flex-shrink-0">
          <CircularProgress percentage={percentage} />
        </div>

        {/* Stats Content */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Analytics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your overall attendance breakdown</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusDef.bg}`}>
              <statusDef.icon className="w-3.5 h-3.5" />
              {statusDef.text}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Attended</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{attended}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Absent</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-500">{absent}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   TODAY'S LECTURES
────────────────────────────────────────── */
function TodayLecturesSection({ lectures }: { lectures: TodayLecture[] }) {
  if (lectures.length === 0) return <EmptyLectures />;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800">
      {lectures.map((lec, i) => (
        <LectureTimelineItem key={i} lecture={lec} />
      ))}
    </div>
  );
}

function EmptyLectures() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
        <Calendar className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Classes Scheduled</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Your schedule is clear for today. Take a break or use this time to catch up on assignments.
      </p>
    </div>
  );
}

function LectureTimelineItem({ lecture }: { lecture: TodayLecture }) {
  const isPresent = lecture.status === "PRESENT";

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">

      <div className="flex items-center gap-4 min-w-[140px]">
        <div className={`w-2 h-2 rounded-full ${isPresent ? "bg-emerald-500" : "bg-rose-500"}`} />
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          {lecture.startTime} - {lecture.endTime}
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-base font-bold text-gray-900 dark:text-white">{lecture.subjectName}</h4>
        {lecture.note && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
            <MoreHorizontal className="w-4 h-4" /> {lecture.note}
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        <span className={`px-3 py-1 rounded-md text-xs font-semibold ${isPresent
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
            : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
          }`}>
          {lecture.status}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   SUBJECT PERFORMANCE CARD
────────────────────────────────────────── */
function SubjectPerformanceCard({ subjects }: { subjects: SubjectStats[] }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        {subjects.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No data available yet</p>
        ) : (
          <div className="space-y-6">
            {subjects.map((sub, i) => (
              <div key={sub.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-4">{sub.name}</span>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{sub.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.percentage}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${sub.percentage >= 75 ? "bg-emerald-500" :
                        sub.percentage >= 60 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ERROR & LOADING STATES
────────────────────────────────────────── */
function ErrorState({ error }: { error: string }) {
  return (
    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4">
      <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
      <h3 className="text-lg font-bold text-rose-800 dark:text-rose-400">Failed to load dashboard</h3>
      <p className="text-sm text-rose-600 dark:text-rose-300 max-w-sm">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-zinc-800/50 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="h-64 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl" />
          <div className="h-64 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl" />
        </div>
        <div className="lg:col-span-1 h-[500px] bg-gray-100 dark:bg-zinc-800/50 rounded-2xl" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ATTENDANCE DIALOG (NATIVE MODAL STYLE)
────────────────────────────────────────── */
function AttendanceDialog({ lecture, saving, note, onNoteChange, onClose, onSubmit }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden relative flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">Mark Attendance</h3>
            <span className="inline-block px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded text-xs font-semibold">
              {lecture.subjectName}
            </span>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/50">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Class Timing</label>
            <div className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {lecture.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {lecture.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Notes (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Any details about today's class?"
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={3}
              disabled={saving}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-2 grid grid-cols-2 gap-3">
          <button onClick={() => onSubmit("Present")} disabled={saving}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50">
            {saving ? "Saving..." : <><CheckCircle2 className="w-5 h-5" /> Present</>}
          </button>
          <button onClick={() => onSubmit("Absent")} disabled={saving}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors disabled:opacity-50">
            {saving ? "Saving..." : <><X className="w-5 h-5" /> Absent</>}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}