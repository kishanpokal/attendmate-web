"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, getDoc, query, where, runTransaction, Timestamp, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import { Calendar, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic imports for UI components
const DashboardBackground = dynamic(() => import("@/components/dashboard/DashboardBackground"), { ssr: false });
import QuickStatsGrid from "@/components/dashboard/QuickStatsGrid";
import AttendanceOverviewCard from "@/components/dashboard/AttendanceOverviewCard";
import TodayLecturesSection from "@/components/dashboard/TodayLecturesSection";
import SubjectPerformanceCard from "@/components/dashboard/SubjectPerformanceCard";
import AICopilotCard from "@/components/dashboard/AICopilotCard";
import AttendanceDialog from "@/components/dashboard/AttendanceDialog";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import type { TodayLecture } from "@/components/dashboard/TodayLectureCard";

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

  const percentage = total === 0 ? 0 : Number(((attended * 100) / total).toFixed(1));

  return (
    <ProfessionalPageLayout>
      <DashboardBackground />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-[32px] sm:text-[40px] font-bold text-white font-[Outfit] leading-tight flex items-center gap-3">
              Dashboard {" "}
              <span className="relative flex h-3 w-3 mt-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-attendmate-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-attendmate-primary)]"></span>
              </span>
            </h1>
            <p className="text-[var(--color-attendmate-muted)] text-sm sm:text-base mt-2">
              Welcome back, <span className="text-white font-semibold">{username}</span>. Your attendance overview.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-[var(--color-attendmate-primary)]/20 flex items-center justify-center text-[var(--color-attendmate-primary)]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--color-attendmate-muted)] uppercase tracking-wider mb-0.5">Today</p>
              <p className="text-sm font-bold text-white font-mono">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.2)] rounded-2xl backdrop-blur-md">
              <p className="text-[var(--color-attendmate-red)] font-bold mb-2">Error loading dashboard</p>
              <p className="text-rose-200/80 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-[rgba(255,77,109,0.15)] text-white rounded-lg text-sm font-medium border border-[rgba(255,77,109,0.3)] hover:bg-[rgba(255,77,109,0.25)] transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DashboardSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 md:space-y-8"
            >
              {/* TOP ROW: QUICK STATS */}
              <QuickStatsGrid total={total} attended={attended} percentage={percentage} todayCount={todayLectures.length} />

              {/* MAIN LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-12">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  {/* Attendance Details */}
                  <AttendanceOverviewCard total={total} attended={attended} percentage={percentage} />

                  {/* AI Copilot Card */}
                  <AICopilotCard percentage={percentage} present={attended} absent={total - attended} />
                </div>

                <div className="space-y-6 md:space-y-8">
                  {/* Timeline section */}
                  <TodayLecturesSection lectures={todayLectures} />

                  {/* Subject List */}
                  <SubjectPerformanceCard subjects={subjectStats} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* POPUP: ATTENDANCE DIALOG */}
      {activeLecture && (
        <AttendanceDialog
          isOpen={showDialog}
          onClose={() => {
            setShowDialog(false);
            setActiveLecture(null);
          }}
          subjectName={activeLecture.subjectName}
          onSubmit={async (status: string, note: string) => {
            try {
              if (!user) throw new Error("No user");
              await runTransaction(db, async (tx) => {
                const subjectRef = doc(db, "users", user.uid, "subjects", activeLecture.subjectId);
                const today = new Date();
                const dateKey = today.toISOString().split("T")[0];
                const lectureId = `${dateKey}_${activeLecture.startTime.toTimeString().slice(0, 5).replace(":", "")}_${activeLecture.endTime.toTimeString().slice(0, 5).replace(":", "")}`;
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
                if (note && note.trim() !== "") attendanceData.note = note.trim();
                
                tx.set(attRef, attendanceData);
                tx.update(subjectRef, {
                  totalClasses: (snap.data()?.totalClasses ?? 0) + 1,
                  attendedClasses: (snap.data()?.attendedClasses ?? 0) + (status.toUpperCase() === "PRESENT" ? 1 : 0),
                });
              });
              setRefreshTrigger(prev => prev + 1);
            } catch (error) {
              console.error("Error saving attendance:", error);
            }
          }}
        />
      )}
    </ProfessionalPageLayout>
  );
}

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