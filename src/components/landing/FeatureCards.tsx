'use client';

import React from 'react';
import { CheckCircle2, BarChart3, Sparkles, Users, Cloud, CalendarDays } from 'lucide-react';

const FEATURES = [
  {
    icon: CheckCircle2,
    title: "One-Click Attendance",
    desc: "Mark your attendance in under 10 seconds. Track present, absent, and everything in between.",
    iconBg: "bg-green-50 dark:bg-green-950/30",
    iconColor: "text-green-600",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    desc: "Real-time charts showing attendance trends, subject-wise breakdowns, and performance tracking.",
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600",
  },
  {
    icon: Sparkles,
    title: "AI Copilot",
    desc: "Ask the AI how many classes you can safely skip, or let it mark your attendance by voice command.",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
    iconColor: "text-indigo-600",
  },
  {
    icon: Users,
    title: "Friends Tracking",
    desc: "Add friends and see their attendance status in real-time. Know who made it to the 8 AM lecture.",
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    desc: "Your data is securely saved to Firebase and synced instantly across all your devices.",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600",
  },
  {
    icon: CalendarDays,
    title: "Smart Timetable",
    desc: "Set up your weekly schedule once. Auto-detect active lectures and get prompted to mark attendance.",
    iconBg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600",
  },
];

export default function FeatureCards() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-12">
        <p className="text-sm font-medium text-indigo-600 mb-2">Features</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          Everything you need to{' '}
          <span className="text-indigo-600">stay above 75%.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${feature.iconBg} ${feature.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
