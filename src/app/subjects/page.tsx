"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";


/* ================= TYPES ================= */

type Subject = {
  id: string;
  name: string;
};

/* ================= PAGE ================= */

export default function SubjectsPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [subjectName, setSubjectName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------- AUTH GUARD ---------- */
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  /* ---------- LOAD SUBJECTS ---------- */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setPageLoading(true);

      const q = query(
        collection(db, "users", user.uid, "subjects"),
        orderBy("createdAt", "asc")
      );

      const snap = await getDocs(q);

      setSubjects(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );

      setPageLoading(false);
    };

    load();
  }, [user]);

  /* ---------- ADD SUBJECT ---------- */
  const addSubject = async () => {
    if (!subjectName.trim() || !user) return;

    setAdding(true);

    const ref = await addDoc(collection(db, "users", user.uid, "subjects"), {
      name: subjectName.trim(),
      totalClasses: 0,
      attendedClasses: 0,
      createdAt: Date.now(),
    });

    setSubjects((prev) => [...prev, { id: ref.id, name: subjectName.trim() }]);

    setSubjectName("");
    setAdding(false);
  };

  /* ---------- DELETE SUBJECT ---------- */
  const removeSubject = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "subjects", id));

    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirm(null);
  };

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
                Manage Subjects
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Add or remove subjects for attendance tracking
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
        {/* ADD SUBJECT CARD */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Add New Subject
            </h2>
          </div>

          <input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addSubject()}
            placeholder="Subject name (e.g., Deep Learning)"
            className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border border-white/30 focus:border-white/60 focus:outline-none transition-all duration-300 mb-4"
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={addSubject}
            disabled={adding || !subjectName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-white text-indigo-600 dark:text-indigo-700 py-4 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {adding ? (
              <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-700 border-t-transparent rounded-full animate-spin" />
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Subject
              </>
            )}
          </motion.button>
        </motion.div>

        {/* SUBJECTS GRID */}
        {!pageLoading && subjects.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 px-2">
              Your Subjects ({subjects.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {subjects.map((s, index) => (
                  <motion.div
                    key={s.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-3">
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
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg truncate">
                          {s.name}
                        </h4>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteConfirm(s.id)}
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!pageLoading && subjects.length === 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 sm:py-24"
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 dark:text-indigo-400"
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
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No subjects yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Start by adding your first subject using the form above
            </p>
          </motion.div>
        )}
      </div>

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
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
                Delete Subject?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                This will permanently delete "
                {subjects.find((s) => s.id === deleteConfirm)?.name}" and all
                its attendance records.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeSubject(deleteConfirm)}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL PAGE LOADER */}
      <AnimatePresence>
        {pageLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-3xl px-8 py-6 flex flex-col items-center gap-4 border border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                Loading subjects...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </main>
  );
}