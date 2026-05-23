"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type AttendanceDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: "Present" | "Absent", note: string) => void;
  subjectName: string;
};

export default function AttendanceDialog({
  isOpen,
  onClose,
  onSubmit,
  subjectName,
}: AttendanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmit = async (status: "Present" | "Absent") => {
    setIsSubmitting(true);
    await onSubmit(status, note);
    setIsSubmitting(false);
    setNote("");
    onClose();
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/40"
        onClick={!isSubmitting ? handleClose : undefined}
        style={{ opacity: 1, transition: "opacity 200ms" }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-sm overflow-hidden pointer-events-auto relative"
          style={{ opacity: 1, transition: "opacity 200ms, transform 200ms" }}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Mark Attendance
                </h3>
                <p className="text-sm font-medium text-indigo-600">
                  {subjectName}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5">
              <label className="text-xs font-medium text-gray-500 block mb-2">Notes (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any details about today's class?"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSubmit("Present")}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-7 h-7 mb-2 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  PRESENT
                </span>
              </button>

              <button
                onClick={() => handleSubmit("Absent")}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-7 h-7 mb-2 text-red-600" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  ABSENT
                </span>
              </button>
            </div>

            {isSubmitting && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-xl z-20">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                  <p className="text-sm text-gray-500">Saving...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}