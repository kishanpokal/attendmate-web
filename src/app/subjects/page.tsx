"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group"
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

                  <button
                    onClick={addSubject}
                    disabled={adding || !subjectName.trim()}
                    className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {adding ? (
                      <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Add Subject</>
                    )}
                  </button>
                </div>
              </div>
            </div>

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
                  {subjects.map((s, index) => (
                    <div
                      key={s.id}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all overflow-hidden"
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

                        <button
                          onClick={() => setDeleteConfirm(s.id)}
                          className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-8 pt-6 border-t border-border-color/30 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Details ➔</span>
                      </div>
                    </div>
                  ))}
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
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 dark:bg-black/50" onClick={() => setDeleteConfirm(null)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl text-center"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">Delete Subject?</h3>
              <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">
                Deleting "<span className="text-foreground">{subjects.find((s) => s.id === deleteConfirm)?.name}</span>" will permanently erase all related attendance records.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeSubject(deleteConfirm)}
                  className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      {/* FULL PAGE LOADER */}
        {pageLoading && (
          <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-center">
            <div
              className="text-center space-y-4"
            >
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 font-semibold text-sm">Loading Subjects...</p>
            </div>
          </div>
        )}
    </ProfessionalPageLayout>
  );
}