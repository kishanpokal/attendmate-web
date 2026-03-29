"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertCircle } from "lucide-react";
import GlassCard from "./GlassCard";
import { useCountUp } from "@/hooks/useCountUp";

// Copied exactly as requested
function getAttendanceDeficit(present: number, total: number) {
  if (total === 0) return 0;
  const currentPercent = (present / total) * 100;
  if (currentPercent >= 75) return 0;

  let tempAttended = present;
  let tempTotal = total;
  let needed = 0;

  while (((tempAttended / tempTotal) * 100) < 75 && needed < 200) {
      tempAttended++;
      tempTotal++;
      needed++;
  }

  return needed;
}

// Copied exactly as requested
function maxBunkableLectures(present: number, total: number) {
  if (total === 0) return 0;
  const currentPercent = (present / total) * 100;
  if (currentPercent < 75) return 0;

  let tempAttended = present;
  let tempTotal = total;
  let canSkip = 0;

  while (((tempAttended / (tempTotal + 1)) * 100) >= 75 && canSkip < 200) {
      tempTotal++;
      canSkip++;
  }

  return canSkip;
}

export default function AttendanceOverviewCard({ total, attended, percentage }: any) {
  const absent = total - attended;
  const deficit = getAttendanceDeficit(attended, total);
  const bunkable = maxBunkableLectures(attended, total);

  const animatedPercentage = useCountUp(percentage, 1500);
  const animatedAttended = useCountUp(attended, 1200);
  const animatedAbsent = useCountUp(absent, 1200);
  const animatedTotal = useCountUp(total, 1200);

  const statusDef =
    percentage >= 75
      ? { color: "var(--color-attendmate-green)", text: "Excellent Standing", icon: TrendingUp, glow: "rgba(0,240,160,0.15)" }
      : percentage >= 60
      ? { color: "var(--color-attendmate-amber)", text: "Warning Level", icon: AlertCircle, glow: "rgba(255,181,32,0.15)" }
      : { color: "var(--color-attendmate-red)", text: "Needs Attention", icon: AlertCircle, glow: "rgba(255,77,109,0.15)" };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
      <GlassCard className="w-full flex flex-col md:flex-row p-6 md:p-8 gap-8 items-center md:items-start" hoverLift={false}>
        
        {/* LEFT SECTION — 3D Circular Progress */}
        <div className="relative w-[180px] h-[180px] flex-shrink-0 flex items-center justify-center">
          {/* Outer Decorative Ring */}
          <div className="absolute inset-[-10px] rounded-full border border-white/5 border-dashed animate-[spin_20s_linear_infinite]" />
          
          {/* Glow Effect */}
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full blur-[40px]"
            style={{ backgroundColor: statusDef.color }}
          />

          <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="90"
              cy="90"
              r={radius}
              stroke={statusDef.color}
              strokeWidth="12"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              style={{ filter: `drop-shadow(0 0 8px ${statusDef.color})` }}
            />
          </svg>
          <div className="absolute flex flex-col items-center z-20">
            <span className="text-[40px] font-bold font-mono leading-none" style={{ color: statusDef.color }}>
              {animatedPercentage}%
            </span>
            <span className="text-[11px] font-semibold text-[var(--color-attendmate-muted)] uppercase tracking-wider mt-1">
              Overall
            </span>
          </div>
        </div>

        {/* RIGHT SECTION — Stats and Insight */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-bold text-white font-[Outfit]">Performance Analytics</h2>
            </div>
            
            {/* Status Badge */}
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                 style={{ backgroundColor: statusDef.glow, color: statusDef.color, boxShadow: `0 0 10px ${statusDef.glow}` }}>
              <statusDef.icon className="w-3.5 h-3.5" />
              {statusDef.text}
            </div>
          </div>

          {/* Insight Text Highlight Box */}
          <div className="relative p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-white/5 overflow-hidden"
               style={{ borderLeftColor: percentage >= 75 ? "var(--color-attendmate-green)" : "var(--color-attendmate-red)", borderLeftWidth: "3px" }}>
            <p className="text-sm text-gray-300">
              {percentage >= 75 
                ? <>You can safely skip <span className="font-mono text-[var(--color-attendmate-green)] font-bold text-base bg-[rgba(0,240,160,0.1)] px-1.5 py-0.5 rounded">{bunkable}</span> class{bunkable !== 1 ? 'es' : ''}.</>
                : <>You have a deficit of <span className="font-mono text-[var(--color-attendmate-red)] font-bold text-base bg-[rgba(255,77,109,0.1)] px-1.5 py-0.5 rounded">{deficit}</span> class{deficit !== 1 ? 'es' : ''}.</>}
            </p>
          </div>

          {/* 3-COLUMN MINI STATS */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[var(--color-attendmate-muted)] mb-1 uppercase tracking-wider">Attended</span>
              <span className="text-2xl font-bold font-mono text-[var(--color-attendmate-green)]">{animatedAttended}</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-4">
              <span className="text-xs font-medium text-[var(--color-attendmate-muted)] mb-1 uppercase tracking-wider">Absent</span>
              <span className="text-2xl font-bold font-mono text-[var(--color-attendmate-red)]">{animatedAbsent}</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-4">
              <span className="text-xs font-medium text-[var(--color-attendmate-muted)] mb-1 uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold font-mono text-[var(--color-attendmate-primary)]">{animatedTotal}</span>
            </div>
          </div>
        </div>
        
      </GlassCard>
    </motion.div>
  );
}
