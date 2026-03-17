"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Layout, 
  BarChart3, 
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Github,
  Twitter,
  Mail
} from "lucide-react";
import LandingNavbar from "@/components/navigation/LandingNavbar";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* ─── Navigation Bar ─── */}
      <LandingNavbar />

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-32 px-4">
        <div className="content-container flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Version 2.0 Now Live</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight text-gray-900 dark:text-white"
          >
            Never Miss a Class <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">Without Knowing the Cost.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10 font-medium leading-relaxed"
          >
            AttendMate is the intelligent attendance tracker for students. 
            Know your exact attendance percentage, get AI predictions on how many 
            classes you can safely skip, and track your friends' status all in one place.
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button 
              onClick={() => router.push("/login")}
              className="px-10 py-5 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => router.push("/register")}
              className="px-10 py-5 rounded-2xl premium-glass font-black text-lg border-border-color hover:bg-bg-subtle/50 transition-all"
            >
              Join the Community
            </button>
          </motion.div>

          {/* Core Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 w-full max-w-5xl bg-white dark:bg-zinc-900/50 rounded-2xl p-2 shadow-2xl border border-gray-200 dark:border-zinc-800 backdrop-blur-sm"
          >
            <div className="bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
               {/* Browser Chrome */}
               <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-emerald-400" />
                 </div>
                 <div className="mx-auto flex items-center justify-center h-6 w-full max-w-md bg-gray-100 dark:bg-zinc-800 rounded text-xs font-semibold text-gray-500 dark:text-gray-400">
                    attendmate.app
                 </div>
               </div>
               {/* App Preview Area */}
               <div className="aspect-video bg-gray-50 dark:bg-black/40 flex items-center justify-center p-8 relative">
                 <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-zinc-900/[0.04] bg-[bottom_1px_center]" style={{ maskImage: "linear-gradient(to bottom, transparent, black)" }}></div>
                 
                 <div className="relative z-10 w-full max-w-3xl grid grid-cols-3 gap-6">
                    {/* Fake UI Elements for visual context */}
                    <div className="col-span-1 space-y-4 hidden md:block">
                        <div className="h-24 bg-white dark:bg-zinc-900/80 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800/80 p-4">
                           <div className="w-10 h-10 bg-primary/10 rounded-lg mb-3"></div>
                           <div className="h-2 w-16 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
                           <div className="h-4 w-12 bg-gray-300 dark:bg-zinc-600 rounded"></div>
                        </div>
                        <div className="h-48 bg-white dark:bg-zinc-900/80 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800/80 p-4 flex flex-col justify-between">
                            <div className="h-2 w-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                            <div className="space-y-2">
                               <div className="h-10 bg-gray-50 dark:bg-zinc-800 rounded-lg"></div>
                               <div className="h-10 bg-gray-50 dark:bg-zinc-800 rounded-lg"></div>
                               <div className="h-10 bg-gray-50 dark:bg-zinc-800 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-3 md:col-span-2 space-y-4">
                        <div className="h-32 bg-white dark:bg-zinc-900/80 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800/80 p-6 flex flex-col justify-center items-center text-center">
                            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">78%</div>
                            <div className="text-sm font-medium text-gray-500">Overall Attendance</div>
                            <div className="mt-4 flex gap-4 w-full">
                                <div className="h-1.5 flex-1 bg-emerald-500 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-emerald-500 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-emerald-500/20 rounded-full"></div>
                            </div>
                        </div>
                        
                        <div className="h-40 bg-white dark:bg-zinc-900/80 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800/80 p-6 relative overflow-hidden">
                             <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-bl-[100px]"></div>
                             <div className="relative z-10 space-y-4">
                               <div className="h-3 w-32 bg-primary/20 rounded"></div>
                               <div className="h-2 w-48 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                               <div className="h-2 w-40 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                               <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary dark:text-primary-foreground bg-primary/10 px-3 py-1.5 rounded-full">
                                  <Sparkles className="w-3 h-3" /> Safely Skip Math Today
                               </div>
                             </div>
                        </div>
                    </div>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features Bento Grid ─── */}
      <section id="features" className="py-24 px-4 bg-gray-50/50 dark:bg-zinc-900/20 scroll-mt-24 border-y border-gray-100 dark:border-zinc-800/50">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white">
                Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">stay above 75%</span>
             </h2>
             <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto">
               Stop guessing if you can skip that boring lecture. AttendMate gives you the exact math, AI predictions, and tracking tools to optimize your college life.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
            {/* Feature 1 */}
            <div className="md:col-span-3 lg:col-span-4 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Tracking</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium">
                Log your "present" or "absent" status with one click. We calculate your overall score and individual subject stats instantly.
              </p>
            </div>

            {/* Feature 2: HIGHLIGHTED AI */}
            <div className="md:col-span-3 lg:col-span-4 bg-gradient-to-br from-primary to-indigo-600 relative overflow-hidden rounded-3xl p-8 shadow-xl shadow-primary/20 text-white border-none group">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-[100px] transition-transform group-hover:scale-110"></div>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Bunk Predictor</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Ask our AI assistant "How many classes can I skip?" or "What happens if I miss math today?" and get accurate, data-backed answers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="md:col-span-6 lg:col-span-4 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Cloud Sync built-in</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium">
                Never lose your data. Your attendance records are securely saved to the cloud and synced instantly across your phone, tablet, and laptop.
              </p>
            </div>

            {/* Feature 4 - Large Row */}
            <div className="md:col-span-6 lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-10 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Keep tabs on friends</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-base font-medium">
                    Want to know if your buddy made it to the 8 AM lecture? Add friends and see their attendance status in real-time, right from your dashboard.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {["Real-time status tracking", "Find them using their User Tag", "Privacy controls included", "Built-in Leaderboards (soon)"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
            </div>

            {/* Feature 5 */}
             <div className="md:col-span-6 lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
               <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
                <Layout className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">No Ads, Infinite Polish</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium">
                We believe your tools shouldn't look like spreadsheets. Enjoy a fast, ad-free, premium interface crafted with beautiful typography and subtle animations. It is completely free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section id="copilot" className="py-24 px-4 text-center scroll-mt-24">
        <div className="w-full max-w-4xl mx-auto bg-gray-50 dark:bg-zinc-900 rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden border border-gray-200 dark:border-zinc-800">
           {/* Abstract background shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
           
           <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10 tracking-tight text-gray-900 dark:text-white">
             Ready to take control of <br className="hidden md:block" /> your semester?
           </h2>
           <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-lg mx-auto relative z-10">
             Join today and stop worrying about hitting minimum attendance requirements. It takes 30 seconds to set up your subjects.
           </p>
           
           <button 
             onClick={() => router.push("/login")}
             className="relative z-10 px-10 py-5 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 hover:-translate-y-1 transition-all shadow-xl shadow-primary/20"
           >
             Start Tracking for Free
           </button>
           <p className="mt-6 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px] relative z-10">
              No Credit Card • Full Access Forever
           </p>
        </div>
      </section>

      {/* ─── Minimal Footer ─── */}
      <footer className="py-12 mt-auto border-t border-gray-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/30">A</div>
          <span className="font-bold tracking-tight text-gray-900 dark:text-white text-lg">AttendMate</span>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">© 2026 AttendMate Cloud. All rights reserved.</p>
        <p className="text-xs font-semibold text-gray-400">Made with <span className="text-primary">♥</span> for students everywhere</p>
      </footer>
    </main>
  );
}