'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const FEATURES = [
  {
    icon: "✓",
    title: "One-Click Attendance",
    desc: "Mark your attendance in under 10 seconds. Track present, absent, and everything in between.",
    color: "#00F0A0",
  },
  {
    icon: "📊",
    title: "Live Analytics",
    desc: "Real-time charts showing attendance trends, subject-wise breakdowns, and performance tracking.",
    color: "#00D4FF",
  },
  {
    icon: "🤖",
    title: "AI Copilot",
    desc: "Ask the AI how many classes you can safely skip, or let it mark your attendance by voice command.",
    color: "#5B5FEE",
  },
  {
    icon: "👥",
    title: "Friends Tracking",
    desc: "Add friends and see their attendance status in real-time. Know who made it to the 8 AM lecture.",
    color: "#FFB520",
  },
  {
    icon: "🔐",
    title: "Cloud Sync",
    desc: "Your data is securely saved to Firebase and synced instantly across all your devices.",
    color: "#00F0A0",
  },
  {
    icon: "📅",
    title: "Smart Timetable",
    desc: "Set up your weekly schedule once. Auto-detect active lectures and get prompted to mark attendance.",
    color: "#FF4D6D",
  },
];

function Card({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ y: 60, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      className="group relative cursor-default h-full"
    >
      {/* 
        LAYER 1: The Glass Base 
        LAYER 3: Border wrapper 
      */}
      <div 
        className="relative h-full rounded-2xl overflow-hidden bg-[rgba(255,255,255,0.03)] border transition-all duration-300"
        style={{
          borderColor: isHovered ? 'rgba(91,95,238,0.4)' : 'rgba(255,255,255,0.07)',
          boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(91,95,238,0.1)' : '0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        
        {/* Animated Top Line Indicator */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-20"
          style={{ backgroundColor: feature.color }}
        />

        {/* LAYER 2: Hover Glow (Spotlight Effect) */}
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0 hidden md:block"
            style={{
              background: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, rgba(91,95,238,0.15), transparent 60%)`,
            }}
          />
        )}
        
        <div className="relative p-7 z-10 flex flex-col items-start h-full">
          {/* ICON TREATMENT */}
          <motion.div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 shadow-inner"
            style={{ 
              background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}05)`,
              border: `1px solid ${feature.color}30`,
              color: feature.color
            }}
            animate={isHovered ? { y: -4 } : { y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 rounded-xl opacity-50 mix-blend-overlay" style={{ boxShadow: `inset 0 2px 4px ${feature.color}` }} />
            <span className="relative z-10">{feature.icon}</span>
          </motion.div>

          {/* TEXT CONTENT */}
          <h3 className="font-heading font-bold text-xl text-white mb-2 tracking-tight group-hover:text-white transition-colors">
            {feature.title}
          </h3>
          <p className="text-[14px] leading-[1.7] text-[rgba(236,240,255,0.55)] font-light">
            {feature.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeatureCards() {
  return (
    <section id="features" className="relative z-10 max-w-[1100px] mx-auto px-6 py-28">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="mb-14"
      >
        <p className="text-[11px] font-semibold tracking-widest text-[var(--cyan)] mb-3 uppercase font-mono">
          Features
        </p>
        <h2 className="font-heading font-extrabold text-[clamp(32px,5vw,56px)] leading-[1.15] tracking-tight text-white max-w-[600px]">
          Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--cyan)] to-[var(--green)]">stay above 75%.</span>
        </h2>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, idx) => (
          <Card key={feature.title} feature={feature} index={idx} />
        ))}
      </div>
    </section>
  );
}
