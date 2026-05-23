'use client';

import React from 'react';

const TECHNOLOGIES = [
  "Next.js",
  "React",
  "TypeScript",
  "Firebase",
  "Gemini AI",
  "Tailwind CSS",
  "Vercel",
];

export default function TechStack() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16 text-center">
      <p className="text-sm text-gray-400 mb-8">Built With Modern Architecture</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {TECHNOLOGIES.map((t) => (
          <span
            key={t}
            className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
