"use client";

import { useEffect, useState } from "react";

// Helper for Animated Counter
function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 500;
    const stepTime = Math.abs(Math.floor(duration / (end - start)));
    let timer: NodeJS.Timeout;
    
    if (end > start) {
      timer = setInterval(() => {
        start += 1;
        setDisplayValue(start);
        if (start === end) clearInterval(timer);
      }, stepTime);
    } else {
      setDisplayValue(end);
    }
    
    return () => clearInterval(timer);
  }, [value, displayValue]);

  return <span>{displayValue}</span>;
}

export const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl ${className}`}>
    {children}
  </div>
);

interface SyncStatsProps {
  totalSubjectsFound: number;
  recordsScraped: number;
  currentSubjectName: string;
  currentPage: number;
  totalPages: number;
}

export default function SyncStats({
  totalSubjectsFound,
  recordsScraped,
  currentSubjectName,
  currentPage,
  totalPages,
}: SyncStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <GlassCard className="p-4 flex flex-col items-start">
        <span className="text-xs text-muted font-black uppercase tracking-widest mb-1 font-mono text-[#8B8FA8]">
          Subjects Found
        </span>
        <span className="text-2xl font-bold font-mono text-[#F0F0FF]">
          <AnimatedCounter value={totalSubjectsFound} />
        </span>
      </GlassCard>

      <GlassCard className="p-4 flex flex-col items-start">
        <span className="text-xs text-muted font-black uppercase tracking-widest mb-1 font-mono text-[#8B8FA8]">
          Records Scraped
        </span>
        <span className="text-2xl font-bold font-mono text-[#6C63FF]">
          <AnimatedCounter value={recordsScraped} />
        </span>
      </GlassCard>

      <GlassCard className="p-4 flex flex-col items-start">
        <span className="text-xs text-muted font-black uppercase tracking-widest mb-1 font-mono text-[#8B8FA8]">
          Current Subject
        </span>
        <div className="text-sm font-bold truncate max-w-full font-sans text-[#F0F0FF] flex items-center gap-2 mt-1">
          {currentSubjectName ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse" />
              {currentSubjectName}
            </>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-4 flex flex-col items-start">
        <span className="text-xs text-muted font-black uppercase tracking-widest mb-1 font-mono text-[#8B8FA8]">
          Pages Scanned
        </span>
        <span className="text-xl font-bold font-mono text-[#F0F0FF] whitespace-nowrap">
          {currentPage} <span className="text-[#8B8FA8] text-sm">/ {totalPages || "?"}</span>
        </span>
      </GlassCard>
    </div>
  );
}
