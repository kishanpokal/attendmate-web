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

export default function DashboardPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [username, setUsername] = useState("User");
  const [todayLectures, setTodayLectures] = useState<TodayLecture[]>([]);
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

        for (const s of subjectsSnap.docs) {
          const subjectName = s.data().name;
          const attSnap = await getDocs(collection(s.ref, "attendance"));

          for (const att of attSnap.docs) {
            const status = att.data().status?.toUpperCase();
            t++;
            if (status === "PRESENT") a++;

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
        }

        setTodayLectures(todayList.sort((a, b) => a.startTime.localeCompare(b.startTime)));
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-24">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Hello, {username}! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                <span>{greetingEmoji}</span>
                <span>{greeting}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {error ? (
            <ErrorState key="error" error={error} />
          ) : loading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Attendance Summary */}
              <AttendanceSummaryCard 
                total={total} 
                attended={attended} 
                percentage={percentage} 
              />

              {/* Today's Lectures */}
              <TodayLecturesSection lectures={todayLectures} />
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

/* ---------------- ERROR STATE ---------------- */
function ErrorState({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Oops! Something went wrong</h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{error}</p>
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
      className="space-y-6"
    >
      {/* Summary Card Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3 animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Lectures Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-40 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 h-24 animate-pulse" />
        ))}
      </div>
    </motion.div>
  );
}

/* ---------------- ATTENDANCE SUMMARY CARD ---------------- */
function AttendanceSummaryCard({ total, attended, percentage }: { total: number; attended: number; percentage: number }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const absent = total - attended;
  const statusColor = percentage >= 75 ? "emerald" : percentage >= 60 ? "amber" : "red";
  const statusText = percentage >= 75 ? "Excellent" : percentage >= 60 ? "Good" : "Needs Attention";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Attendance Overview</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your overall performance</p>
            </div>
          </div>
          <span 
            className={`px-4 py-2 rounded-full text-sm font-bold ${
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Percentage */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-800/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {animatedPercent}%
              </span>
            </div>
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-1000 rounded-full"
                style={{ width: `${animatedPercent}%` }}
              />
            </div>
          </div>

          {/* Present */}
          <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400">{attended}</span>
              <span className="text-sm text-gray-500 dark:text-gray-500">/ {total}</span>
            </div>
          </div>

          {/* Absent */}
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">{absent}</span>
              <span className="text-sm text-gray-500 dark:text-gray-500">/ {total}</span>
            </div>
          </div>
        </div>
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Today's Lectures</h2>
        </div>
        {lectures.length > 0 && (
          <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-bold">
            {lectures.length}
          </span>
        )}
      </div>

      {lectures.length === 0 ? (
        <EmptyLectures />
      ) : (
        <div className="space-y-4">
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
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 sm:p-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">No lectures scheduled</h3>
      <p className="text-gray-600 dark:text-gray-400">Enjoy your free day! 🎉</p>
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
      className={`rounded-2xl p-5 border-2 ${
        isPresent 
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700" 
          : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isPresent 
              ? "bg-emerald-500/20" 
              : "bg-red-500/20"
          }`}>
            <svg 
              className={`w-6 h-6 ${
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
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate mb-1">
              {lecture.subjectName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{lecture.startTime} - {lecture.endTime}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span 
          className={`px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 ${
            isPresent 
              ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300" 
              : "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
          }`}
        >
          {lecture.status}
        </span>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Mark Attendance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{lecture.subjectName}</p>
            </div>
          </div>

          {/* Time Info */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {lecture.startTime.toTimeString().slice(0, 5)} - {lecture.endTime.toTimeString().slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note about this lecture..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSubmit("Present")}
              disabled={saving}
              className="py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? "Saving..." : "Present"}
            </button>
            <button
              onClick={() => onSubmit("Absent")}
              disabled={saving}
              className="py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? "Saving..." : "Absent"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}