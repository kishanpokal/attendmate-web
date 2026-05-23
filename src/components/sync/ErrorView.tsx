"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorViewProps {
  errorMessage: string;
  onTryAgain: () => void;
}

export default function ErrorView({ errorMessage, onTryAgain }: ErrorViewProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full space-y-6 p-6 text-center"
    >
      <div
        className="w-20 h-20 bg-[#FF4D6D]/20 rounded-2xl flex items-center justify-center border border-[#FF4D6D]/40 shadow-[0_0_30px_rgba(255,77,109,0.2)]"
      >
        <AlertCircle className="w-10 h-10 text-[#FF4D6D]" />
      </div>

      <div className="space-y-3 max-w-sm">
        <h2 className="text-2xl font-bold font-sans text-[#F0F0FF]">
          Extraction Failed
        </h2>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-left">
          <p className="text-[#FF4D6D] text-sm break-words font-mono">
            {errorMessage || "An unexpected error occurred during the synchronization process."}
          </p>
        </div>
      </div>

      <div className="space-y-3 w-full max-w-sm">
        <button
          onClick={onTryAgain}
          className="w-full py-3.5 rounded-xl bg-[#FF4D6D] text-white font-bold transition-transform active:scale-[0.98] shadow-lg shadow-[#FF4D6D]/20 flex items-center justify-center gap-2 hover:bg-[#FF4D6D]/90"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>

        <a
          href="/dashboard"
          className="w-full py-3 rounded-xl border border-white/10 text-[#8B8FA8] font-bold hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 text-decoration-none"
        >
          <Home className="w-4 h-4" /> Back to Dashboard
        </a>
      </div>
    </div>
  );
}
