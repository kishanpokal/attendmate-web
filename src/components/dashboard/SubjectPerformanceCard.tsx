"use client";

import React from "react";
import { Activity } from "lucide-react";

type SubjectStats = {
  name: string;
  attended: number;
  total: number;
  percentage: number;
};

export default function SubjectPerformanceCard({ subjects }: { subjects: SubjectStats[] }) {

  const getBarColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Subject Performance</h3>
        <span className="text-xs text-gray-400">{subjects.length} subjects</span>
      </div>

      <div className="p-5">
        {subjects.length === 0 ? (
          <div className="py-8 flex flex-col items-center text-center">
            <Activity className="w-6 h-6 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No subjects added</p>
            <p className="text-xs text-gray-500 mb-4">Start tracking your attendance.</p>
            <a href="/subjects" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Add Subjects →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((sub) => (
              <div key={sub.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate pr-3">
                    {sub.name}
                  </span>
                  <span className={`text-sm font-semibold ${getTextColor(sub.percentage)}`}>
                    {sub.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getBarColor(sub.percentage)}`}
                    style={{ width: `${sub.percentage}%`, transition: "width 0.6s ease-out" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
