'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-indigo-50 dark:bg-indigo-950/20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
          Ready to take control of your <span className="text-indigo-600">semester?</span>
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
          Join thousands of students tracking smarter. It takes less than 10 seconds to get started.
        </p>

        <a
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-indigo-600 text-white font-medium text-lg hover:bg-indigo-700 transition-colors"
        >
          Start Tracking Free <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}
