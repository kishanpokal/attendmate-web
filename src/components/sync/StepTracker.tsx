"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { SyncProgressEvent } from "@/lib/collegeSync";

const STEPS = [
  { id: "login", label: "🔐 Authentication" },
  { id: "navigate", label: "🌐 Navigation" },
  { id: "select_params", label: "⚙️ Configuration" },
  { id: "scraping_subject", label: "📊 Data Extraction" },
  { id: "complete", label: "✅ Complete" },
];

interface StepTrackerProps {
  currentStep: SyncProgressEvent["step"] | "idle";
}

export default function StepTracker({ currentStep }: StepTrackerProps) {
  const getStepStatus = (stepId: string) => {
    if (currentStep === "error") return "error";
    if (currentStep === "complete") return "complete";

    const stepIndex = STEPS.findIndex((s) => s.id === stepId);
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

    if (currentIndex > stepIndex) return "complete";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="flex flex-col space-y-0 py-2">
      {STEPS.map((step, index) => {
        const status = getStepStatus(step.id);
        const isError = status === "error";

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {/* Connecting Line */}
            {index < STEPS.length - 1 && (
              <div
                className="absolute left-[3.375rem] top-10 w-0.5 h-10 rounded-full"
                style={{
                  backgroundColor: status === "complete" ? "#6C63FF" : "rgba(255,255,255,0.08)",
                }}
              />
            )}

            <div className="w-10 flex shrink-0 justify-center z-10">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor:
                    status === "complete"
                      ? "#00F5A0"
                      : status === "active"
                      ? "#6C63FF"
                      : "transparent",
                  borderColor:
                    status === "complete"
                      ? "#00F5A0"
                      : status === "active"
                      ? "#6C63FF"
                      : "rgba(255,255,255,0.2)",
                  color:
                    status === "complete" || status === "active"
                      ? "#050816"
                      : "#8B8FA8",
                }}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs relative ${
                  status === "active" ? "ring-4 ring-[#6C63FF]/30" : ""
                }`}
              >
                {status === "complete" ? (
                  <Check className="w-4 h-4 text-[#050816]" />
                ) : (
                  index + 1
                )}

                {/* Pulse Ring for Active Step */}
                {status === "active" && (
                  <span className="absolute w-12 h-12 border-2 border-[#6C63FF] rounded-full animate-ping opacity-20" />
                )}
              </motion.div>
            </div>

            <div className="pb-8 flex-1 flex flex-col pt-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm tracking-wide ${
                    status === "active"
                      ? "text-[#F0F0FF] font-bold"
                      : status === "complete"
                      ? "text-[#8B8FA8] font-medium"
                      : "text-gray-600 font-medium"
                  }`}
                >
                  {step.label}
                </span>

                {status === "active" && (
                  <Loader2 className="w-4 h-4 text-[#00D9FF] animate-spin" />
                )}

                {status === "complete" && (
                  <span className="bg-[#00F5A0]/10 text-[#00F5A0] px-2 py-0.5 rounded text-[10px] font-bold">
                    Done
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
