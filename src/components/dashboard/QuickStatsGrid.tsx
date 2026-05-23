"use client";

import React from "react";
import { Target, CheckCircle2, AlertCircle, Zap } from "lucide-react";

interface QuickStatsGridProps {
  total: number;
  attended: number;
  percentage: number;
  todayCount: number;
}

export default function QuickStatsGrid({ total, attended, percentage, todayCount }: QuickStatsGridProps) {
  const absent = total - attended;

  const cards = [
    { label: "Attendance Rate", value: `${percentage}%`, icon: Target, iconBg: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600" },
    { label: "Classes Attended", value: attended, icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600" },
    { label: "Classes Missed", value: absent, icon: AlertCircle, iconBg: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600" },
    { label: "Today's Classes", value: todayCount, icon: Zap, iconBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
