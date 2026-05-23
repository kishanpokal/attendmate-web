"use client";

import React from "react";

export type TodayLecture = {
  subjectName: string;
  status: "PRESENT" | "ABSENT";
  startTime: string;
  endTime: string;
  note?: string;
};

export default function TodayLectureCard({
  lecture,
}: {
  lecture: TodayLecture;
  index?: number;
}) {
  const isPresent = lecture.status === "PRESENT";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {/* Time */}
      <div className="w-[100px] flex-shrink-0">
        <span className="text-sm text-gray-500">
          {lecture.startTime} – {lecture.endTime}
        </span>
      </div>

      {/* Subject */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {lecture.subjectName}
        </p>
        {lecture.note && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{lecture.note}</p>
        )}
      </div>

      {/* Status */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
        isPresent
          ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
          : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
      }`}>
        {lecture.status}
      </span>
    </div>
  );
}