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
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import { BookOpen, Plus, Trash2, ChevronLeft, Calendar, School, Activity, ShieldAlert } from "lucide-react";


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
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Manage Subjects</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-black text-foreground tracking-tight leading-none uppercase">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-rose-500">Subjects</span>
            </h1>
            <p className="text-gray-400 font-bold text-base sm:text-lg max-w-xl leading-relaxed">
              Add and manage the subjects you are taking this semester.
            </p>
          </div>
          
          <div className="flex items-center gap-5 premium-glass px-8 py-5 rounded-[2rem] border-primary/5 shadow-2xl premium-card group shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-2">Total Subjects</p>
              <p className="text-3xl font-black text-foreground tracking-tight">{subjects.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* ADD SUBJECT CARD */}
          <div className="xl:col-span-1 space-y-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="premium-glass rounded-[3rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group premium-card border-primary/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/20 border border-white/20">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">New Subject</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Add to list</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative group/input">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-primary transition-colors">
                      <School className="w-5 h-5" />
                    </div>
                    <input
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSubject()}
                      placeholder="Enter subject name..."
                      className="w-full pl-16 pr-8 py-5 bg-bg-subtle dark:bg-white/[0.03] border border-border-color rounded-[1.8rem] text-sm text-foreground font-black tracking-widest placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all uppercase"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addSubject}
                    disabled={adding || !subjectName.trim()}
                    className="w-full py-5 rounded-[1.8rem] bg-foreground text-background font-black text-xs tracking-[0.4em] uppercase shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {adding ? (
                      <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Add Subject</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* QUICK TIPS */}
            <div className="p-8 premium-glass rounded-[2.5rem] border-primary/5 space-y-4 opacity-60">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Note</h4>
              <p className="text-xs font-bold text-gray-500 leading-relaxed">
                When you add a new subject, its attendance will start at 0%. Statistics will update after you mark attendance for the first time.
              </p>
            </div>
          </div>

          {/* SUBJECTS GRID */}
          <div className="xl:col-span-2">
            {!pageLoading && subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {subjects.map((s, index) => (
                    <motion.div
                      key={s.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group relative bg-bg-subtle dark:bg-white/[0.03] rounded-[2.5rem] p-8 border border-border-color hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                            <BookOpen className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 leading-none">Subject</p>
                          <h4 className="font-black text-foreground text-2xl tracking-tighter uppercase leading-none truncate">
                            {s.name}
                          </h4>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteConfirm(s.id)}
                          className="w-12 h-12 rounded-[1.2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 overflow-hidden hover:text-white transition-all duration-300 border border-rose-500/20 group-hover:translate-x-0 sm:translate-x-12 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>

                      <div className="mt-8 pt-6 border-t border-border-color/30 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Details ➔</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : !pageLoading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center premium-glass rounded-[3.5rem] p-12 text-center border-2 border-dashed border-primary/10">
                <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 flex items-center justify-center mb-8 text-primary/30">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black text-foreground mb-4">No Subjects Found</h3>
                <p className="text-gray-400 font-bold max-w-sm mx-auto leading-relaxed">
                  You haven't added any subjects yet. Create your first subject to start tracking attendance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">Delete Subject?</h3>
              <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">
                Deleting "<span className="text-foreground">{subjects.find((s) => s.id === deleteConfirm)?.name}</span>" will permanently erase all related attendance records.
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => removeSubject(deleteConfirm)}
                  className="flex-1 py-5 rounded-[1.8rem] bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-rose-500/30 transition-all border border-white/10"
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL PAGE LOADER */}
      <AnimatePresence>
        {pageLoading && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_var(--primary-glow)]" />
              <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px]">Loading Subjects...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ProfessionalPageLayout>
  );
}