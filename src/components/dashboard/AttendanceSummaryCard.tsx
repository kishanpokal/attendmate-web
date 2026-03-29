"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { PieChart, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";

type Props = {
  total: number;
  attended: number;
  loading: boolean;
};

// Hook copied so no dependency loop
function useCountUp(target: number, duration: number = 1200, trigger: boolean = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let startTime: number | null = null;
    let animationFrameId: number;
    const animate = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((target * eased).toFixed(1)));
      if (progress < 1) animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration, trigger]);
  return value;
}

export default function AttendanceSummaryCard({ total, attended, loading }: Props) {
  const percentageFloat = total === 0 ? 0 : (attended / total) * 100;
  const percentage = Number(percentageFloat.toFixed(2));
  
  // Custom exact animation logic kept per request: "Keep EXACT animatedPercent useEffect"
  // but wait in the prompt it says "useCountUp hook... animatedPercent (KEEP the existing implementation there — do not replace, just use this new hook in the other components)"
  // Okay, maintaining the state then:
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    if (loading) return;
    let start = 0;
    const end = percentage;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Number((start + (end - start) * progress).toFixed(2));
      setAnimatedPercent(value);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [percentage, loading]);

  const getStatusColor = () => {
    if (percentage >= 75.0) return "emerald";
    if (percentage >= 60.0) return "amber";
    return "rose";
  };

  const statusColor = getStatusColor();
  const actualColorHex = statusColor === "emerald" ? "#00F0A0" : statusColor === "amber" ? "#FFB520" : "#FF4D6D";

  if (loading) {
    return <SkeletonSummaryCard />;
  }

  const radius = 90; // 180px diameter -> 90 r
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div className="w-full">
      <GlassCard className="w-full p-6 text-center">
        {/* Top Section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-attendmate-primary)]/10 border border-[var(--color-attendmate-primary)]/30">
            <PieChart className="w-4 h-4 text-[var(--color-attendmate-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-attendmate-primary)]">Attendance Overview</span>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="relative w-[220px] h-[220px] mx-auto flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00C87A" />
                <stop offset="100%" stopColor="#00F0A0" />
              </linearGradient>
              <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#FFB520" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF2D55" />
                <stop offset="100%" stopColor="#FF4D6D" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Base Background Circle */}
            <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="transparent" />
            
            {/* Progress Circle */}
            <motion.circle
              cx="110"
              cy="110"
              r={radius}
              stroke={`url(#${statusColor}Gradient)`}
              strokeWidth="16"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              filter="url(#glow)"
            />
          </svg>

          {/* Outer Decorative Rings */}
          <div className="absolute inset-0 pointer-events-none text-center flex items-center justify-center">
            <svg className="w-[230px] h-[230px] animate-[spin_20s_linear_infinite]" viewBox="0 0 230 230">
              <circle cx="115" cy="115" r="105" stroke={actualColorHex} strokeOpacity="0.06" strokeWidth="1" fill="none" strokeDasharray="3 8" />
            </svg>
          </div>
          <div className="absolute inset-0 pointer-events-none text-center flex items-center justify-center">
             <svg className="w-[210px] h-[210px] animate-[spin_25s_linear_infinite_reverse]" viewBox="0 0 210 210">
              <circle cx="105" cy="105" r="95" stroke={actualColorHex} strokeOpacity="0.06" strokeWidth="1" fill="none" strokeDasharray="3 8" />
            </svg>
          </div>

          <div className="absolute flex flex-col items-center">
            <span className="text-[44px] font-bold font-mono" style={{ color: actualColorHex }}>
              {animatedPercent}%
            </span>
            <span className="text-[11px] font-[Outfit] text-[var(--color-attendmate-muted)]">
              overall
            </span>
          </div>

          {/* Floating Particles */}
          <motion.div animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-1 -right-1 w-[9px] h-[9px] rounded-full blur-[1px]" style={{ background: actualColorHex, boxShadow: `0 0 10px ${actualColorHex}` }} />
          <motion.div animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute -bottom-1 -left-1 w-[8px] h-[8px] rounded-full blur-[1px]" style={{ background: actualColorHex, boxShadow: `0 0 10px ${actualColorHex}` }} />
          <motion.div animate={{ x: [0, -6, 0], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute top-[30%] -left-3 w-[10px] h-[10px] rounded-full blur-[2px]" style={{ background: actualColorHex, boxShadow: `0 0 10px ${actualColorHex}` }} />
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border-l-[2px]" style={{ borderLeftColor: actualColorHex }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5">
                <CheckCircle2 className="w-5 h-5" style={{ color: actualColorHex }} />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-medium text-[var(--color-attendmate-muted)]">Attended</p>
                <p className="text-[28px] font-bold font-mono text-white leading-none mt-1">{attended}</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border-l-[2px]" style={{ borderLeftColor: actualColorHex }}>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5">
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-medium text-[var(--color-attendmate-muted)]">Total</p>
                <p className="text-[28px] font-bold font-mono text-white leading-none mt-1">{total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS MESSAGE */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="mt-5 w-full text-left flex items-center gap-3 px-5 py-3 rounded-xl border-l-[2px]"
           style={{ background: `${actualColorHex}14`, borderLeftColor: actualColorHex }} /* 14 is 8% hex opacity approx (.08 * 255 = 20 = 14) */
        >
          <span className="text-xl">
            {percentage >= 75.0 ? "🎉" : percentage >= 60.0 ? "⚠️" : "📉"}
          </span>
          <span className="text-sm font-semibold text-white font-[Outfit]">
            {percentage >= 75.0 ? "Excellent standing. Keep it up!" : percentage >= 60.0 ? "Room for improvement. Watch your classes." : "Critical standing. Attend more classes."}
          </span>
        </motion.div>
      </GlassCard>
    </div>
  );
}

function SkeletonSummaryCard() {
  return (
    <div className="w-full">
      <div className="rounded-[20px] p-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]">
        <div className="animate-[shimmer_1.5s_infinite_linear] bg-[length:800px_100%] bg-gradient-to-r from-[rgba(255,255,255,0.04)] via-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.04)] h-full w-full absolute inset-0 rounded-[20px]" />
        
        <div className="relative z-10">
          <div className="text-center mb-6">
            <div className="h-6 w-32 bg-[rgba(255,255,255,0.1)] rounded-full mx-auto mb-3" />
            <div className="h-7 w-40 bg-[rgba(255,255,255,0.1)] rounded-lg mx-auto" />
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-40 h-40 rounded-full bg-[rgba(255,255,255,0.1)]" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="h-[76px] bg-[rgba(255,255,255,0.1)] rounded-xl" />
            <div className="h-[76px] bg-[rgba(255,255,255,0.1)] rounded-xl" />
          </div>

          <div className="mt-5 h-[52px] w-full bg-[rgba(255,255,255,0.1)] rounded-xl" />
        </div>
      </div>
    </div>
  );
}