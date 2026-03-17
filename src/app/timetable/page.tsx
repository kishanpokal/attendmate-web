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
  ChevronRight,
  BookOpen,
  Zap,
  Activity,
  X,
  Layers
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

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

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
    showToast("Timetable saved successfully! 🎉", "success");
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

  /* ================= UI ================= */  return (
    <ProfessionalPageLayout>
      <div className="content-container p-4 sm:p-10 lg:p-16 space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-10 border-b border-gray-100 dark:border-white/5">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3 text-primary">
              <div className="flex -space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-pulse delay-75" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Weekly Schedule</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-black text-foreground tracking-tight leading-none uppercase">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-rose-500">Timetable</span>
            </h1>
            <p className="text-gray-400 font-bold text-base sm:text-lg max-w-xl leading-relaxed uppercase tracking-tighter">
              Manage your weekly classes. Set up your schedule for the semester.
            </p>
          </div>
          
          <div className="flex items-center gap-5 premium-glass px-8 py-5 rounded-[2rem] border-primary/5 shadow-2xl premium-card group shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-2">Status</p>
              <p className="text-3xl font-black text-foreground tracking-tight">Active</p>
            </div>
          </div>
        </header>

        {/* DAY SELECTOR */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Select Day</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border-color/50 to-transparent" />
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
            {DAYS.map((d, index) => {
              const isSelected = selectedDay === d;
              const lectureCount = (timetable[d] || []).length;

              return (
                <motion.button
                  key={d}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(d)}
                  className={`relative flex-shrink-0 flex flex-col items-center min-w-[7rem] p-6 rounded-[2.5rem] transition-all duration-500 border-2 overflow-hidden group ${
                    isSelected
                      ? "bg-primary border-primary shadow-2xl shadow-primary/30"
                      : "bg-white/5 border-white/5 hover:border-primary/20 premium-glass"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeDayGlow"
                      className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"
                    />
                  )}
                  <span className={`text-xs font-black uppercase tracking-widest mb-2 transition-colors duration-500 ${
                    isSelected ? "text-white" : "text-gray-500 group-hover:text-foreground"
                  }`}>
                    {d.slice(0, 3)}
                  </span>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    isSelected 
                      ? "bg-white/20 text-white border border-white/30" 
                      : "bg-white/5 text-gray-400 border border-white/5 group-hover:scale-110"
                  }`}>
                    {lectureCount}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
          
          {/* LECTURES LIST */}
          <div className="xl:col-span-3 space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="w-1 h-10 bg-gradient-to-b from-primary to-purple-600 rounded-full" />
                <div>
                  <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">{DAY_LABELS[selectedDay]} Schedule</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                    {lectures.length} Classes Scheduled
                  </p>
                </div>
              </div>

              {selectedDay !== "MONDAY" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyPreviousDay}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary transition-all group"
                >
                  <Copy className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Duplicate Previous Day</span>
                </motion.button>
              )}
            </div>

            {pageLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-40 premium-glass rounded-[2.5rem] p-8 border-white/5 animate-pulse" />
                ))}
              </div>
            ) : lectures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {lectures.map((lec, index) => (
                    <motion.div
                      key={lec.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative h-full"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-[2.5rem] blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                      <div className="relative premium-glass rounded-[2.5rem] p-8 border-white/10 shadow-2xl premium-card overflow-hidden h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-primary/20">
                              <BookOpen className="w-7 h-7" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1 leading-none">Subject</p>
                              <h4 className="text-xl font-black text-foreground tracking-tight leading-none uppercase truncate group-hover:text-primary transition-colors">
                                {lec.subjectName}
                              </h4>
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 12 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteConfirm(lec.id)}
                            className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.button>
                        </div>

                        <div className="mt-8 flex items-end justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 w-fit">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                                {formatTime(lec.startTime)} - {formatTime(getEndTime(lec.startTime, lec.durationHours))}
                              </span>
                            </div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4">
                              Duration: <span className="text-foreground">{lec.durationHours} {lec.durationHours === 1 ? "Hour" : "Hours"}</span>
                            </p>
                          </div>
                          <div className="w-12 h-1 bg-white/5 rounded-full" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-glass rounded-[3.5rem] p-16 text-center border-dashed border-2 border-white/10"
              >
                <div className="relative inline-block mb-8">
                  <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-primary border border-white/10 shadow-2xl">
                    <Calendar className="w-12 h-12" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-foreground uppercase tracking-tight mb-4">No Classes Scheduled</h3>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
                  Your timetable is currently empty for this day. Add a class to get started.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAdd(true)}
                  className="mt-10 inline-flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 border border-white/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Class
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* ACTIONS SIDEBAR */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Actions</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border-color/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <motion.button
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdd(true)}
                className="group relative w-full overflow-hidden p-8 rounded-[2.5rem] bg-primary text-white shadow-2xl shadow-primary/30 border border-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-8 h-8 mb-4 group-hover:rotate-90 transition-transform duration-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80">New Class</p>
                <p className="text-xl font-black uppercase tracking-tight">Add Class</p>
              </motion.button>

              <motion.button
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveTimetable}
                disabled={saving}
                className={`group relative w-full overflow-hidden p-8 rounded-[2.5rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 border border-white/10 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {saving ? (
                  <div className="w-8 h-8 mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform duration-500" />
                )}
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80">Save Changes</p>
                <p className="text-xl font-black uppercase tracking-tight">Save Timetable</p>
              </motion.button>
            </div>

            <div className="premium-glass rounded-[2.5rem] p-8 border-white/5 mt-10">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-primary" />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Schedule Overview</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Classes</p>
                  <p className="text-2xl font-black text-foreground">{Object.values(timetable).flat().length}</p>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    className="h-full bg-gradient-to-r from-primary to-purple-600"
                  />
                </div>
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                  Manage your schedule to ensure optimal attendance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <AnimatePresence>
        {/* ADD DIALOG */}
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md premium-glass rounded-[3.5rem] p-10 border border-primary/10 shadow-3xl premium-card"
            >
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <Plus className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Add Class</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Schedule a Class</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block px-2">Subject</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.8rem] text-sm text-foreground font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all uppercase appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-gray-900">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block px-2">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.8rem] text-sm text-foreground font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block px-2">Duration (Hours)</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((hour) => (
                      <button
                        key={hour}
                        onClick={() => setForm({ ...form, duration: hour })}
                        className={`py-6 rounded-[1.5rem] border-2 font-black transition-all ${
                          form.duration === hour
                            ? "bg-primary border-primary text-white shadow-xl shadow-primary/30"
                            : "bg-white/5 border-white/5 text-gray-500 hover:border-primary/30"
                        }`}
                      >
                        <span className="text-xl leading-none">{hour}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addLecture}
                    className="flex-1 py-5 rounded-[1.8rem] bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 transition-all border border-white/10"
                  >
                    Add
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE DIALOG */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md premium-glass rounded-[3.5rem] p-10 border border-primary/10 shadow-3xl text-center premium-card"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">Delete Class?</h3>
              <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">
                This class will be <span className="text-foreground">permanently removed</span> from your timetable.
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                >
                  Hold
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setTimetable((prev) => ({
                      ...prev,
                      [selectedDay]: lectures.filter((l) => l.id !== deleteConfirm),
                    }));
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-5 rounded-[1.8rem] bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-rose-500/30 transition-all border border-white/10"
                >
                  Purge
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST PANEL */}
      <AnimatePresence>
        {toast.message && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={`flex items-center gap-4 px-10 py-5 rounded-[2rem] border shadow-3xl premium-glass ${
              toast.type === 'success' 
                ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
                : 'bg-rose-500/90 border-rose-400/50 text-white'
            }`}>
              {toast.type === 'success' ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              <span className="font-black text-xs uppercase tracking-[0.2em]">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL PAGE LOADER */}
      <AnimatePresence>
        {pageLoading && (
          <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_var(--primary-glow)]" />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px]">Loading Timetable...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </ProfessionalPageLayout>
  );
}