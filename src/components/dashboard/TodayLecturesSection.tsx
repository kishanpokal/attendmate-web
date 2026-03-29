"use client";

import React from "react";
import TodayLectureCard, { TodayLecture } from "./TodayLectureCard";
import GlassCard from "./GlassCard";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TodayLecturesSection({ lectures }: { lectures: TodayLecture[] }) {
  if (lectures.length === 0) {
    return (
      <GlassCard className="w-full flex-col items-center justify-center p-12 text-center" hoverLift={false}>
        <div className="text-[48px] mb-4">📅</div>
        <h3 className="text-xl font-bold text-white mb-2 font-[Outfit]">No classes scheduled today</h3>
        <p className="text-[var(--color-attendmate-muted)] text-sm mb-6 max-w-[280px] mx-auto">
          Your day is free — or you haven't set up your timetable yet.
        </p>
        <Link href="/timetable" className="inline-flex items-center justify-center bg-[var(--color-attendmate-primary)] text-white hover:brightness-110 transition-all font-semibold px-6 py-2.5 rounded-xl font-[Outfit] text-sm shadow-[0_4px_14px_rgba(91,95,238,0.4)]">
          Set up Timetable →
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="relative pl-[14px] md:pl-0 w-full mb-8">
      {/* Desktop Line matches mobile line visually but relies on padding difference */}
      <div className="absolute top-4 bottom-4 left-[13px] md:left-[23px] w-[2px] rounded-full bg-gradient-to-b from-[var(--color-attendmate-primary)] via-[var(--color-attendmate-cyan)] to-[var(--color-attendmate-green)] hidden md:block" />
      <div className="absolute top-4 bottom-4 left-0 w-[1px] md:hidden rounded-full bg-gradient-to-b from-[var(--color-attendmate-primary)] via-[var(--color-attendmate-cyan)] to-[var(--color-attendmate-green)] opacity-70" />

      <div className="space-y-4 md:space-y-6 flex flex-col items-stretch">
        {lectures.map((lec, i) => {
          const isPresent = lec.status === "PRESENT";
          const dotColor = isPresent ? "var(--color-attendmate-green)" : "var(--color-attendmate-red)";
          const glowShadow = isPresent ? "0 0 10px #00F0A0" : "0 0 10px #FF4D6D";

          return (
            <div key={i} className="relative flex items-center md:items-stretch w-full">
              {/* TIMELINE NODE */}
              <div className="absolute left-[-14px] md:left-[17px] top-1/2 -translate-y-1/2 flex items-center group-hover:scale-125 transition-transform z-10 w-4 h-4 md:w-auto md:h-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.3 }}
                  transition={{ type: "spring", delay: i * 0.08 + 0.2 }}
                  className="w-3 h-3 md:w-[14px] md:h-[14px] rounded-full border-2 border-[#080C1A]"
                  style={{ backgroundColor: dotColor, boxShadow: glowShadow }}
                />
              </div>

              {/* Connecting Dashed Line (Desktop Only) */}
              <div
                className="hidden md:block absolute left-[31px] top-1/2 -translate-y-1/2 h-[1px] w-[24px] z-0 opacity-40 border-t border-dashed"
                style={{ borderColor: dotColor }}
              />

              {/* CARD */}
              <div className="w-full md:pl-[64px] pl-3">
                <TodayLectureCard lecture={lec} index={i} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
