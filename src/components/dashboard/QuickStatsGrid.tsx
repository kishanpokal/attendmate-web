"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import GlassCard from "./GlassCard";
import { useCountUp } from "@/hooks/useCountUp";

interface QuickStatsGridProps {
  total: number;
  attended: number;
  percentage: number;
  todayCount: number;
}

export default function QuickStatsGrid({ total, attended, percentage, todayCount }: QuickStatsGridProps) {
  const absent = total - attended;

  // Animated Numbers
  const animatedPercentage = useCountUp(percentage);
  const animatedAttended = useCountUp(attended);
  const animatedAbsent = useCountUp(absent);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 — Attendance Rate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}>
        <GlassCard hoverLift glowColor="rgba(91,95,238,0.3)">
          <div className="p-5 flex flex-col h-full bg-gradient-to-br from-transparent to-[var(--color-attendmate-primary)]/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-attendmate-primary)]/10 text-[var(--color-attendmate-primary)] border border-[var(--color-attendmate-primary)]/20 shadow-[0_0_15px_rgba(91,95,238,0.2)]">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[48px] font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-attendmate-primary)] to-[var(--color-attendmate-cyan)] leading-none mb-1">
                {animatedPercentage}%
              </p>
              <p className="text-sm font-medium text-[var(--color-attendmate-muted)]">Attendance Rate</p>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-attendmate-primary)] origin-left"
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Card 2 — Classes Attended */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
        <GlassCard hoverLift glowColor="rgba(0,240,160,0.3)">
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-attendmate-green)]/10 text-[var(--color-attendmate-green)] border border-[var(--color-attendmate-green)]/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex gap-1 items-end h-4 opacity-50">
                <div className="w-1.5 h-full bg-[var(--color-attendmate-green)] rounded-t-sm" />
                <div className="w-1.5 h-3/4 bg-[var(--color-attendmate-green)] rounded-t-sm" />
                <div className="w-1.5 h-1/2 bg-[var(--color-attendmate-green)] rounded-t-sm" />
              </div>
            </div>
            <p className="text-[48px] font-bold font-mono text-[var(--color-attendmate-green)] leading-none mb-1 drop-shadow-[0_0_8px_rgba(0,240,160,0.4)]">
              {animatedAttended}
            </p>
            <p className="text-sm font-medium text-[var(--color-attendmate-muted)]">Classes Attended</p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.37, duration: 0.8 }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-attendmate-green)] origin-left"
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Card 3 — Classes Missed */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <GlassCard hoverLift glowColor="rgba(255,77,109,0.3)">
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-attendmate-red)]/10 text-[var(--color-attendmate-red)] border border-[var(--color-attendmate-red)]/20">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            {absent === 0 ? (
              <p className="text-[36px] mt-3 font-bold font-mono text-[var(--color-attendmate-primary)] leading-none mb-1">
                Perfect!
              </p>
            ) : (
              <p className="text-[48px] font-bold font-mono text-[var(--color-attendmate-red)] leading-none mb-1">
                {animatedAbsent}
              </p>
            )}
            <p className="text-sm font-medium text-[var(--color-attendmate-muted)]">Classes Missed</p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.44, duration: 0.8 }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-attendmate-red)] origin-left"
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Card 4 — Classes Today */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
        <GlassCard hoverLift glowColor="rgba(255,181,32,0.3)">
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-attendmate-amber)]/10 text-[var(--color-attendmate-amber)] border border-[var(--color-attendmate-amber)]/20">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            {todayCount === 0 ? (
              <p className="text-[32px] mt-4 font-bold font-mono text-[var(--color-attendmate-amber)] leading-none mb-1">
                Free Day 🎉
              </p>
            ) : (
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
                className="text-[48px] font-bold font-mono text-[var(--color-attendmate-amber)] leading-none mb-1"
              >
                {todayCount}
              </motion.p>
            )}
            <p className="text-sm font-medium text-[var(--color-attendmate-muted)]">Classes Today</p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.51, duration: 0.8 }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-attendmate-amber)] origin-left"
            />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
