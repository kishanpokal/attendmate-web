"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, MoreHorizontal } from "lucide-react";
import GlassCard from "./GlassCard";

export type TodayLecture = {
  subjectName: string;
  status: "PRESENT" | "ABSENT";
  startTime: string;
  endTime: string;
  note?: string;
};

export default function TodayLectureCard({
  lecture,
  index = 0,
}: {
  lecture: TodayLecture;
  index?: number;
}) {
  const isPresent = lecture.status === "PRESENT";
  const glowColor = isPresent ? "rgba(0,240,160,0.15)" : "rgba(255,77,109,0.15)";
  const borderColor = isPresent ? "rgba(0,240,160,0.2)" : "rgba(255,77,109,0.2)";
  const bgColor = isPresent ? "rgba(0,240,160,0.12)" : "rgba(255,77,109,0.12)";
  const textColor = isPresent ? "var(--color-attendmate-green)" : "var(--color-attendmate-red)";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 25 }}
    >
      <GlassCard hoverLift={true} glowColor={glowColor} className="w-full">
        {/* Accent Glow inside card */}
        <div 
          className="absolute top-0 left-0 w-32 h-32 blur-[50px] rounded-full pointer-events-none"
          style={{ background: isPresent ? "rgba(0,240,160,0.1)" : "rgba(255,77,109,0.1)" }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 relative z-10">
          
          {/* LEFT COLUMN: TIME */}
          <div className="w-[120px] flex-shrink-0">
            <span className="text-[13px] font-mono font-medium text-[var(--color-attendmate-muted)]">
              {lecture.startTime} – {lecture.endTime}
            </span>
          </div>

          {/* CENTER COLUMN: SUBJECT */}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-white font-[Outfit] truncate">
              {lecture.subjectName}
            </h4>
            {lecture.note && (
              <p className="text-[13px] text-[var(--color-attendmate-muted)] italic mt-1 flex items-start gap-1.5">
                <MoreHorizontal className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="truncate">{lecture.note}</span>
              </p>
            )}
          </div>

          {/* RIGHT COLUMN: STATUS PILL */}
          <div className="flex-shrink-0">
            <div 
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 border"
              style={{ background: bgColor, borderColor, color: textColor }}
            >
              <Clock className="w-3 h-3" />
              <span className="text-[11px] font-bold font-mono tracking-[1px] leading-none uppercase pt-0.5">
                {lecture.status}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}