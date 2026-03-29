"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Database } from "lucide-react";
import { GlassCard } from "./SyncStats";

interface SubjectProgressListProps {
  subjects: string[];
  completedSubjects: string[];
  activeSubjectIndex: number;
  recordsFoundForActive: number;
  totalRecordsScraped: number;
}

export default function SubjectProgressList({
  subjects,
  completedSubjects,
  activeSubjectIndex,
  recordsFoundForActive,
  totalRecordsScraped,
}: SubjectProgressListProps) {
  if (subjects.length === 0) return null;

  return (
    <div className="space-y-3 mt-4 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-white/10 pr-1">
      <h4 className="text-xs font-black uppercase tracking-widest text-[#8B8FA8] flex gap-2 items-center">
        <Database className="w-4 h-4" /> Discovered Subjects ({subjects.length})
      </h4>
      {subjects.map((sub, idx) => {
        const isCompleted = completedSubjects.includes(sub) || idx < activeSubjectIndex;
        const isActive = idx === activeSubjectIndex;
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={`sub-${idx}`}
          >
            <GlassCard
              className={`p-3 relative overflow-hidden transition-all duration-300 ${
                isActive ? "border-[#6C63FF] shadow-[0_0_15px_rgba(108,99,255,0.2)]" : "border-white/5 opacity-80"
              }`}
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <h5 className={`text-sm tracking-tight font-bold truncate ${isActive ? "text-[#F0F0FF]" : "text-gray-400"}`}>
                    {sub}
                  </h5>
                  
                  {isActive && (
                    <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden w-full relative">
                      <div className="absolute inset-0 bg-[#6C63FF]/30 backdrop-blur-sm" />
                    </div>
                  )}
                </div>
                
                <div className="shrink-0 flex items-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#00F5A0]" />
                  ) : isActive ? (
                    <div className="flex flex-col items-end gap-1">
                       <Loader2 className="w-5 h-5 text-[#6C63FF] animate-spin" />
                       <span className="text-[10px] text-[#6C63FF] font-bold">{recordsFoundForActive} records</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/10" />
                  )}
                </div>
              </div>

              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#6C63FF]/10 to-transparent pointer-events-none" />
              )}
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}
