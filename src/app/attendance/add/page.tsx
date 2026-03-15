"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Subject = {
  id: string;
  name: string;
};

type Toast = {
  message: string;
  type: "success" | "error" | "";
};

export default function AddAttendancePage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [status, setStatus] = useState<"Present" | "Absent">("Present");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [toast, setToast] = useState<Toast>({ message: "", type: "" });

  /* ---------------- INIT & GUARDS ---------------- */
  useEffect(() => {
    setMounted(true);
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [router, user, authLoading]);

  /* ---------------- OUTSIDE CLICK & TOAST CLEAR ---------------- */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSubjectDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  /* ---------------- LOAD SUBJECTS ---------------- */
  useEffect(() => {
    const loadSubjects = async () => {
      if (authLoading) return;
      if (!user) return;
      setLoadingSubjects(true);
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "subjects"));
        setSubjects(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
      } catch (error) {
        showToast("Error loading subjects", "error");
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [user, authLoading]);

  /* ---------------- SMART TIME HANDLERS ---------------- */
  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    // Auto-set end time to 1 hour later for better UX
    if (val) {
      const [h, m] = val.split(":").map(Number);
      const endH = (h + 1) % 24;
      setEndTime(`${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  };

  const addHoursToEndTime = (hours: number) => {
    if (!startTime) return;
    const [h, m] = startTime.split(":").map(Number);
    const endH = (h + hours) % 24;
    setEndTime(`${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  };

  const setDateQuick = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split("T")[0]);
  };

  /* ---------------- SAVE ATTENDANCE ---------------- */
  const saveAttendance = async () => {
    if (!user) return;

    if (!subjectId || !date || !startTime || !endTime) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (startTime >= endTime && parseInt(endTime.split(":")[0]) !== 0) {
      showToast("End time must be after start time", "error");
      return;
    }

    setLoading(true);

    try {
      const uid = user.uid;
      const dateKey = date;
      const startKey = startTime.replace(":", "");
      const endKey = endTime.replace(":", "");
      const lectureId = `${dateKey}_${startKey}_${endKey}`;

      const dateObj = new Date(date);
      const dayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][dateObj.getDay()];
      const startHour = parseInt(startTime.split(":")[0]);
      const endHour = parseInt(endTime.split(":")[0]);
      const slotIndex = startHour - 9;
      // Handle midnight wrap-around for duration calculation
      const durationHours = endHour < startHour ? (24 - startHour + endHour) : (endHour - startHour);

      const lectureKey = slotIndex >= 0 && durationHours > 0 ? `${dayName}_${slotIndex}_${durationHours}` : null;

      const subjectRef = doc(db, "users", uid, "subjects", subjectId);
      const attendanceRef = doc(db, "users", uid, "subjects", subjectId, "attendance", lectureId);

      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);
      if (endHour < startHour) end.setDate(end.getDate() + 1); // handle overnight shifts if any

      await runTransaction(db, async (transaction) => {
        const attendanceSnap = await transaction.get(attendanceRef);
        if (attendanceSnap.exists()) throw new Error("Attendance already logged for this time");

        const subjectSnap = await transaction.get(subjectRef);
        if (!subjectSnap.exists()) throw new Error("Subject not found");

        const subject = subjectSnap.data();
        const attendanceData: any = {
          date: Timestamp.fromDate(dateObj),
          startTime: Timestamp.fromDate(start),
          endTime: Timestamp.fromDate(end),
          status,
          createdAt: Timestamp.now(),
        };

        if (lectureKey) attendanceData.lectureKey = lectureKey;
        if (note.trim() !== "") attendanceData.note = note.trim();

        transaction.set(attendanceRef, attendanceData);
        transaction.update(subjectRef, {
          totalClasses: (subject.totalClasses ?? 0) + 1,
          attendedClasses: status === "Present" ? (subject.attendedClasses ?? 0) + 1 : subject.attendedClasses ?? 0,
        });
      });

      // Reset
      setSubjectId("");
      setSubjectName("");
      setStartTime("");
      setEndTime("");
      setStatus("Present");
      setNote("");
      showToast("Attendance logged successfully! 🎉", "success");

    } catch (error: any) {
      showToast(error.message || "Failed to log attendance", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI RENDER ---------------- */
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30 pb-12">

      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${toast.message ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white' : 'bg-rose-500/90 border-rose-400/50 text-white'}`}>
          {toast.type === 'success'
            ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          <span className="font-bold tracking-wide">{toast.message}</span>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Header */}
      <div className={`sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Record Session</h1>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className={`relative z-10 px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto transition-all duration-1000 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-10 space-y-10">

          {/* --- SUBJECT SELECTION --- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">1. Select Subject</h3>
              {loadingSubjects && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                disabled={loadingSubjects || subjects.length === 0}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${showSubjectDropdown
                    ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10 dark:border-indigo-500"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${subjectName ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                      {subjects.length === 0 && !loadingSubjects ? "No subjects found" : subjectName || "Choose a subject..."}
                    </p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showSubjectDropdown ? "rotate-180 text-indigo-500" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Enhanced Dropdown Menu */}
              {showSubjectDropdown && (
                <div className="absolute z-20 w-full mt-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl max-h-[280px] overflow-y-auto custom-scrollbar overflow-hidden origin-top animate-in fade-in slide-in-from-top-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSubjectId(subject.id);
                        setSubjectName(subject.name);
                        setShowSubjectDropdown(false);
                      }}
                      className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/30 last:border-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-gray-900 dark:text-gray-100 font-bold">{subject.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* --- DATE & TIME --- */}
          <section className="space-y-5">
            <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">2. Timing Details</h3>

            {/* Date Input with Quick Select */}
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1 relative">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-transparent text-lg font-black text-gray-900 dark:text-white border-none focus:outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>
                {/* Quick Date Pills */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button onClick={() => setDateQuick(0)} className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Today</button>
                  <button onClick={() => setDateQuick(-1)} className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Yesterday</button>
                </div>
              </div>
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Start Time */}
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Starts At</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-transparent text-lg font-black text-gray-900 dark:text-white border-none focus:outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>
              </div>

              {/* End Time */}
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Ends At</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-transparent text-lg font-black text-gray-900 dark:text-white border-none focus:outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>
                {/* Quick Add Hour Pills */}
                {startTime && (
                  <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                    <button onClick={() => addHoursToEndTime(1)} className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-100 transition-colors">+1 hr</button>
                    <button onClick={() => addHoursToEndTime(2)} className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-100 transition-colors">+2 hr</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* --- ATTENDANCE STATUS --- */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">3. Mark Status</h3>
            <div className="grid grid-cols-2 gap-4">

              {/* Present Card */}
              <button
                onClick={() => setStatus("Present")}
                className={`relative overflow-hidden group rounded-3xl p-6 sm:p-8 transition-all duration-300 border-2 text-left ${status === "Present"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 dark:border-emerald-400 shadow-lg shadow-emerald-500/20"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900"
                  }`}
              >
                {status === "Present" && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl -mr-10 -mt-10" />}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${status === "Present" ? "bg-emerald-500 text-white shadow-md scale-110" : "bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-500"}`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h4 className={`text-xl sm:text-2xl font-black ${status === "Present" ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400"}`}>Attended</h4>
                <p className={`text-sm mt-1 font-semibold ${status === "Present" ? "text-emerald-600/70 dark:text-emerald-500/70" : "text-gray-400/50"}`}>I was present</p>
              </button>

              {/* Absent Card */}
              <button
                onClick={() => setStatus("Absent")}
                className={`relative overflow-hidden group rounded-3xl p-6 sm:p-8 transition-all duration-300 border-2 text-left ${status === "Absent"
                    ? "bg-rose-50 dark:bg-rose-500/10 border-rose-500 dark:border-rose-400 shadow-lg shadow-rose-500/20"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900"
                  }`}
              >
                {status === "Absent" && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/20 rounded-full blur-3xl -mr-10 -mt-10" />}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${status === "Absent" ? "bg-rose-500 text-white shadow-md scale-110" : "bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-rose-100 group-hover:text-rose-500"}`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h4 className={`text-xl sm:text-2xl font-black ${status === "Absent" ? "text-rose-700 dark:text-rose-400" : "text-gray-400"}`}>Missed</h4>
                <p className={`text-sm mt-1 font-semibold ${status === "Absent" ? "text-rose-600/70 dark:text-rose-500/70" : "text-gray-400/50"}`}>I was absent</p>
              </button>

            </div>

          </section>

          {/* --- NOTE --- */}
          <section className="space-y-3">
            <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              4. Note <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500">Optional</span>
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all">
              <textarea
                value={note}
                onChange={(e) => {
                  if (e.target.value.length <= 150) setNote(e.target.value);
                }}
                rows={2}
                placeholder="Reason for absence, topics covered, etc."
                className="w-full resize-none bg-transparent p-3 text-base font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
              />
              <div className="text-right px-3 pb-2 text-xs font-bold text-gray-400">
                {note.length} / 150
              </div>
            </div>
          </section>

          {/* --- SAVE BUTTON --- */}
          <button
            onClick={saveAttendance}
            disabled={loading || !subjectId || !date || !startTime || !endTime}
            className="group relative w-full overflow-hidden rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-lg py-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl disabled:hover:translate-y-0"
          >
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 dark:group-hover:opacity-10 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient" />

            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 dark:border-gray-900/30 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
                  <span>Logging Session...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  <span>Save Record</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient { animation: gradient 3s linear infinite; }
      `}} />
    </main>
  );
}