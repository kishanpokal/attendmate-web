"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, getDoc, query, where, runTransaction } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AttendMateBottomNav from "@/components/navigation/AttendMateBottomNav";
import AttendanceSummaryCard from "@/components/dashboard/AttendanceSummaryCard";
import TodayLectureCard from "@/components/dashboard/TodayLectureCard";
import AttendanceDialog from "@/components/dashboard/AttendanceDialog";

type TodayLecture = {
  subjectName: string;
  status: "PRESENT" | "ABSENT";
  startTime: string;
  endTime: string;
};

type ActiveLecture = {
  subjectId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
              setActiveLecture({ subjectId, subjectName, startTime, endTime });
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
    hour < 12 ? "Good Morning!" :
    hour < 17 ? "Good Afternoon!" :
    hour < 21 ? "Good Evening!" : "Good Night!";

  const greetingEmoji =
    hour < 12 ? "🌅" :
    hour < 17 ? "☀️" :
    hour < 21 ? "🌆" : "🌙";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pb-28 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400/5 dark:bg-purple-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* HEADER */}
      <div className={`relative z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Hello, {username}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span>{greetingEmoji}</span>
                <span>{greeting}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="relative z-10 mx-6 mt-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <svg
              className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      ) : (
        <div className={`relative z-10 px-6 py-6 space-y-6 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Attendance Summary */}
          <AttendanceSummaryCard loading={loading} total={total} attended={attended} />

          {/* Today's Lectures Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Today's Lectures
              </h2>
              
              {!loading && todayLectures.length > 0 && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium">
                  {todayLectures.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 rounded-2xl h-24 animate-pulse border border-gray-200 dark:border-gray-800"
                  />
                ))}
              </div>
            ) : todayLectures.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                  No lectures scheduled
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  Enjoy your free day! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayLectures.map((l, i) => (
                  <TodayLectureCard key={i} lecture={l} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP */}
      {showDialog && activeLecture && (
        <AttendanceDialog
          lecture={activeLecture}
          saving={saving}
          onClose={() => {}}
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
                const lectureId = `${dateKey}_${activeLecture.startTime.replace(":", "")}_${activeLecture.endTime.replace(":", "")}`;

                const attRef = doc(subjectRef, "attendance", lectureId);
                if ((await tx.get(attRef)).exists()) throw new Error("Already marked");

                const snap = await tx.get(subjectRef);
                tx.set(attRef, {
                  status,
                  date: today,
                  startTime: activeLecture.startTime,
                  endTime: activeLecture.endTime,
                  createdAt: new Date(),
                });

                tx.update(subjectRef, {
                  totalClasses: (snap.data()?.totalClasses ?? 0) + 1,
                  attendedClasses:
                    (snap.data()?.attendedClasses ?? 0) +
                    (status === "Present" ? 1 : 0),
                });
              });

              setSaving(false);
              setShowDialog(false);
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