'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const STEPS = [
  {
    n: "01",
    title: "Sign In",
    desc: "Login with your Google account or email. Set up your subjects and timetable in minutes.",
  },
  {
    n: "02",
    title: "Mark Attendance",
    desc: "When a class starts, you get prompted automatically. Tap Present or Absent — it's that simple.",
  },
  {
    n: "03",
    title: "Get AI Insights",
    desc: "View real-time analytics, ask the AI copilot how many classes you can skip, and track friends.",
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <section id="how" className="relative z-10 py-32 border-y border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-6">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 flex flex-col items-center"
        >
          <p className="text-[11px] font-semibold tracking-widest text-[var(--primary)] mb-3 uppercase font-mono">
            How It Works
          </p>
          <h2 className="font-heading font-extrabold text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-tight text-white max-w-[600px]">
            Up and running in 3 steps.
          </h2>
        </motion.div>

        {/* Timeline Container */}
        <div ref={containerRef} className="relative w-full flex flex-col md:flex-row gap-12 md:gap-8 lg:gap-12 mt-12">
          
          {/* Animated SVG Line Base */}
          <div className="absolute top-8 md:top-10 left-8 md:left-[10%] bottom-8 md:bottom-auto md:right-[10%] w-[2px] md:w-[80%] md:h-[2px] bg-[rgba(255,255,255,0.07)] z-0 rounded-full" />
          
          {/* Animated SVG Line Progress */}
          <motion.div 
            initial={{ scaleY: 0, scaleX: 0 }}
            animate={isInView ? { scaleY: 1, scaleX: 1 } : { scaleY: 0, scaleX: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-8 md:top-10 left-8 md:left-[10%] bottom-8 md:bottom-auto md:right-[10%] w-[2px] md:w-[80%] md:h-[2px] bg-gradient-to-b md:bg-gradient-to-r from-[var(--primary)] via-[var(--cyan)] to-[var(--green)] z-0 rounded-full"
            style={{ 
              transformOrigin: "top left", 
              // Custom CSS to handle horizontal vs vertical scaling based on media query via Tailwind is tricky purely with style,
              // so we use CSS classes for transform-origin instead
            }}
          />

          {STEPS.map((step, index) => (
            <motion.div
              key={step.n}
              initial={{ y: 40, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
              transition={{ delay: 0.2 + (index * 0.4), duration: 0.6 }}
              className="relative z-10 flex-1 flex flex-row md:flex-col items-start md:items-center gap-6 md:gap-8 group pl-16 md:pl-0"
            >
              {/* Step Node */}
              <div className="absolute left-3 md:relative md:left-0 flex items-center justify-center shrink-0">
                {/* Glow Ring Pulse */}
                <motion.div 
                  initial={{ scale: 1, opacity: 0 }}
                  animate={isInView ? { scale: [1, 1.6, 1], opacity: [0, 0.4, 0] } : {}}
                  transition={{ delay: 0.6 + (index * 0.4), duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--cyan)]"
                />
                
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[rgba(10,14,30,0.95)] border border-[rgba(255,255,255,0.15)] flex items-center justify-center text-[var(--text)] font-heading font-black text-xl md:text-2xl z-10 shadow-[0_0_20px_rgba(91,95,238,0.2)] group-hover:scale-110 transition-transform duration-300">
                  {step.n.replace('0', '')}
                </div>
              </div>

              {/* Step Card */}
              <div className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-6 hover:border-[rgba(91,95,238,0.3)] hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300 shadow-xl group-hover:shadow-[0_10px_30px_rgba(91,95,238,0.1)] hover:-translate-y-1 ease-out text-left mt-2 md:mt-0">
                <span className="font-mono text-[var(--cyan)] font-bold text-[48px] leading-none opacity-20 block mb-2 absolute top-4 right-4 pointer-events-none">
                  {step.n}
                </span>
                <h3 className="font-heading font-bold text-xl text-white mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-[rgba(236,240,255,0.6)] font-light">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
