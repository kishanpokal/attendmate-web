"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  total: number;
  attended: number;
  loading: boolean;
};

export default function AttendanceSummaryCard({
  total,
  attended,
  loading,
}: Props) {
  const percentage = total === 0 ? 0 : Number(((attended / total) * 100).toFixed(2));
  const [animatedPercent, setAnimatedPercent] = useState(0);

  // Animate percentage
  useEffect(() => {
    if (loading) return;
    let start = 0;
    const end = percentage;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Number((start + (end - start) * progress).toFixed(2));
      setAnimatedPercent(value);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [percentage, loading]);

  // Determine status color based on percentage
  const getStatusColor = () => {
    if (percentage >= 75.0) return "emerald";
    if (percentage >= 60.0) return "amber";
    return "rose";
  };

  const statusColor = getStatusColor();

  if (loading) {
    return <SkeletonSummaryCard />;
  }

  return (
    <div className="w-full">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="
          relative overflow-hidden
          rounded-3xl
          bg-white dark:bg-gray-900
          shadow-lg
          border border-gray-100 dark:border-gray-800
        "
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-600/10 dark:via-purple-600/10 dark:to-pink-600/10" />

        {/* Content Container */}
        <div className="relative z-10 p-6">
          {/* Header Section */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-3"
            >
              <svg
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                Attendance Overview
              </span>
            </motion.div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Overall Attendance
            </h2>
          </div>

          {/* Circular Progress Section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Progress Circle with viewBox for proper scaling */}
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 200 200">
                {/* Background Circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  strokeWidth="14"
                  className="fill-none stroke-gray-200 dark:stroke-gray-800"
                />

                {/* Progress Circle */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  strokeWidth="14"
                  strokeLinecap="round"
                  className={`fill-none transition-colors duration-500 ${statusColor === "emerald"
                    ? "stroke-emerald-500 dark:stroke-emerald-400"
                    : statusColor === "amber"
                      ? "stroke-amber-500 dark:stroke-amber-400"
                      : "stroke-rose-500 dark:stroke-rose-400"
                    }`}
                  strokeDasharray={2 * Math.PI * 85}
                  initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 85 * (1 - animatedPercent / 100),
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{
                    filter: "drop-shadow(0 0 8px currentColor)",
                  }}
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="text-center"
                >
                  <span
                    className={`block text-4xl font-bold leading-none ${statusColor === "emerald"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : statusColor === "amber"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                      }`}
                  >
                    {animatedPercent}%
                  </span>
                </motion.div>
              </div>

              {/* Floating Particles */}
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${statusColor === "emerald"
                  ? "bg-emerald-400"
                  : statusColor === "amber"
                    ? "bg-amber-400"
                    : "bg-rose-400"
                  } blur-sm`}
              />
              <motion.div
                animate={{
                  y: [0, 8, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className={`absolute -bottom-2 -left-2 w-5 h-5 rounded-full ${statusColor === "emerald"
                  ? "bg-purple-400"
                  : statusColor === "amber"
                    ? "bg-indigo-400"
                    : "bg-pink-400"
                  } blur-sm`}
              />
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-3">
            {/* Attended Stat */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border-2 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      Attended
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 leading-none">
                      {attended}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Total Stat */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 leading-none">
                      {total}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Status Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-center"
          >
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusColor === "emerald"
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : statusColor === "amber"
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "bg-rose-100 dark:bg-rose-900/30"
                }`}
            >
              <span
                className={`text-xs font-semibold ${statusColor === "emerald"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : statusColor === "amber"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-rose-700 dark:text-rose-300"
                  }`}
              >
                {percentage >= 75.0
                  ? "🎉 Excellent! Keep it up!"
                  : percentage >= 60.0
                    ? "⚠️ Room for improvement"
                    : "📉 Attend more classes"}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- SKELETON LOADER ---------------- */

function SkeletonSummaryCard() {
  return (
    <div className="w-full">
      <div className="rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse">
        {/* Header Skeleton */}
        <div className="text-center mb-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto" />
        </div>

        {/* Circle Skeleton */}
        <div className="flex justify-center mb-6">
          <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl"
            />
          ))}
        </div>

        {/* Status Skeleton */}
        <div className="mt-4 flex justify-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}