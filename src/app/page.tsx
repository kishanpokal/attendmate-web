"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Optimized particles with varied sizes and opacity for depth (Parallax effect)
  const particles = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 1, // varied sizes 1px to 5px
      opacity: Math.random() * 0.5 + 0.1, // varied opacity
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10, // slower, more elegant movement
    }));
  }, []);

  useEffect(() => {
    setMounted(true);

    // Non-linear progress simulation for a more realistic "loading" feel
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Slow down as it gets closer to 100%
        const increment = prev > 80 ? 0.5 : prev > 50 ? 1 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 30);

    const redirectTimer = setTimeout(() => {
      router.push("/login");
    }, 4500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  // Don't render until client-side hydration to prevent mismatch
  if (!mounted) return null;

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-500">
      
      {/* --- Background Ambience --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large rotating gradient blobs */}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen" />
        
        {/* Grid Pattern Overlay for "Tech" feel */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* --- Floating Particles --- */}
      <div className="absolute inset-0 z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-indigo-500/50 dark:bg-white/20 animate-float-slow"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* --- Main Content Card --- */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-8">
        
        {/* Glassmorphism Container */}
        <div className={`
          relative w-full max-w-2xl 
          backdrop-blur-xl bg-white/30 dark:bg-white/5 
          border border-white/20 dark:border-white/10 
          shadow-2xl shadow-indigo-500/10 dark:shadow-black/50
          rounded-3xl p-8 sm:p-12 lg:p-16
          transition-all duration-1000 ease-out
          flex flex-col items-center text-center
          ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}
        `}>
          
          {/* Futuristic Loading Visual (The "Core") */}
          <div className="relative mb-12 w-48 h-48 sm:w-64 sm:h-64">
             {/* Center Glow */}
             <div className="absolute inset-0 bg-indigo-500/30 dark:bg-indigo-400/20 blur-3xl rounded-full animate-pulse-slow" />
             
             <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                
                {/* Outer Rotating Ring */}
                <circle cx="100" cy="100" r="90" fill="none" stroke="url(#grad1)" strokeWidth="1" strokeDasharray="10 10" className="opacity-30 animate-spin-slow" />
                
                {/* Middle Rotating Ring (Reverse) */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="text-indigo-500 dark:text-indigo-400 opacity-50 animate-reverse-spin origin-center" />
                
                {/* Inner Pulsing Core */}
                <g className="animate-float">
                  <circle cx="100" cy="100" r="40" className="fill-white/10 dark:fill-white/5 stroke-indigo-500 dark:stroke-indigo-400" strokeWidth="2" />
                  <circle cx="100" cy="100" r="20" className="fill-indigo-600 dark:fill-indigo-400 animate-pulse" />
                </g>
                
                {/* Orbiting Satellite */}
                <g className="animate-spin-fast origin-center">
                   <circle cx="100" cy="20" r="4" className="fill-purple-500 shadow-glow" />
                </g>
             </svg>
          </div>

          {/* Typography */}
          <div className="space-y-4 mb-10 max-w-lg">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 animate-gradient-x">
                Welcome Back
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed">
              Initiating secure environment. <br className="hidden sm:block" />
              Please wait while we prepare your dashboard.
            </p>
          </div>

          {/* Precision Progress Bar */}
          <div className="w-full max-w-sm space-y-3">
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <span>System Check</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

        </div>

        {/* Footer / Copyright */}
        <div className="absolute bottom-6 text-xs text-gray-400 dark:text-gray-600 text-center w-full animate-fade-in-up">
          <p>© {new Date().getFullYear()} Enterprise Platform. Secure Connection.</p>
        </div>

      </div>

      {/* --- Global Custom CSS for Animations --- */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); transform-origin: 50% 50%; }
          to { transform: rotate(360deg); transform-origin: 50% 50%; }
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); transform-origin: 50% 50%; }
          to { transform: rotate(0deg); transform-origin: 50% 50%; }
        }
        @keyframes spin-fast {
          from { transform: rotate(0deg); transform-origin: 100px 100px; }
          to { transform: rotate(360deg); transform-origin: 100px 100px; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-reverse-spin {
          animation: reverse-spin 15s linear infinite;
        }
        .animate-spin-fast {
          animation: spin-fast 3s linear infinite;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
        .shadow-glow {
          filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.6));
        }
      `}</style>
    </main>
  );
}