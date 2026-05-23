'use client';

import React from 'react';

const MOCK_DATA = [
  { name: 'Mathematics', pct: 82, safe: true },
  { name: 'Data Structures', pct: 76, safe: true },
  { name: 'Operating Systems', pct: 68, safe: false },
  { name: 'Computer Networks', pct: 91, safe: true },
  { name: 'Database Systems', pct: 73, safe: false },
];

export default function FloatingDashboard() {
  return (
    <div className="w-full flex justify-center mt-12">
      <div className="w-full max-w-xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-400">Dashboard — AttendMate</span>
          </div>

          {/* Subject Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {MOCK_DATA.map((sub) => (
              <div
                key={sub.name}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  {sub.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                  {sub.name}
                </span>

                {/* Simple progress bar */}
                <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sub.safe ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${sub.pct}%` }}
                  />
                </div>

                <span className={`text-xs font-medium w-8 text-right ${sub.safe ? 'text-green-600' : 'text-red-600'}`}>
                  {sub.pct}%
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 font-medium">78% Overall</span>
            <span className="text-xs text-gray-500 font-medium">3 classes today</span>
            <span className="text-xs text-indigo-600 font-medium">🤖 AI: can skip 2 classes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
