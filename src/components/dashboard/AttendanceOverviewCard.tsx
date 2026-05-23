"use client";

import React from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

function getAttendanceDeficit(present: number, total: number) {
  if (total === 0) return 0;
  const currentPercent = (present / total) * 100;
  if (currentPercent >= 75) return 0;
  let tempAttended = present;
  let tempTotal = total;
  let needed = 0;
  while (((tempAttended / tempTotal) * 100) < 75 && needed < 200) {
    tempAttended++;
    tempTotal++;
    needed++;
  }
  return needed;
}

function maxBunkableLectures(present: number, total: number) {
  if (total === 0) return 0;
  const currentPercent = (present / total) * 100;
  if (currentPercent < 75) return 0;
  let tempAttended = present;
  let tempTotal = total;
  let canSkip = 0;
  while (((tempAttended / (tempTotal + 1)) * 100) >= 75 && canSkip < 200) {
    tempTotal++;
    canSkip++;
  }
  return canSkip;
}

export default function AttendanceOverviewCard({ total, attended, percentage }: any) {
  const absent = total - attended;
  const deficit = getAttendanceDeficit(attended, total);
  const bunkable = maxBunkableLectures(attended, total);

  const statusDef =
    percentage >= 75
      ? { label: "Excellent Standing", icon: TrendingUp, badgeBg: "bg-green-50 dark:bg-green-950/20", badgeText: "text-green-700 dark:text-green-400", strokeColor: "stroke-green-500" }
      : percentage >= 60
      ? { label: "Warning Level", icon: AlertCircle, badgeBg: "bg-amber-50 dark:bg-amber-950/20", badgeText: "text-amber-700 dark:text-amber-400", strokeColor: "stroke-amber-500" }
      : { label: "Needs Attention", icon: AlertCircle, badgeBg: "bg-red-50 dark:bg-red-950/20", badgeText: "text-red-700 dark:text-red-400", strokeColor: "stroke-red-500" };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm w-full">
      <div className="flex flex-col md:flex-row p-6 gap-8 items-center md:items-start">
        {/* Circular Progress */}
        <div className="relative w-[160px] h-[160px] flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="10" fill="transparent" />
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={statusDef.strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-semibold text-gray-900 dark:text-white">{percentage}%</span>
            <span className="text-xs text-gray-500 mt-0.5">Overall</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 w-full space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Analytics</h2>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ${statusDef.badgeBg} ${statusDef.badgeText}`}>
              <statusDef.icon className="w-3.5 h-3.5" />
              {statusDef.label}
            </div>
          </div>

          {/* Insight Box */}
          <div className="border-l-4 border-indigo-500 pl-4 py-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-r-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {percentage >= 75
                ? <>You can safely skip <span className="font-semibold text-green-700 dark:text-green-400">{bunkable}</span> class{bunkable !== 1 ? 'es' : ''}.</>
                : <>You have a deficit of <span className="font-semibold text-red-700 dark:text-red-400">{deficit}</span> class{deficit !== 1 ? 'es' : ''}.</>}
            </p>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Attended</span>
              <span className="text-2xl font-semibold text-green-600">{attended}</span>
            </div>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-4">
              <span className="text-xs text-gray-500 block mb-1">Absent</span>
              <span className="text-2xl font-semibold text-red-600">{absent}</span>
            </div>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-4">
              <span className="text-xs text-gray-500 block mb-1">Total</span>
              <span className="text-2xl font-semibold text-indigo-600">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
