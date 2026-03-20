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
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Copy,
  Save,
  Check,
  AlertCircle,
  X,
  ChevronDown,
  BookOpen
} from "lucide-react";

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
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    subjectId: "",
    startTime: "09:00",
    duration: 1,
  });

  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setPageLoading(true);
      try {
        const subjectSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
        setSubjects(subjectSnap.docs.map((d) => ({ id: d.id, name: d.data().name })));

        const ttSnap = await getDocs(collection(db, "users", user.uid, "timetable"));
        const map: Record<Day, Lecture[]> = {
          MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [], SATURDAY: [],
        };

        ttSnap.forEach((docu) => {
          const d = docu.data();
          if (map[d.day as Day]) {
            map[d.day as Day].push({
              id: docu.id,
              subjectId: d.subjectId,
              subjectName: d.subjectName,
              startTime: d.startTime,
              durationHours: d.durationHours,
            });
          }
        });

        DAYS.forEach((d) => {
          map[d] = map[d].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        });

        setTimetable(map);
      } catch (error) {
        console.error("Error loading timetable", error);
        showToast("Failed to load data", "error");
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [user]);

  const lectures = timetable[selectedDay] || [];

  /* ---------------- ACTIONS ---------------- */
  function addLecture() {
    const subject = subjects.find((s) => s.id === form.subjectId);
    if (!subject) return showToast("Please select a subject", "error");

    const newLecture: Lecture = {
      id: crypto.randomUUID(),
      subjectId: subject.id,
      subjectName: subject.name,
      startTime: form.startTime,
      durationHours: form.duration,
    };

    if (lectures.some((l) => overlaps(l, newLecture))) {
      return showToast("Class overlaps with an existing schedule", "error");
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
    try {
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
      showToast("Schedule updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to save schedule", "error");
    } finally {
      setSaving(false);
    }
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
  if (pageLoading) {
    return (
      <ProfessionalPageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </ProfessionalPageLayout>
    );
  }

  return (
    <ProfessionalPageLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight mb-2">
              Timetable
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Manage your weekly class schedule and view upcoming sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-900 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
            <button
              onClick={saveTimetable}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* SIDEBAR: DAY SELECTOR */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-xl border border-gray-200 dark:border-zinc-800 flex flex-row lg:flex-col gap-1 overflow-x-auto">
              {DAYS.map((d) => {
                const isSelected = selectedDay === d;
                const count = (timetable[d] || []).length;

                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isSelected
                        ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-50 shadow-sm border border-gray-200 dark:border-zinc-700"
                        : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800/50 border border-transparent"
                      }`}
                  >
                    <span>{DAY_LABELS[d]}</span>
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${isSelected
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SCHEDULE VIEW */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">

              <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
                <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                  {DAY_LABELS[selectedDay]} Classes
                </h2>
                {selectedDay !== "MONDAY" && (
                  <button
                    onClick={copyPreviousDay}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy from previous day
                  </button>
                )}
              </div>

              <div className="p-0">
                {lectures.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-zinc-800">
                    <AnimatePresence>
                      {lectures.map((lec) => (
                        <motion.div
                          key={lec.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-start gap-4 mb-4 sm:mb-0">
                            <div className="mt-1 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                                {lec.subjectName}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-zinc-400">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(lec.startTime)} - {formatTime(getEndTime(lec.startTime, lec.durationHours))}
                                </span>
                                <span>•</span>
                                <span>{lec.durationHours} hr{lec.durationHours > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setDeleteConfirm(lec.id)}
                            className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors sm:opacity-0 group-hover:opacity-100"
                          >
                            Remove
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">No classes scheduled</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">You have a free day on {DAY_LABELS[selectedDay]}.</p>
                    <button
                      onClick={() => setShowAdd(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Schedule a class
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <AnimatePresence>

        {/* ADD CLASS MODAL */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800"
            >
              <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">Add Class</h3>
                <button
                  onClick={() => setShowAdd(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Subject Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Subject</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    >
                      <span className={`text-sm ${form.subjectId ? "text-gray-900 dark:text-zinc-100" : "text-gray-500 dark:text-zinc-400"}`}>
                        {form.subjectId ? subjects.find(s => s.id === form.subjectId)?.name : "Select a subject..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {isSubjectDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                        {subjects.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">No subjects available.</div>
                        ) : (
                          subjects.map(s => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setForm({ ...form, subjectId: s.id });
                                setIsSubjectDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              {s.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Time */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm [color-scheme:light_dark]"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Duration (Hours)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((hour) => (
                      <button
                        key={hour}
                        onClick={() => setForm({ ...form, duration: hour })}
                        className={`py-2 rounded-lg text-sm font-medium transition-all border ${form.duration === hour
                            ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          }`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addLecture}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Add Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-zinc-800"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50 mb-1">Remove Class</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                    Are you sure you want to remove this class from your {DAY_LABELS[selectedDay]} schedule? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
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
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                >
                  Remove Class
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* TOAST */}
        {toast.message && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success'
                ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200'
              }`}>
              {toast.type === 'success' ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProfessionalPageLayout>
  );
}