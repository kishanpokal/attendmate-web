"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ---------------- TYPES ---------------- */

type Day =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

type Subject = {
  id: string;
  name: string;
};

type Lecture = {
  id: string;
  subjectId: string;
  subjectName: string;
  startTime: string;
  durationHours: number;
};

/* ---------------- CONSTANTS ---------------- */

const DAYS: Day[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const DAY_LABELS: Record<Day, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

/* ---------------- HELPERS ---------------- */

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(a: Lecture, b: Lecture) {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = aStart + a.durationHours * 60;
  const bStart = timeToMinutes(b.startTime);
  const bEnd = bStart + b.durationHours * 60;
  return aStart < bEnd && bStart < aEnd;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function getEndTime(startTime: string, duration: number) {
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + duration * 60;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;
  return `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
}

/* ---------------- PAGE ---------------- */

export default function TimetablePage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [selectedDay, setSelectedDay] = useState<Day>("MONDAY");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<Record<Day, Lecture[]>>({} as any);
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    subjectId: "",
    startTime: "09:00",
    duration: 1,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setPageLoading(true);

      // Subjects
      const subjectSnap = await getDocs(
        collection(db, "users", user.uid, "subjects")
      );
      setSubjects(
        subjectSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );

      // Timetable
      const ttSnap = await getDocs(
        collection(db, "users", user.uid, "timetable")
      );

      const map: Record<Day, Lecture[]> = {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
      };

      ttSnap.forEach((docu) => {
        const d = docu.data();
        map[d.day as Day].push({
          id: docu.id,
          subjectId: d.subjectId,
          subjectName: d.subjectName,
          startTime: d.startTime,
          durationHours: d.durationHours,
        });
      });

      DAYS.forEach(
        (d) =>
          (map[d] = map[d].sort(
            (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
          ))
      );

      setTimetable(map);
      setPageLoading(false);
    };

    load();
  }, [user]);

  const lectures = timetable[selectedDay] || [];

  /* ---------------- ACTIONS ---------------- */
  function addLecture() {
    const subject = subjects.find((s) => s.id === form.subjectId);
    if (!subject) {
      alert("Please select a subject");
      return;
    }

    const newLecture: Lecture = {
      id: crypto.randomUUID(),
      subjectId: subject.id,
      subjectName: subject.name,
      startTime: form.startTime,
      durationHours: form.duration,
    };

    if (lectures.some((l) => overlaps(l, newLecture))) {
      alert("This lecture overlaps with an existing one");
      return;
    }

    setTimetable((prev) => ({
      ...prev,
      [selectedDay]: [...lectures, newLecture].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      ),
    }));

    setShowAdd(false);
    setForm({ subjectId: "", startTime: "09:00", duration: 1 });
  }

  async function saveTimetable() {
    if (!user) return;

    setSaving(true);
    const batch = writeBatch(db);
    const ref = collection(db, "users", user.uid, "timetable");

    const old = await getDocs(ref);
    old.forEach((d) => batch.delete(d.ref));

    Object.entries(timetable).forEach(([day, list]) => {
      list.forEach((lec) => {
        batch.set(doc(ref, `${day}_${lec.id}`), {
          day,
          subjectId: lec.subjectId,
          subjectName: lec.subjectName,
          startTime: lec.startTime,
          durationHours: lec.durationHours,
          createdAt: new Date(),
        });
      });
    });

    await batch.commit();
    setSaving(false);
    alert("Timetable saved successfully");
  }

  function copyPreviousDay() {
    const currentIndex = DAYS.indexOf(selectedDay);
    if (currentIndex === 0) return;

    const previousDay = DAYS[currentIndex - 1];
    const copied = (timetable[previousDay] || []).map((lec) => ({
      ...lec,
      id: crypto.randomUUID(),
    }));

    setTimetable((prev) => ({
      ...prev,
      [selectedDay]: copied.sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      ),
    }));
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pb-8 transition-colors duration-300">
      {/* HEADER */}
      <div
        className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
                Timetable Setup
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Organize your weekly schedule
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto transition-all duration-1000 delay-200 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* DAY SELECTOR */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 px-2 uppercase tracking-wide">
            Select Day
          </h3>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
            {DAYS.map((d, index) => {
              const isSelected = selectedDay === d;
              const lectureCount = (timetable[d] || []).length;

              return (
                <motion.button
                  key={d}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => setSelectedDay(d)}
                  className={`flex-shrink-0 flex flex-col items-center min-w-[4rem] sm:min-w-[4.5rem] p-3 sm:p-4 rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 shadow-lg scale-105"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-bold mb-1 ${
                      isSelected
                        ? "text-white"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {d.slice(0, 3)}
                  </span>
                  {lectureCount > 0 && (
                    <span
                      className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {lectureCount}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* DAY HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {DAY_LABELS[selectedDay]}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lectures.length}{" "}
                {lectures.length === 1 ? "lecture" : "lectures"}
              </p>
            </div>
          </div>

          {selectedDay !== "MONDAY" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyPreviousDay}
              className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </motion.button>
          )}
        </div>

        {/* LECTURES GRID */}
        {!pageLoading && lectures.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <AnimatePresence mode="popLayout">
              {lectures.map((lec, index) => (
                <motion.div
                  key={lec.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="group bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDeleteConfirm(lec.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </motion.button>
                  </div>

                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {lec.subjectName}
                  </h4>

                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      {formatTime(lec.startTime)} -{" "}
                      {formatTime(getEndTime(lec.startTime, lec.durationHours))}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    {lec.durationHours} {lec.durationHours === 1 ? "hour" : "hours"}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* EMPTY STATE */}
        {!pageLoading && lectures.length === 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-12 border border-gray-200 dark:border-gray-800 text-center mb-6"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400"
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
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No lectures scheduled
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Add your first lecture to get started with your timetable
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Lecture
            </motion.button>
          </motion.div>
        )}

        {/* ACTION BUTTONS */}
        {!pageLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-2xl font-semibold hover:shadow-xl transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Lecture
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={saveTimetable}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Save Timetable
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* ADD LECTURE DIALOG */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Add New Lecture
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure your lecture details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                    Subject
                  </label>
                  <select
                    value={form.subjectId}
                    onChange={(e) =>
                      setForm({ ...form, subjectId: e.target.value })
                    }
                    className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((hour) => (
                      <button
                        key={hour}
                        onClick={() => setForm({ ...form, duration: hour })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          form.duration === hour
                            ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400"
                            : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                        }`}
                      >
                        <div
                          className={`text-2xl font-bold ${
                            form.duration === hour
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {hour}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {hour === 1 ? "hour" : "hours"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addLecture}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Add Lecture
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Delete Lecture?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setTimetable((prev) => ({
                      ...prev,
                      [selectedDay]: lectures.filter((l) => l.id !== deleteConfirm),
                    }));
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}