"use client";

import React from "react";
import TodayLectureCard, { TodayLecture } from "./TodayLectureCard";
import { Calendar } from "lucide-react";
import Link from "next/link";

export default function TodayLecturesSection({ lectures }: { lectures: TodayLecture[] }) {
  if (lectures.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">📅</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No classes today</h3>
        <p className="text-sm text-gray-500 mb-5">
          Your day is free — or you haven't set up your timetable yet.
        </p>
        <Link
          href="/timetable"
          className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Set up Timetable →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <Calendar className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Today's Classes</h3>
        <span className="ml-auto text-xs text-gray-400">{lectures.length} total</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {lectures.map((lec, i) => (
          <div key={i} className="px-2 py-1">
            <TodayLectureCard lecture={lec} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
