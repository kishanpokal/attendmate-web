"use client";

import { motion } from "framer-motion";

type TodayLecture = {
  subjectName: string;
  status: "PRESENT" | "ABSENT";
  startTime: string;
  endTime: string;
};

export default function TodayLectureCard({
  lecture,
  index = 0,
}: {
  lecture: TodayLecture;
  index?: number;
}) {
  const isPresent = lecture.status === "PRESENT";

  const statusConfig = isPresent
    ? {
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        badgeBg: "bg-emerald-500 dark:bg-emerald-600",
        gradient: "from-emerald-500/10 to-emerald-600/5",
        glow: "shadow-emerald-500/20",
      }
    : {
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-900/20",
        border: "border-rose-200 dark:border-rose-800",
        iconBg: "bg-rose-100 dark:bg-rose-900/30",
        badgeBg: "bg-rose-500 dark:bg-rose-600",
        gradient: "from-rose-500/10 to-rose-600/5",
        glow: "shadow-rose-500/20",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group"
    >
      <div
        className={`
          relative overflow-hidden
          w-full rounded-2xl
          bg-white dark:bg-gray-900
          border-2 ${statusConfig.border}
          shadow-md hover:shadow-xl
          ${statusConfig.glow}
          transition-all duration-300
          p-5
        `}
      >
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${statusConfig.gradient} opacity-50`}
        />

        {/* Decorative Corner Element */}
        <div
          className={`absolute top-0 right-0 w-24 h-24 ${statusConfig.badgeBg} opacity-10 rounded-bl-full transition-all duration-300 group-hover:scale-150`}
        />

        <div className="relative z-10 flex items-center gap-4">
          {/* STATUS ICON */}
          <div className="flex-shrink-0">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className={`
                w-12 h-12
                rounded-2xl
                ${statusConfig.iconBg}
                flex items-center justify-center
                shadow-lg
                border-2 ${statusConfig.border}
              `}
            >
              {isPresent ? (
                <svg
                  className={`w-6 h-6 ${statusConfig.color}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className={`w-6 h-6 ${statusConfig.color}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </motion.div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 min-w-0">
            {/* Subject Name */}
            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
              {lecture.subjectName}
            </h4>

            {/* Time Section */}
            <div className="flex items-center gap-2 mb-2">
              <svg
                className={`w-4 h-4 flex-shrink-0 ${statusConfig.color}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {lecture.startTime} – {lecture.endTime}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={`
                  inline-flex items-center gap-1.5
                  px-3 py-1.5
                  rounded-full
                  text-xs
                  font-semibold
                  ${statusConfig.bg} ${statusConfig.color}
                  border-2 ${statusConfig.border}
                  shadow-sm
                `}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusConfig.badgeBg} animate-pulse`}
                />
                {isPresent ? "Present" : "Absent"}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
          className={`absolute bottom-0 left-0 right-0 h-1 ${statusConfig.badgeBg} origin-left`}
        />
      </div>
    </motion.div>
  );
}