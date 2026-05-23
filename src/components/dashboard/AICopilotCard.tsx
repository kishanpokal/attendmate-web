"use client";

import React, { useState } from "react";
import { Sparkles, ChevronRight, AlertCircle, ArrowUpRight, BookOpen } from "lucide-react";

type Insight = {
  type: "positive" | "warning" | "neutral" | "suggestion";
  text: string;
};

export default function AICopilotCard({ percentage, present, absent }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const insights: Insight[] = [];
  if (percentage >= 75) {
    insights.push({ type: "positive", text: "You're doing great! Keep attending your core subjects to maintain this buffer." });
    insights.push({ type: "suggestion", text: "Consider reviewing notes for upcoming practicals to stay ahead." });
  } else if (percentage >= 60) {
    insights.push({ type: "warning", text: `You are in the danger zone. Missing ${Math.max(1, Math.floor(present * 0.1))} more classes could put you below 60%.` });
    insights.push({ type: "suggestion", text: "Prioritize subjects where you have the lowest attendance." });
  } else {
    insights.push({ type: "warning", text: "Critical attendance deficit. You must attend all classes this week." });
    insights.push({ type: "suggestion", text: "Talk to your professors about makeup assignments or extra credit." });
  }

  const getInsightStyles = (type: string) => {
    switch (type) {
      case "positive": return { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-200 dark:border-green-800", icon: ArrowUpRight, color: "text-green-600" };
      case "warning": return { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800", icon: AlertCircle, color: "text-red-600" };
      default: return { bg: "bg-indigo-50 dark:bg-indigo-950/20", border: "border-indigo-200 dark:border-indigo-800", icon: BookOpen, color: "text-indigo-600" };
    }
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
            AttendMate AI
            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-md font-medium">BETA</span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mt-1 mb-4">
            Based on your patterns, you have {percentage >= 75 ? "a comfortable buffer" : "a deficit"}. Here is what you should focus on next.
          </p>

          {!isOpen ? (
            <button
              onClick={() => setIsOpen(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors flex items-center justify-center md:justify-start gap-1 font-medium"
            >
              Reveal Insights <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-3 mt-2">
              {insights.map((insight, idx) => {
                const styles = getInsightStyles(insight.type);
                const Icon = styles.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${styles.bg} ${styles.border}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.color}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{insight.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
