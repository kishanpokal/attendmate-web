"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

type Mode = "cgpaToPct" | "pctToCgpa";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function CgpaConverter() {
  const [mode, setMode] = useState<Mode>("cgpaToPct");
  const [value, setValue] = useState("");
  const [multiplier, setMultiplier] = useState("9.5");

  const result = useMemo(() => {
    const v = num(value);
    const m = num(multiplier);
    if (v === null || m === null) return null;
    if (m <= 0) return { error: "Multiplier must be greater than 0." };

    if (mode === "cgpaToPct") {
      if (v < 0 || v > 10) return { error: "CGPA is usually between 0 and 10." };
      return { out: v * m, unit: "%", label: "Percentage" };
    }
    if (v < 0 || v > 100) return { error: "Percentage is usually between 0 and 100." };
    return { out: v / m, unit: "CGPA", label: "CGPA" };
  }, [value, multiplier, mode]);

  const srcLabel = mode === "cgpaToPct" ? "Your CGPA" : "Your percentage";
  const srcPlaceholder = mode === "cgpaToPct" ? "e.g. 8.4" : "e.g. 79.8";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="p-6 sm:p-7">
        {/* Direction toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-950">
          {(["cgpaToPct", "pctToCgpa"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setValue(""); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === m
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {m === "cgpaToPct" ? "CGPA → %" : "% → CGPA"}
            </button>
          ))}
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{srcLabel}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={srcPlaceholder}
              className="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Multiplier
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3.5 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
            />
          </label>
        </div>

        {/* Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Common:</span>
          {["9.5", "10", "9.0"].map((p) => (
            <button
              key={p}
              onClick={() => setMultiplier(p)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                multiplier === p
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
              }`}
            >
              × {p}
            </button>
          ))}
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
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 sm:p-7 bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">{mode === "cgpaToPct" ? "CGPA" : "Percentage"}</div>
              <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                {value}{mode === "pctToCgpa" ? "%" : ""}
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 shrink-0" />
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">{result.label}</div>
              <div className="text-4xl font-bold text-indigo-600 tabular-nums">
                {result.out.toFixed(2)}{result.unit === "%" ? "%" : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 sm:px-7 py-8 text-center text-sm text-gray-400">
          Enter a value to convert.
        </div>
      )}
    </div>
  );
}
