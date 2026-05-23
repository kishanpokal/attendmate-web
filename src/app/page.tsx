'use client';

import { ArrowRight } from 'lucide-react';
import LandingNavbar from '@/components/navigation/LandingNavbar';
import FloatingDashboard from '@/components/landing/FloatingDashboard';
import StatsBar from '@/components/landing/StatsBar';
import FeatureCards from '@/components/landing/FeatureCards';
import HowItWorks from '@/components/landing/HowItWorks';
import TechStack from '@/components/landing/TechStack';
import FinalCTA from '@/components/landing/FinalCTA';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
      <LandingNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-28 lg:pt-36 pb-16">
        <div className="w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 px-4 py-1.5 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
              🎓 Built for students · AI-powered · Free
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            Attendance,{' '}
            <span className="text-indigo-600">finally smart.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            AttendMate replaces guesswork with a real-time, AI-powered system.
            Know your exact attendance percentage, predict how many classes you
            can safely skip, and track friends.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <a
              href="/login"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 text-white font-medium text-base hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/register"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Create Account
            </a>
          </div>

          {/* Trust Chips */}
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {['100% Free Forever', 'No Credit Card', 'Takes 10 Seconds'].map((chip) => (
              <div key={chip} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {chip}
              </div>
            ))}
          </div>

          <FloatingDashboard />
        </div>
      </section>

      {/* STATS BAR */}
      <StatsBar />

      {/* FEATURES */}
      <FeatureCards />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* TECH STACK */}
      <TechStack />

      {/* FINAL CTA */}
      <FinalCTA />

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <span>© 2026 AttendMate · Built by Kishan Pokal</span>
          <div className="flex gap-6">
            <a href="/blog" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium text-indigo-500">Blog</a>
            <a href="/login" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Sign In</a>
            <a href="/register" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Register</a>
            <a href="https://github.com/attendmate" target="_blank" rel="noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}