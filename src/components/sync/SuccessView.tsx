"use client";

import { useEffect } from "react";
import { CheckCircle2, ArrowRight, RefreshCw, Clock } from "lucide-react";

interface SuccessViewProps {
  totalRecords: number;
  totalSubjects: number;
  timeTakenMs: number;
  onViewResults: () => void;
  onSyncAgain: () => void;
}

export default function SuccessView({
  totalRecords,
  totalSubjects,
  timeTakenMs,
  onViewResults,
  onSyncAgain,
}: SuccessViewProps) {

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full space-y-8 p-6 text-center"
    >
      <div className="relative">
        <div
          className="w-24 h-24 bg-[#00F5A0]/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-12 h-12 text-[#00F5A0]" />
        </div>
        <div
          className="absolute inset-0 border-2 border-dashed border-[#00F5A0]/40 rounded-full"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold font-sans text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-[#00D9FF]">
          Sync Complete! 🎉
        </h2>
        <p className="text-[#8B8FA8] text-sm max-w-sm mx-auto">
          Successfully extracted all available attendance data from your portal.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 space-y-1">
          <p className="text-[10px] text-[#8B8FA8] uppercase font-bold tracking-wider">
            Records
          </p>
          <p className="text-lg font-mono font-bold text-[#F0F0FF]">
            {totalRecords}
          </p>
        </div>
        <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 space-y-1">
          <p className="text-[10px] text-[#8B8FA8] uppercase font-bold tracking-wider">
            Subjects
          </p>
          <p className="text-lg font-mono font-bold text-[#F0F0FF]">
            {totalSubjects}
          </p>
        </div>
        <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 space-y-1">
          <p className="text-[10px] text-[#8B8FA8] uppercase font-bold tracking-wider flex items-center gap-1 justify-center">
            <Clock className="w-3 h-3" /> Time
          </p>
          <p className="text-lg font-mono font-bold text-[#F0F0FF]">
            {formatTime(timeTakenMs)}
          </p>
        </div>
      </div>

      <div className="space-y-4 w-full max-w-md">
        <button
          onClick={onViewResults}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] text-white font-bold transition-transform active:scale-[0.98] shadow-lg shadow-[#6C63FF]/30 flex items-center justify-center gap-2 hover:opacity-90"
        >
          View Comparison Results <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onSyncAgain}
          className="w-full py-3 rounded-xl border border-white/10 text-[#8B8FA8] font-bold hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Sync Again
        </button>
      </div>
    </div>
  );
}
