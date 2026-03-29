"use client";

import React from "react";
import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { Activity } from "lucide-react";

type SubjectStats = {
  name: string;
  attended: number;
  total: number;
  percentage: number;
};

export default function SubjectPerformanceCard({ subjects }: { subjects: SubjectStats[] }) {
  
  const getStatusDefinition = (percentage: number) => {
    if (percentage >= 75) {
      return {
        color: "var(--color-attendmate-green)",
        gradient: "linear-gradient(90deg, #00C87A, #00F0A0)",
        glow: "rgba(0, 240, 160, 0.6)",
      };
    } else if (percentage >= 60) {
      return {
        color: "var(--color-attendmate-amber)",
        gradient: "linear-gradient(90deg, #FF8C00, #FFB520)",
        glow: "rgba(255, 181, 32, 0.6)",
      };
    } else {
      return {
        color: "var(--color-attendmate-red)",
        gradient: "linear-gradient(90deg, #FF2D55, #FF4D6D)",
        glow: "rgba(255, 77, 109, 0.6)",
      };
    }
  };

  return (
    <GlassCard className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-[Outfit]">Subject Performance</h2>
          <div className="px-2.5 py-0.5 rounded-full bg-[var(--color-attendmate-primary)]/20 border border-[var(--color-attendmate-primary)]/30 text-[var(--color-attendmate-primary)] text-xs font-semibold">
            {subjects.length} Subjects
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-[var(--color-attendmate-muted)]" />
            </div>
            <p className="text-white font-[Outfit] text-base mb-1">No subjects added yet</p>
            <p className="text-sm text-[var(--color-attendmate-muted)] mb-4">You have zero subjects tracking attendance.</p>
            <a href="/subjects" className="text-sm text-[var(--color-attendmate-primary)] hover:text-white transition-colors bg-[var(--color-attendmate-primary)]/10 px-4 py-2 rounded-lg font-semibold border border-[var(--color-attendmate-primary)]/30">
              Add Subjects →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((sub, i) => {
              const statusDef = getStatusDefinition(sub.percentage);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.3, duration: 0.4 }}
                  key={sub.name}
                  className="group relative p-3 -mx-3 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 overflow-hidden pr-4">
                      {/* Left tiny status dot */}
                      <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: statusDef.color, boxShadow: `0 0 6px ${statusDef.color}` }} />
                      <span className="text-sm font-semibold text-white group-hover:text-[var(--color-attendmate-primary)] transition-colors truncate font-[Outfit]">
                        {sub.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono" style={{ color: statusDef.color }}>
                      {sub.percentage}%
                    </span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="h-[6px] w-full bg-[rgba(255,255,255,0.06)] rounded-[3px] overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.percentage}%` }}
                      transition={{ duration: 1.0, delay: i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-[3px] relative z-10 transition-all group-hover:brightness-110 group-hover:shadow-lg"
                      style={{ 
                        background: statusDef.gradient,
                        boxShadow: `0 0 8px ${statusDef.glow}`
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
