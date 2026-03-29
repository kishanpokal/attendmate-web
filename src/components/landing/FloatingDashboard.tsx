'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

const MOCK_DATA = [
  { name: 'Mathematics', pct: '82%', safe: true },
  { name: 'Data Structures', pct: '76%', safe: true },
  { name: 'Operating Systems', pct: '68%', safe: false },
  { name: 'Computer Networks', pct: '91%', safe: true },
  { name: 'Database Systems', pct: '73%', safe: false },
];

export default function FloatingDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  const rawRotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const rawRotateY = useTransform(scrollYProgress, [0, 1], [-8, 0]);
  const rawScale = useTransform(scrollYProgress, [0, 1], [0.92, 1.0]);
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const y = useSpring(rawY, springConfig);

  const [mouseRotateX, setMouseRotateX] = useState(0);
  const [mouseRotateY, setMouseRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const yDiff = e.clientY - rect.top - rect.height / 2;

    setMouseRotateX((-yDiff / rect.height) * 16 - 5);
    setMouseRotateY((x / rect.width) * 16);
  };

  const handleMouseLeave = () => {
    setMouseRotateX(0);
    setMouseRotateY(0);
  };

  const inViewRef = useRef(null);
  const isInView = useInView(inViewRef, { once: true, amount: 0.3 });

  return (
    <div
      ref={containerRef}
      style={{
        perspective: '1200px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
        marginTop: '2rem'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={inViewRef}
        style={{
          rotateX: mouseRotateX ? mouseRotateX : rotateX,
          rotateY: mouseRotateY ? mouseRotateY : rotateY,
          scale,
          y,
          transformStyle: 'preserve-3d',
        }}
        className="w-full max-w-[560px]"
      >
        {/* The Card */}
        <div
          className="relative rounded-[20px] overflow-hidden border border-[rgba(255,255,255,0.10)] bg-[rgba(8,12,26,0.95)]"
          style={{
            boxShadow:
              '0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px rgba(91,95,238,0.2)',
          }}
        >
          {/* Animated Gradient Border Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none before:absolute before:inset-[-2px] before:rounded-[22px] before:bg-[conic-gradient(from_0deg,transparent_0_340deg,var(--primary)_360deg)] before:animate-[spin_4s_linear_infinite] opacity-50 overflow-hidden" style={{ clipPath: 'inset(1px round 20px)' }} />

          {/* Inner Content */}
          <div className="relative z-10 flex flex-col h-full bg-[rgba(8,12,26,0.95)]">
            {/* Top Bar */}
            <div className="flex items-center gap-2 px-5 py-[14px] border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C840]" />
              <span className="ml-2 text-xs font-mono text-[var(--muted)]">Dashboard — AttendMate</span>
            </div>

            {/* Subject Rows */}
            <div className="py-2">
              {MOCK_DATA.map((sub, i) => (
                <motion.div
                  key={sub.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={isInView ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                  transition={{ delay: i * 0.08 + 0.3, duration: 0.4 }}
                  className="flex items-center gap-3 px-5 py-2.5 border-b border-[rgba(255,255,255,0.04)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[11px] font-semibold text-[rgba(232,237,245,0.6)] shrink-0 font-body">
                    {sub.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="flex-1 text-sm text-[rgba(232,237,245,0.85)] font-body">
                    {sub.name}
                  </span>
                  
                  {/* Progress Ring */}
                  <div className="relative w-9 h-9 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2"
                        fill="none"
                      />
                      <motion.circle
                        cx="18"
                        cy="18"
                        r="16"
                        stroke={sub.safe ? 'var(--green)' : 'var(--danger)'}
                        strokeWidth="2"
                        fill="none"
                        initial={{ strokeDasharray: 100, strokeDashoffset: 100 }}
                        animate={isInView ? { strokeDashoffset: 100 - parseInt(sub.pct) } : { strokeDashoffset: 100 }}
                        transition={{ delay: i * 0.08 + 0.6, duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono text-[var(--text)]">
                      {sub.pct.replace('%', '')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap gap-5 px-5 py-3 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.04)]">
              <span className="text-xs text-[var(--muted)] font-medium">78% Overall</span>
              <span className="text-xs text-[var(--muted)] font-medium">3 classes today</span>
              <span className="text-xs text-[#A78BFA] font-medium flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A78BFA] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A78BFA]"></span>
                </span>
                🤖 AI: can skip 2 classes
              </span>
            </div>
          </div>
        </div>

        {/* Glowing Reflection */}
        <div
          className="absolute -bottom-10 left-[10%] right-[10%] h-10 blur-[20px] opacity-40"
          style={{ background: 'linear-gradient(90deg, var(--primary), var(--cyan))' }}
        />
      </motion.div>
    </div>
  );
}
