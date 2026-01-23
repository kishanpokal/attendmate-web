"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Subject = {
  id: string;
  name: string;
};

export default function AddAttendancePage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [status, setStatus] = useState<"Present" | "Absent">("Present");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!auth.currentUser) router.replace("/login");
  }, [router]);

  /* ---------------- LOAD SUBJECTS ---------------- */
  useEffect(() => {
    const loadSubjects = async () => {
      if (!auth.currentUser) return;

      setLoadingSubjects(true);
      try {
        const snap = await getDocs(
          collection(db, "users", auth.currentUser.uid, "subjects")
        );

        setSubjects(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name,
          }))
        );
      } catch (error) {
        console.error("Error loading subjects:", error);
      } finally {
        setLoadingSubjects(false);
      }
    };

    loadSubjects();
  }, []);

  /* ---------------- SAVE ATTENDANCE ---------------- */
  const saveAttendance = async () => {
    if (!auth.currentUser) return;

    if (!subjectId || !date || !startTime || !endTime) {
      alert("All fields are required");
      return;
    }

    if (startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    setLoading(true);

    try {
      const uid = auth.currentUser.uid;

      /* ---------------- Build lectureId ---------------- */
      const dateKey = date;
      const startKey = startTime.replace(":", "");
      const endKey = endTime.replace(":", "");
      const lectureId = `${dateKey}_${startKey}_${endKey}`;

      /* ---------------- Compute lectureKey ---------------- */
      const dateObj = new Date(date);
      const dayName = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ][dateObj.getDay()];

      const startHour = parseInt(startTime.split(":")[0]);
      const endHour = parseInt(endTime.split(":")[0]);
      const slotIndex = startHour - 9;
      const durationHours = endHour - startHour;

      const lectureKey =
        slotIndex >= 0 && durationHours > 0
          ? `${dayName}_${slotIndex}_${durationHours}`
          : null;

      /* ---------------- Firestore refs ---------------- */
      const subjectRef = doc(db, "users", uid, "subjects", subjectId);
      const attendanceRef = doc(
        db,
        "users",
        uid,
        "subjects",
        subjectId,
        "attendance",
        lectureId
      );

      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      await runTransaction(db, async (transaction) => {
        const attendanceSnap = await transaction.get(attendanceRef);
        if (attendanceSnap.exists()) {
          throw new Error("Attendance already marked for this lecture");
        }

        const subjectSnap = await transaction.get(subjectRef);
        if (!subjectSnap.exists()) {
          throw new Error("Subject not found");
        }

        const subject = subjectSnap.data();

        const attendanceData: any = {
          date: Timestamp.fromDate(dateObj),
          startTime: Timestamp.fromDate(start),
          endTime: Timestamp.fromDate(end),
          status,
          createdAt: Timestamp.now(),
        };

        if (lectureKey) {
          attendanceData.lectureKey = lectureKey;
        }

        transaction.set(attendanceRef, attendanceData);

        transaction.update(subjectRef, {
          totalClasses: (subject.totalClasses ?? 0) + 1,
          attendedClasses:
            status === "Present"
              ? (subject.attendedClasses ?? 0) + 1
              : subject.attendedClasses ?? 0,
        });
      });

      // Reset form
      setSubjectId("");
      setSubjectName("");
      setStartTime("");
      setEndTime("");
      setStatus("Present");

      alert("Attendance saved successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pb-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400/5 dark:bg-purple-600/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* HEADER */}
      <div
        className={`relative z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-1000 ${
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
                Add Attendance
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Fill in the details below
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`relative z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto transition-all duration-1000 delay-200 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Mark Attendance
                </h2>
                <p className="text-indigo-100 text-sm sm:text-base mt-1">
                  Record your lecture attendance
                </p>
              </div>
            </div>
          </div>

          {/* Subject Details Section */}
          <div>
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 px-2 uppercase tracking-wide">
              Subject Details
            </h3>

            {loadingSubjects ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                  className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Subject
                        </p>
                        <p
                          className={`text-sm sm:text-base font-semibold ${
                            subjectName
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-500 dark:text-gray-500"
                          }`}
                        >
                          {subjectName || "Select a subject"}
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                        showSubjectDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {showSubjectDropdown && (
                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-60 overflow-y-auto">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => {
                          setSubjectId(subject.id);
                          setSubjectName(subject.name);
                          setShowSubjectDropdown(false);
                        }}
                        className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors first:rounded-t-2xl last:rounded-b-2xl flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {subject.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lecture Details Section */}
          <div>
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 px-2 uppercase tracking-wide">
              Lecture Details
            </h3>

            <div className="space-y-4">
              {/* Date */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400"
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
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Lecture Date
                    </p>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400"
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
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Start Time
                      </p>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* End Time */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400"
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
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                        End Time
                      </p>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Status Section */}
          <div>
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 px-2 uppercase tracking-wide">
              Attendance Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Present */}
              <button
                onClick={() => setStatus("Present")}
                className={`group rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 ${
                  status === "Present"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400 scale-105"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700"
                }`}
              >
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                      status === "Present"
                        ? "bg-green-500 dark:bg-green-600"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 sm:w-7 sm:h-7 ${
                        status === "Present"
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span
                    className={`text-lg sm:text-xl font-bold ${
                      status === "Present"
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    Present
                  </span>
                </div>
              </button>

              {/* Absent */}
              <button
                onClick={() => setStatus("Absent")}
                className={`group rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 ${
                  status === "Absent"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400 scale-105"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-700"
                }`}
              >
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                      status === "Absent"
                        ? "bg-red-500 dark:bg-red-600"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 sm:w-7 sm:h-7 ${
                        status === "Absent"
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span
                    className={`text-lg sm:text-xl font-bold ${
                      status === "Absent"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    Absent
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveAttendance}
            disabled={loading || !subjectId || !date || !startTime || !endTime}
            className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
                <span>Save Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}