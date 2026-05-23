"use client";

import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-700 mb-3" />
            <div className="h-8 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2" />
            <div className="h-4 w-28 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 h-[280px]">
            <div className="flex gap-6">
              <div className="w-36 h-36 rounded-full bg-gray-100 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-4">
                <div className="h-6 w-40 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="flex gap-4">
                  <div className="h-10 flex-1 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-10 flex-1 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-10 flex-1 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 h-[100px]" />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 h-[300px]" />
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 h-[300px]" />
        </div>
      </div>
    </div>
  );
}
