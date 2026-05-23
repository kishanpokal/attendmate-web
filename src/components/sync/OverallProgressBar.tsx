"use client";


interface OverallProgressBarProps {
  progress: number;
  label?: string;
}

export default function OverallProgressBar({ progress, label = "Syncing your attendance..." }: OverallProgressBarProps) {
  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-end justify-between text-[#F0F0FF] font-bold">
        <span className="text-sm tracking-wide">{label}</span>
        <span className="text-xl font-mono text-[#00D9FF]">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full h-4 bg-white/[0.04] rounded-full overflow-hidden border border-white/5 relative shadow-inner">
        <div
          className="h-full rounded-full relative"
          style={{
            background: "linear-gradient(90deg, #6C63FF 0%, #00D9FF 100%)",
            boxShadow: "0 0 20px rgba(0, 217, 255, 0.4)"
          }}
        >
          {/* Shimmer Effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 w-1/2"
          />
        </div>
      </div>
    </div>
  );
}
