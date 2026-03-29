"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md"
            onClick={!isSubmitting ? handleClose : undefined}
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#080C1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--color-attendmate-primary)] to-[var(--color-attendmate-cyan)]" />

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white font-[Outfit] mb-1">
                      Mark Attendance
                    </h3>
                    <p className="text-sm font-semibold tracking-wide text-[var(--color-attendmate-primary)]">
                      {subjectName}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-5 border border-white/5 bg-white/5 p-3 rounded-xl">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Notes (Optional)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Any details about today's class?"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[var(--color-attendmate-primary)] focus:ring-1 focus:ring-[var(--color-attendmate-primary)] resize-none"
                      rows={2}
                      disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSubmit("Present")}
                    disabled={isSubmitting}
                    className="group relative flex flex-col items-center justify-center p-4 bg-[rgba(0,240,160,0.05)] border border-[rgba(0,240,160,0.2)] rounded-xl hover:bg-[rgba(0,240,160,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,240,160,0.1)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CheckCircle2 className="w-8 h-8 mb-2 text-[var(--color-attendmate-green)] group-hover:scale-110 transition-transform" />
                    <span className="font-bold font-mono text-[13px] tracking-widest text-[var(--color-attendmate-green)]">
                      PRESENT
                    </span>
                  </button>

                  <button
                    onClick={() => handleSubmit("Absent")}
                    disabled={isSubmitting}
                    className="group relative flex flex-col items-center justify-center p-4 bg-[rgba(255,77,109,0.05)] border border-[rgba(255,77,109,0.2)] rounded-xl hover:bg-[rgba(255,77,109,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(255,77,109,0.1)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <XCircle className="w-8 h-8 mb-2 text-[var(--color-attendmate-red)] group-hover:scale-110 transition-transform" />
                    <span className="font-bold font-mono text-[13px] tracking-widest text-[var(--color-attendmate-red)]">
                      ABSENT
                    </span>
                  </button>
                </div>

                {isSubmitting && (
                  <div className="absolute inset-0 bg-[#080C1A]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-attendmate-primary)]" />
                      <p className="text-sm font-medium text-white animate-pulse">
                        Saving...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}