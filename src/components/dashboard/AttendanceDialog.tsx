"use client";

import { motion, AnimatePresence } from "framer-motion";

type ActiveLecture = {
  subjectId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
};

export default function AttendanceDialog({
  lecture,
  saving,
  onSubmit,
  onClose,
}: {
  lecture: ActiveLecture;
  saving: boolean;
  onSubmit: (status: "Present" | "Absent") => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="attendance-dialog-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg px-3 sm:px-4 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          key="attendance-dialog-content"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[95vw] sm:max-w-md md:max-w-lg bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] shadow-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden relative"
        >
          {/* Animated gradient orbs background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-20 -right-20 w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-600/15 dark:to-purple-600/15 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -bottom-20 -left-20 w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 dark:from-blue-600/15 dark:to-cyan-600/15 rounded-full blur-3xl"
            />
          </div>

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(100,100,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(100,100,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:30px_30px] dark:bg-[linear-gradient(rgba(200,200,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(200,200,255,0.01)_1px,transparent_1px)] pointer-events-none" />

          <div className="relative z-10 p-4 sm:p-6 md:p-8">
            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              disabled={saving}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-gray-200 dark:border-gray-700 z-20"
              aria-label="Close dialog"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>

            {/* ICON */}
            <div className="flex justify-center mb-4 sm:mb-6 mt-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay: 0.1,
                }}
                className="relative"
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 flex items-center justify-center shadow-2xl relative overflow-hidden"
                >
                  {/* Shine effect */}
                  <motion.div
                    animate={{
                      x: [-100, 200],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 1,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </motion.div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl sm:rounded-3xl blur-2xl opacity-50 animate-pulse" />
                
                {/* Floating particles */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full blur-sm"
                />
                <motion.div
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute -bottom-1 -left-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-pink-400 rounded-full blur-sm"
                />
              </motion.div>
            </div>

            {/* TITLE */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2 leading-tight px-2"
            >
              Mark Your Attendance
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 px-2"
            >
              Please confirm your attendance for this lecture
            </motion.p>

            {/* SUBJECT CARD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-4 sm:mb-5 border-2 border-indigo-200/50 dark:border-indigo-800/50 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    Subject
                  </p>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg md:text-xl truncate">
                    {lecture.subjectName}
                  </p>
                </div>
              </div>

              {/* TIME */}
              <div className="flex items-center gap-2 pt-3 border-t-2 border-indigo-200/70 dark:border-indigo-800/70">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400"
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
                </div>
                <p className="text-indigo-700 dark:text-indigo-300 font-bold text-sm sm:text-base">
                  {lecture.startTime} – {lecture.endTime}
                </p>
              </div>
            </motion.div>

            {/* BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              {/* ABSENT */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                onClick={() => onSubmit("Absent")}
                className="flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-red-500/60 dark:border-red-500/40 text-red-600 dark:text-red-400 font-bold text-sm sm:text-base hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-md"
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span>Absent</span>
                  </span>
                )}
              </motion.button>

              {/* PRESENT */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                onClick={() => onSubmit("Present")}
                className="flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 text-white font-bold text-sm sm:text-base hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-md relative overflow-hidden"
              >
                {/* Button shine effect */}
                <motion.div
                  animate={{
                    x: [-200, 200],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 3,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
                {saving ? (
                  <div className="flex items-center justify-center relative z-10">
                    <Spinner />
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Present</span>
                  </span>
                )}
              </motion.button>
            </motion.div>

            {/* Info text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-3 sm:mt-4 text-center text-xs text-gray-500 dark:text-gray-500 px-2"
            >
              🔒 This action will be recorded and cannot be undone
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------- SPINNER ---------------- */

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}