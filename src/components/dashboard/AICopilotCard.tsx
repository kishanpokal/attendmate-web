"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, MessageSquare, BookOpen, AlertCircle, ArrowUpRight } from "lucide-react";
import GlassCard from "./GlassCard";

type Insight = {
  type: "positive" | "warning" | "neutral" | "suggestion";
  text: string;
};

export default function AICopilotCard({ percentage, present, absent }: any) {
  const [isOpen, setIsOpen] = useState(false);

  // Simple static insights based on rules
  const insights: Insight[] = [];
  
  if (percentage >= 75) {
    insights.push({ type: "positive", text: "You're doing great! Keep attending your core subjects to maintain this buffer." });
    insights.push({ type: "suggestion", text: "Consider reviewing notes for upcoming practicals to stay ahead." });
  } else if (percentage >= 60) {
    insights.push({ type: "warning", text: `You are in the danger zone. Missing ${Math.max(1, Math.floor(present * 0.1))} more classes could put you below 60%.` });
    insights.push({ type: "suggestion", text: "Prioritize subjects where you have the lowest attendance." });
  } else {
    insights.push({ type: "warning", text: "Critical attendance deficit. You must attend all classes this week." });
    insights.push({ type: "suggestion", text: "Talk to your professors about makeup assignments or extra credit." });
  }

  return (
    <GlassCard className="w-full relative overflow-hidden group">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-attendmate-primary)]/10 via-transparent to-[var(--color-attendmate-cyan)]/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Moving glow blob */}
      <div className="absolute -inset-x-[100%] top-0 h-full w-[300%] animate-[slide_10s_linear_infinite] opacity-30 pointer-events-none">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[var(--color-attendmate-primary)]/20 to-transparent blur-xl" />
      </div>

      <div className="relative z-10 p-6 flex flex-col md:flex-row items-center md:items-start gap-5">
        
        {/* Left Icon Area */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--color-attendmate-primary)] to-[var(--color-attendmate-cyan)] flex items-center justify-center shadow-[0_0_20px_rgba(91,95,238,0.4)] flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {/* Text Details Area */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-white font-[Outfit] mb-1 flex items-center justify-center md:justify-start gap-2">
            AttendMate AI <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-[var(--color-attendmate-cyan)] font-mono border border-white/5">BETA</span>
          </h3>
          <p className="text-sm text-[var(--color-attendmate-muted)] max-w-lg mb-4">
            Based on your patterns, you have {percentage >= 75 ? "a comfortable buffer" : "a deficit"}. Here is what you should focus on next.
          </p>

          <AnimatePresence>
            {!isOpen ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(true)}
                className="text-sm text-[var(--color-attendmate-primary)] hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1 mx-auto md:mx-0 font-semibold"
              >
                Reveal Insights <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                {insights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      insight.type === "positive" 
                        ? "bg-[rgba(0,240,160,0.05)] border-[rgba(0,240,160,0.2)]" 
                        : insight.type === "warning"
                        ? "bg-[rgba(255,77,109,0.05)] border-[rgba(255,77,109,0.2)]"
                        : "bg-[rgba(91,95,238,0.05)] border-[rgba(91,95,238,0.2)]"
                    }`}
                  >
                    {insight.type === "positive" ? (
                      <ArrowUpRight className="w-4 h-4 text-[var(--color-attendmate-green)] mt-0.5 flex-shrink-0" />
                    ) : insight.type === "warning" ? (
                      <AlertCircle className="w-4 h-4 text-[var(--color-attendmate-red)] mt-0.5 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-[var(--color-attendmate-primary)] mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-[13px] text-gray-300 leading-snug">{insight.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
