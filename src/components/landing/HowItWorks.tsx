'use client';

import React from 'react';

const STEPS = [
  {
    n: "1",
    title: "Sign In",
    desc: "Login with your Google account or email. Set up your subjects and timetable in minutes.",
  },
  {
    n: "2",
    title: "Mark Attendance",
    desc: "When a class starts, you get prompted automatically. Tap Present or Absent — it's that simple.",
  },
  {
    n: "3",
    title: "Get AI Insights",
    desc: "View real-time analytics, ask the AI copilot how many classes you can skip, and track friends.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-indigo-600 mb-2">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Up and running in 3 steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-semibold mx-auto mb-5">
                {step.n}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
