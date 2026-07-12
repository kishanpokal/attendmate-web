"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function SafeSkipCalculator() {
  const [attended, setAttended] = useState("");
  const [total, setTotal] = useState("");
  const [required, setRequired] = useState("75");
  const [skip, setSkip] = useState(0);

  const data = useMemo(() => {
    const a = num(attended);
    const t = num(total);
    const r = num(required);
    if (a === null || t === null || r === null) return null;
    if (t <= 0 || a < 0 || r <= 0 || r > 100) return { error: "Enter valid numbers (target between 1–100)." };
    if (a > t) return { error: "Classes attended can't be more than classes held." };

    const rf = r / 100;
    const currentPct = (a / t) * 100;
    const maxSkip = Math.max(0, Math.floor(a / rf - t));
    const sliderMax = Math.max(maxSkip + 4, 8);
    const projected = (a / (t + skip)) * 100;

    return { currentPct, maxSkip, sliderMax, projected, r };
  }, [attended, total, required, skip]);

  const hasNumbers = data && !("error" in data);
  const safeAtSkip = hasNumbers ? data!.projected >= data!.r : false;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Classes attended" value={attended} onChange={(v) => { setAttended(v); setSkip(0); }} placeholder="e.g. 34" />
          <Field label="Total classes held" value={total} onChange={(v) => { setTotal(v); setSkip(0); }} placeholder="e.g. 42" />
          <Field label="Required %" value={required} onChange={(v) => { setRequired(v); setSkip(0); }} placeholder="75" />
        </div>
      </div>

      {data && "error" in data && (
        <div className="px-6 sm:px-7 pb-6">
          <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-4 py-3">
            {data.error}
          </p>
        </div>
      )}

      {hasNumbers && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 sm:p-7 bg-gray-50/70 dark:bg-gray-950/40">
          {/* Headline answer */}
          <div className="text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              You can safely skip
            </span>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="text-6xl font-bold text-indigo-600 tabular-nums">{data!.maxSkip}</span>
              <span className="text-lg font-medium text-gray-500">
                {data!.maxSkip === 1 ? "class" : "classes"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              and still stay at or above {data!.r}% (currently {data!.currentPct.toFixed(1)}%).
            </p>
          </div>

          {/* Simulator */}
          <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Simulate skipping
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {skip} {skip === 1 ? "class" : "classes"}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={data!.sliderMax}
              value={skip}
              onChange={(e) => setSkip(Number(e.target.value))}
              className="mt-3 w-full accent-indigo-600"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Attendance if you skip {skip}:
              </span>
              <span className={`inline-flex items-center gap-1.5 text-lg font-bold tabular-nums ${safeAtSkip ? "text-green-600" : "text-red-600"}`}>
                {safeAtSkip ? <CheckCircle2 className="w-5 h-5" /> : <TriangleAlert className="w-5 h-5" />}
                {data!.projected.toFixed(1)}%
              </span>
            </div>

            <div className="mt-3 h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${safeAtSkip ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.max(0, Math.min(100, data!.projected))}%` }}
              />
            </div>

            {!safeAtSkip && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                Skipping {skip} would drop you below {data!.r}%. Stick to {data!.maxSkip} or fewer.
              </p>
            )}
          </div>
        </div>
      )}

      {!data && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 sm:px-7 py-8 text-center text-sm text-gray-400">
          Enter your numbers to see how many classes you can safely miss.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
      />
    </label>
  );
}
