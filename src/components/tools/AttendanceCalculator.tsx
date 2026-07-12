"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TriangleAlert, CheckCircle2 } from "lucide-react";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function AttendanceCalculator() {
  const [attended, setAttended] = useState("");
  const [total, setTotal] = useState("");
  const [required, setRequired] = useState("75");

  const result = useMemo(() => {
    const a = num(attended);
    const t = num(total);
    const r = num(required);
    if (a === null || t === null || r === null) return null;
    if (t <= 0 || a < 0 || r <= 0 || r > 100) return { error: "Enter valid numbers (attended ≤ held, target between 1–100)." };
    if (a > t) return { error: "Classes attended can't be more than classes held." };

    const pct = (a / t) * 100;
    const rf = r / 100;
    const meets = pct >= r;

    // How many future classes can be skipped and still stay ≥ target
    const canSkip = meets ? Math.floor(a / rf - t) : 0;
    // How many future classes must be attended in a row to reach target
    const mustAttend = meets ? 0 : Math.ceil((rf * t - a) / (1 - rf));

    return { pct, meets, canSkip: Math.max(0, canSkip), mustAttend: Math.max(0, mustAttend), r };
  }, [attended, total, required]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Classes attended" value={attended} onChange={setAttended} placeholder="e.g. 32" />
          <Field label="Total classes held" value={total} onChange={setTotal} placeholder="e.g. 40" />
          <Field label="Required %" value={required} onChange={setRequired} placeholder="75" />
        </div>
      </div>

      {result && "error" in result && (
        <div className="px-6 sm:px-7 pb-6">
          <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-4 py-3">
            {result.error}
          </p>
        </div>
      )}

      {result && !("error" in result) && (
        <div className={`border-t border-gray-200 dark:border-gray-800 p-6 sm:p-7 ${result.meets ? "bg-green-50/50 dark:bg-green-950/20" : "bg-amber-50/50 dark:bg-amber-950/20"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Your attendance</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {result.pct.toFixed(2)}
                </span>
                <span className="text-2xl font-semibold text-gray-400">%</span>
              </div>
            </div>
            <StatusBadge meets={result.meets} />
          </div>

          <div className="mt-5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${result.meets ? "bg-green-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, result.pct)}%` }}
            />
          </div>

          <div className="mt-5 flex items-start gap-2.5 text-[15px] text-gray-700 dark:text-gray-200">
            {result.meets ? (
              <>
                <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p>
                  You're above the {result.r}% requirement. You can miss up to{" "}
                  <strong className="text-gray-900 dark:text-white">{result.canSkip}</strong>{" "}
                  more {result.canSkip === 1 ? "class" : "classes"} and still stay at or above {result.r}%.
                </p>
              </>
            ) : (
              <>
                <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  You're below {result.r}%. You need to attend the next{" "}
                  <strong className="text-gray-900 dark:text-white">{result.mustAttend}</strong>{" "}
                  {result.mustAttend === 1 ? "class" : "classes"} in a row to get back to {result.r}%.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {!result && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 sm:px-7 py-8 text-center text-sm text-gray-400">
          Enter your numbers above to see your attendance percentage.
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

function StatusBadge({ meets }: { meets: boolean }) {
  return meets ? (
    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-green-100 dark:bg-green-950/50 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400">
      <CheckCircle2 className="w-4 h-4" /> Safe
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
      <TriangleAlert className="w-4 h-4" /> Below target
    </span>
  );
}
