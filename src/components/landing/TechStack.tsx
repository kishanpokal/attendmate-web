'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TECHNOLOGIES = [
  "Next.js",
  "React",
  "TypeScript",
  "Firebase",
  "Gemini AI",
  "Tailwind CSS",
  "MUI",
  "Framer Motion",
  "Vercel",
  "Three.js",
  "GSAP"
];

function Pill({ t, index, total }: { t: string; index: number; total: number }) {
  // Generate deterministic duration and delay based on index to avoid SSR Hydration errors
  const duration = 3 + (index % 3) * 0.8;
  const delay = (index % 4) * 0.4;
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Arch calculation for desktop layout
  const midPoint = (total - 1) / 2;
  const distanceFromCenter = Math.abs(index - midPoint);
  // translateY creates an inverted arc shape
  const yOffset = Math.pow(distanceFromCenter, 2) * 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ scale: 1.08 }}
      className="relative cursor-default"
      style={{
        // Desktop uses the arc translation (via custom tailwind or inline style wrapper)
        // Note: Tailwind handles mobile override natively
      }}
    >
      <div 
        className="px-6 py-2.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] hover:border-[var(--primary)] hover:bg-[rgba(91,95,238,0.15)] hover:shadow-[0_0_15px_rgba(91,95,238,0.4)] transition-all duration-300 backdrop-blur-md shadow-lg font-mono text-[13px] md:text-sm text-[rgba(232,237,245,0.7)] hover:text-white"
        style={{
          animation: `float-pill ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
          transform: `translateY(${!isMobile ? yOffset : 0}px)`,
        }}
      >
        {t}
      </div>
    </motion.div>
  );
}

export default function TechStack() {
  return (
    <section className="relative z-10 max-w-[1100px] mx-auto px-6 py-32 text-center">
      <p className="text-[11px] font-semibold tracking-widest text-[var(--text)] opacity-40 mb-12 uppercase font-mono">
        Built With Modern Architecture
      </p>

      {/* Floating Pill Cloud */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5 max-w-[800px] mx-auto">
        {TECHNOLOGIES.map((t, index) => (
          <Pill key={t} t={t} index={index} total={TECHNOLOGIES.length} />
        ))}
      </div>

      <style>{`
        @keyframes float-pill {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}
