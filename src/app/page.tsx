'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Lenis from 'lenis';

// Components
import SmoothNav from '@/components/landing/SmoothNav';
import FloatingDashboard from '@/components/landing/FloatingDashboard';
import StatsBar from '@/components/landing/StatsBar';
import FeatureCards from '@/components/landing/FeatureCards';
import HowItWorks from '@/components/landing/HowItWorks';
import TechStack from '@/components/landing/TechStack';
import FinalCTA from '@/components/landing/FinalCTA';
import { useMouseParallax } from '@/hooks/useScrollAnimation';

// Dynamic Import for Three.js (no SSR to prevent hydration mismatch/errors)
const HeroScene = dynamic(() => import('@/components/landing/HeroScene'), { ssr: false });

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const { x, y } = useMouseParallax(6);
  
  // Smooth scroll progress bar for top of screen
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Init Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });
    
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    requestAnimationFrame(raf);
    
    return () => {
      lenis.destroy();
    };
  }, []);

  const headlineWords1 = "Attendance,".split(" ");
  const headlineWords2 = "finally".split(" ");
  const headlineWords3 = "smart.".split(" ");

  return (
    <div className="relative min-h-screen bg-[var(--bg-deep)] text-[var(--text)] font-body overflow-x-hidden selection:bg-[var(--primary-glow)] selection:text-white">
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] z-[200] origin-left bg-gradient-to-r from-[var(--primary)] via-[var(--cyan)] to-[var(--green)]" 
        style={{ scaleX }} 
      />

      <SmoothNav />

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex flex-col pt-32 lg:pt-40">
        
        {/* Background 3D Scene */}
        <HeroScene />

        {/* Foreground Hero Content */}
        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 flex flex-col items-center text-center">
          
          {/* Badge */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
            className="mb-8"
          >
            <div className="relative inline-flex overflow-hidden rounded-full p-[1px]">
              <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,var(--primary)_50%,transparent_100%)]" />
              <div className="inline-flex h-full w-full items-center justify-center rounded-full bg-[rgba(91,95,238,0.08)] px-5 py-2 text-[13px] sm:text-sm font-medium text-[rgba(236,240,255,0.8)] backdrop-blur-sm border border-[rgba(91,95,238,0.2)]">
                🎓 Built for CSE students · AI-powered · Free
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <h1 className="font-heading font-extrabold text-[clamp(52px,9vw,96px)] leading-[1.05] tracking-tight flex flex-wrap justify-center gap-x-[16px] xl:gap-x-[24px]">
            {/* Row 1 */}
            <div className="flex gap-[16px] xl:gap-[24px]">
              {headlineWords1.map((w, i) => (
                <motion.span key={i} initial={{ y: 40, opacity: 0, rotateX: 20 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ delay: 0.2 + (i * 0.08), duration: 0.6, type: "spring", stiffness: 100 }}>
                  {w}
                </motion.span>
              ))}
              {headlineWords2.map((w, i) => (
                <motion.span key={`hw2-${i}`} initial={{ y: 40, opacity: 0, rotateX: 20 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ delay: 0.28 + (i * 0.08), duration: 0.6, type: "spring", stiffness: 100 }}>
                  {w}
                </motion.span>
              ))}
            </div>
            {/* Row 2 (Gradient) */}
            <div className="flex gap-[16px] xl:gap-[24px] mt-1 sm:mt-0">
              {headlineWords3.map((w, i) => (
                <motion.span 
                  key={`hw3-${i}`} 
                  initial={{ y: 40, opacity: 0, rotateX: 20 }} 
                  animate={{ y: 0, opacity: 1, rotateX: 0 }} 
                  transition={{ delay: 0.36 + (i * 0.08), duration: 0.6, type: "spring", stiffness: 100 }}
                  className="text-transparent bg-clip-text bg-[length:200%_200%] animate-[shimmer_4s_linear_infinite]"
                  style={{ backgroundImage: 'linear-gradient(135deg, #5B5FEE 0%, #00D4FF 50%, #00F0A0 100%)' }}
                >
                  {w}
                </motion.span>
              ))}
            </div>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 text-[17px] sm:text-[19px] leading-relaxed text-[var(--muted)] max-w-[600px] font-light"
          >
            AttendMate replaces guesswork with a real-time, AI-powered system. Know your exact attendance percentage, predict how many classes you can safely skip, and track friends.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto"
          >
            {/* Primary Button */}
            <motion.a
              href="/login"
              style={{ x, y }}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--cyan)] text-white font-bold text-[16px] shadow-[0_0_0px_rgba(91,95,238,0)] hover:shadow-[0_0_40px_rgba(91,95,238,0.6)] transition-shadow duration-300"
            >
              Get Started Free →
            </motion.a>

            {/* Secondary Button */}
            <motion.a
              href="/register"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white font-medium text-[16px] transition-colors duration-300"
            >
              Create Account ↗
            </motion.a>
          </motion.div>

          {/* Trust Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-12 flex flex-wrap justify-center gap-4"
          >
            {['100% Free Forever', 'No Credit Card', 'Takes 10 Seconds'].map((chip) => (
              <div key={chip} className="flex items-center gap-2 text-[13px] text-[rgba(236,240,255,0.5)] font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--green)]"></span>
                </span>
                {chip}
              </div>
            ))}
          </motion.div>

          <FloatingDashboard />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <StatsBar />

      {/* ── FEATURES ── */}
      <FeatureCards />

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── TECH STACK ── */}
      <TechStack />

      {/* ── FINAL CTA ── */}
      <FinalCTA />

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.06)] bg-[var(--bg-deep)] py-8 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[13px] text-[rgba(236,240,255,0.35)]">
          <span>© 2026 AttendMate · Built by Kishan Pokal</span>
          <div className="flex gap-6">
            <a href="/login" className="hover:text-[rgba(236,240,255,0.8)] transition-colors">Sign In</a>
            <a href="/register" className="hover:text-[rgba(236,240,255,0.8)] transition-colors">Register</a>
            <a href="https://github.com/attendmate" target="_blank" rel="noreferrer" className="hover:text-[rgba(236,240,255,0.8)] transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}