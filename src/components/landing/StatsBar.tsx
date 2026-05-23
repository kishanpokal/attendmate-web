'use client';

import React from 'react';

const STATS = [
  { value: '< 10s', label: 'to mark attendance' },
  { value: '100%', label: 'cloud-synced, always' },
  { value: 'AI', label: 'powered predictions' },
  { value: '0', label: 'papers needed' },
];

export default function StatsBar() {
  return (
    <section className="w-full border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 dark:divide-gray-800">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center py-8 px-4"
          >
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </span>
            <span className="mt-1 text-sm text-gray-500">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
