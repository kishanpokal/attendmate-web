"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type FriendLecture = {
  subjectName: string;
  status: string;
  startTime: string;
  endTime: string;
};

// --- HELPER: AVATAR COLORS ---
const AVATAR_PALETTE = [
  "#6366F1", "#8B5CF6", "#EC4899", "#06B6D4", 
  "#10B981", "#F59E0B", "#EF4444", "#3B82F6"
];

function getAvatarColor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// --- HELPER: CALC NEEDED LECTURES ---
function calcLecturesNeeded(attended: number, total: number): number {
  if (total === 0) return 0;
  let ta = attended;
  let tt = total;
  let n = 0;
  while ((ta / tt) * 100 < 75 && n < 100) {
    ta++;
    tt++;
    n++;
  }
  return n;
}

export default function FriendProfilePage() {
  const router = useRouter();
  const params = useParams();
  const friendUid = params.uid as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Friend Data State
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [percentage, setPercentage] = useState(0.0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [attendedClasses, setAttendedClasses] = useState(0);
  const [todayLectures, setTodayLectures] = useState<FriendLecture[]>([]);

  const loadProfile = async () => {
    if (!friendUid) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Basic Info
      const userDoc = await getDoc(doc(db, "users", friendUid));
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }
      setUsername(userDoc.data().username || "User");
      setEmail(userDoc.data().email || "");

      // 2. Fetch Today's Snapshot
      const todayId = new Date().toISOString().split("T")[0];
      const snapDoc = await getDoc(doc(db, "users", friendUid, "dailySnapshot", todayId));

      if (snapDoc.exists()) {
        const data = snapDoc.data();
        setPercentage(data.percentage || 0);
        setTotalClasses(data.totalClasses || 0);
        setAttendedClasses(data.attendedClasses || 0);

        // Parse Nested Map
        const lecturesMap = data.lectures || {};
        const parsedLectures: FriendLecture[] = Object.values(lecturesMap).map((lec: any) => ({
          subjectName: lec.subjectName || "Unknown",
          status: lec.status || "ABSENT",
          startTime: lec.startTime || "--:--",
          endTime: lec.endTime || "--:--",
        }));

        // Sort by start time
        parsedLectures.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setTodayLectures(parsedLectures);
      } else {
        // No classes today or snapshot not created yet
        setPercentage(0);
        setTotalClasses(0);
        setAttendedClasses(0);
        setTodayLectures([]);
      }
    } catch (err) {
      setErrorMsg("Unable to load profile. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [friendUid]);

  return (
    <main className="min-h-screen relative bg-[#f8fafc] dark:bg-[#0b0f19] overflow-x-hidden selection:bg-indigo-500/30 pb-20">
      
      {/* --- BACKGROUND ORBS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, 24, 0], opacity: [0.05, 0.13, 0.05] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 -left-20 w-[360px] h-[360px] bg-indigo-500 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.03, 0.09, 0.03] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-96 right-12 w-[280px] h-[280px] bg-purple-500 rounded-full blur-[90px]"
        />
      </div>

      <div className="relative z-10">
        {/* --- HEADER --- */}
        <div className="sticky top-0 z-30 bg-white/60 dark:bg-[#0b0f19]/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
              Friend Profile
            </h1>
          </div>
        </div>

        {/* --- DYNAMIC CONTENT --- */}
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <ProfileSkeleton key="skeleton" />
            ) : errorMsg ? (
              <ProfileError key="error" message={errorMsg} onRetry={loadProfile} />
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* 1. Header Card */}
                <ProfileHeaderCard username={username} email={email} percentage={percentage} />

                {/* 2. Summary Card */}
                <AttendanceSummaryCard total={totalClasses} attended={attendedClasses} percentage={percentage} />

                {/* 3. Section Header */}
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Today's Lectures</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{todayLectures.length} {todayLectures.length === 1 ? 'class' : 'classes'} scheduled</p>
                  </div>
                </div>

                {/* 4. Lectures List */}
                {todayLectures.length === 0 ? (
                  <NoLecturesToday />
                ) : (
                  <div className="space-y-3">
                    {todayLectures.map((lec, i) => (
                      <FriendLectureCard key={`${lec.subjectName}_${lec.startTime}`} lecture={lec} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

/* ================== COMPONENTS ================== */

function ProfileHeaderCard({ username, email, percentage }: any) {
  const isGood = percentage >= 75;
  const isWarning = percentage >= 60 && percentage < 75;
  const colorClass = isGood ? "text-emerald-500" : isWarning ? "text-amber-500" : "text-red-500";
  const bgClass = isGood ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-red-500";
  const statusLabel = isGood ? "Excellent Attendance" : isWarning ? "Decent Attendance" : "Low Attendance";
  
  const avatarColor = getAvatarColor(username);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-[28px] shadow-lg border border-gray-100 dark:border-gray-700/50"
    >
      <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${avatarColor}40, transparent)` }} />
      <div className="relative p-6 sm:p-8 flex items-center gap-5 sm:gap-6">
        <div 
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shrink-0"
          style={{ background: `linear-gradient(135deg, ${avatarColor}CC, ${avatarColor})` }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white truncate">{username}</h2>
          {email && (
            <div className="flex items-center gap-1.5 mt-1 text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <p className="text-xs sm:text-sm truncate">{email}</p>
            </div>
          )}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className={`w-2 h-2 rounded-full ${bgClass}`} />
            <span className={`text-[11px] sm:text-xs font-bold ${colorClass}`}>{statusLabel}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AttendanceSummaryCard({ total, attended, percentage }: any) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(percentage), 300); return () => clearTimeout(t); }, [percentage]);

  const isGood = percentage >= 75;
  const isWarning = percentage >= 60 && percentage < 75;
  
  const accent = isGood ? "emerald" : isWarning ? "amber" : "red";
  const statusText = isGood ? "Excellent" : isWarning ? "Good" : "Needs Attention";

  const size = 180;
  const sw = 18;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className={`bg-white dark:bg-gray-800 rounded-[32px] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50`}
    >
      <div className={`p-6 sm:p-8 bg-gradient-to-b from-${accent}-500/5 to-transparent`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-${accent}-400 to-${accent}-600 flex items-center justify-center shadow-lg shadow-${accent}-500/30`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422M12 14l-6.16-3.422m12.32 0V14a2 2 0 01-1.12 1.79l-5.08 2.54a2 2 0 01-1.79 0l-5.08-2.54A2 2 0 013 14V10.578M12 14v4" /></svg>
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Attendance</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Overall Performance</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl bg-${accent}-500/10 border border-${accent}-500/20 text-${accent}-600 dark:text-${accent}-400 font-bold text-xs flex items-center gap-1.5`}>
            {isGood ? "🎉" : isWarning ? "⚠️" : "🚨"} {statusText}
          </div>
        </div>

        {/* Circular Chart */}
        <div className="flex justify-center mb-10">
          <div className="relative inline-flex items-center justify-center drop-shadow-lg">
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={sw} fill="none" className="text-gray-100 dark:text-gray-700" />
              <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={sw} fill="none"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                className={`transition-all duration-1000 ease-out text-${accent}-500`} />
            </svg>
            <div className="absolute flex items-baseline gap-1">
              <span className={`text-5xl font-extrabold text-${accent}-500`}>{animated.toFixed(1)}</span>
              <span className={`text-2xl font-bold text-${accent}-500/70`}>%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-[20px] p-5 shadow-inner">
          <StatBox label="Present" value={attended} color="emerald" icon="M5 13l4 4L19 7" />
          <StatBox label="Total" value={total} color="indigo" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <StatBox label="Absent" value={total - attended} color="red" icon="M6 18L18 6M6 6l12 12" />
        </div>

        {/* Motivation Banner */}
        <div className={`mt-5 p-4 rounded-2xl flex items-center gap-3 bg-${accent}-500/10 border border-${accent}-500/20`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">
            {isGood ? "🏆" : "📚"}
          </div>
          <div>
            <h4 className={`font-bold text-sm text-${accent}-700 dark:text-${accent}-400`}>
              {isGood ? "Outstanding!" : "Heads up!"}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {isGood 
                ? "Maintaining excellent attendance — well above 75%" 
                : `Needs ${calcLecturesNeeded(attended, total)} more class(es) to reach 75%`}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, color, icon }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${color}-500/10 text-${color}-500`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} />
        </svg>
      </div>
      <span className={`text-2xl font-extrabold text-${color}-500`}>{value}</span>
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function FriendLectureCard({ lecture, index }: any) {
  const isPresent = lecture.status.toUpperCase() === "PRESENT";
  const theme = isPresent ? "emerald" : "red";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05, type: "spring" }}
      className={`flex items-center gap-4 p-4 rounded-[20px] bg-white dark:bg-gray-800 border border-${theme}-500/20 shadow-sm`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${theme}-500/10 text-${theme}-500 shrink-0`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isPresent ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">{lecture.subjectName}</h4>
        <div className="flex items-center gap-1.5 mt-1 text-gray-500 dark:text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs font-medium">{lecture.startTime} - {lecture.endTime}</span>
        </div>
      </div>
      <div className={`px-3 py-1.5 rounded-full bg-${theme}-500/10 text-${theme}-600 dark:text-${theme}-400 font-bold text-xs shrink-0`}>
        {isPresent ? "Present" : "Absent"}
      </div>
    </motion.div>
  );
}

function NoLecturesToday() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-12 px-6 text-center bg-white dark:bg-gray-800 rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="w-20 h-20 mx-auto bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Lectures Today</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">This friend has no recorded attendance for today yet.</p>
    </motion.div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-[28px] w-full" />
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-[32px] w-full" />
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-[20px] w-full" />
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-[20px] w-full" />
      </div>
    </div>
  );
}

function ProfileError({ message, onRetry }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-[28px] border border-red-100 dark:border-red-900/30 shadow-sm">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-4">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Oops!</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
      <button onClick={onRetry} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-colors">
        Try Again
      </button>
    </div>
  );
}