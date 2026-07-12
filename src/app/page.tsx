import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CalendarDays,
  TrendingUp,
  Bell,
  ShieldCheck,
  Smartphone,
  Check,
  ChevronRight,
} from "lucide-react";
import PublicShell from "@/components/site/PublicShell";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AttendMate — Never Drop Below 75% Attendance",
  description:
    "A simple, accurate attendance tracker for college students. See your exact percentage per subject, know how many classes you can safely skip, and use free attendance calculators — no sign-up needed.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Real-time percentage",
    body: "See your exact attendance for every subject the moment you mark a class — no waiting weeks for the college portal to update.",
  },
  {
    icon: Calculator,
    title: "Safe-skip math, done for you",
    body: "AttendMate tells you exactly how many classes you can miss before you drop below 75% — per subject, not a rough guess.",
  },
  {
    icon: CalendarDays,
    title: "Timetable aware",
    body: "Add your weekly schedule once. AttendMate knows which lectures you have today and prompts you to mark them.",
  },
  {
    icon: Bell,
    title: "Danger-zone warnings",
    body: "Get a clear warning the moment a subject is at risk, so a bad week never turns into a detained semester.",
  },
  {
    icon: Smartphone,
    title: "Works on any device",
    body: "A fast, responsive interface that works the same on your phone between classes and your laptop at home.",
  },
  {
    icon: ShieldCheck,
    title: "Private and free",
    body: "Your attendance data is yours. No cost, no credit card, no selling your information to anyone.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add your subjects",
    body: "Enter your subjects and weekly timetable once. It takes under a minute.",
  },
  {
    n: "02",
    title: "Mark each class",
    body: "Tap present or absent as classes happen. AttendMate keeps the running total for you.",
  },
  {
    n: "03",
    title: "Know your buffer",
    body: "See your live percentage and exactly how many classes you can still afford to skip.",
  },
];

const TOOLS = [
  {
    title: "Attendance Calculator",
    body: "Find your exact attendance percentage from classes attended and held.",
    href: "/tools/attendance-calculator",
  },
  {
    title: "Safe Skip Calculator",
    body: "See how many classes you can miss and stay above your target.",
    href: "/tools/safe-skip-calculator",
  },
  {
    title: "CGPA ↔ Percentage",
    body: "Convert between CGPA and percentage using your university's formula.",
    href: "/tools/cgpa-percentage-converter",
  },
];

export default function LandingPage() {
  return (
    <PublicShell>
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative overflow-hidden">
        <Container className="pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Free forever · No credit card
              </span>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-gray-900 dark:text-white">
                Never drop below{" "}
                <span className="text-indigo-600">75% attendance</span> again.
              </h1>

              <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
                AttendMate tracks your college attendance in real time and tells
                you exactly how many classes you can safely skip — per subject,
                before it becomes a problem.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button href="/register" size="lg">
                  Get started free <ArrowRight className="w-4 h-4" />
                </Button>
                <Button href="/tools/attendance-calculator" variant="secondary" size="lg">
                  Try the calculator
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {["100% free", "No credit card", "Set up in 60 seconds"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Honest product preview */}
            <div className="relative">
              <HeroPreview />
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────── STAT STRIP ─────────────── */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
        <Container className="py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { k: "75%", v: "The line you can't cross" },
              { k: "Per-subject", v: "Tracking, not just overall" },
              { k: "Real-time", v: "No portal delays" },
              { k: "₹0", v: "Free for every student" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{s.k}</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.v}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─────────────── FEATURES ─────────────── */}
      <section id="features">
        <Container className="py-20 lg:py-28">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Everything you need to stay in the safe zone
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              No clutter, no gimmicks. Just the numbers that decide whether you
              sit your exams.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <div className="grid place-items-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─────────────── HOW IT WORKS ─────────────── */}
      <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
        <Container className="py-20 lg:py-28">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Three steps. Under a minute to set up.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="text-sm font-mono font-semibold text-indigo-600">{s.n}</div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─────────────── FREE TOOLS ─────────────── */}
      <section>
        <Container className="py-20 lg:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Free tools — no sign-up needed
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Quick calculators for the questions every student asks before
                skipping a class.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all tools <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm transition-all"
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                  {t.title}
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t.body}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ─────────────── FINAL CTA ─────────────── */}
      <section className="border-t border-gray-200 dark:border-gray-800">
        <Container className="py-20 lg:py-24">
          <div className="rounded-2xl bg-gray-900 dark:bg-indigo-600 px-8 py-14 sm:px-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Take control of your attendance
            </h2>
            <p className="mt-4 text-lg text-gray-300 dark:text-indigo-100 max-w-xl mx-auto">
              Join students who stopped guessing and started tracking. It's free,
              and it takes a minute to set up.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button href="/register" variant="secondary" size="lg">
                Create free account <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

/** Static, honest dashboard preview built with divs (no gimmicks). */
function HeroPreview() {
  const subjects = [
    { name: "Data Structures", pct: 88, tone: "text-green-600" },
    { name: "Thermodynamics", pct: 76, tone: "text-green-600" },
    { name: "Microprocessors", pct: 71, tone: "text-amber-600" },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Overall attendance</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/40 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Safe
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-5xl font-bold text-gray-900 dark:text-white">82.4</span>
        <span className="text-xl font-semibold text-gray-400">%</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: "82%" }} />
      </div>

      <div className="mt-6 space-y-3">
        {subjects.map((s) => (
          <div key={s.name} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
            <span className={`text-sm font-semibold ${s.tone}`}>{s.pct}%</span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
        You can skip 3 more classes this week.
      </div>
    </div>
  );
}
