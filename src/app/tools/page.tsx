import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PublicShell from "@/components/site/PublicShell";
import Container from "@/components/ui/Container";
import { tools } from "@/lib/toolsData";

export const metadata: Metadata = {
  title: "Free Attendance & Student Calculators",
  description:
    "Free calculators for college students: attendance percentage, how many classes you can safely skip, and CGPA to percentage conversion. No sign-up required.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndexPage() {
  return (
    <PublicShell>
      <Container size="narrow" className="py-14 lg:py-20">
        <header>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Free student tools
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Simple, accurate calculators for the questions every college student
            runs into. No account, no cost — just enter your numbers and get an
            instant answer.
          </p>
        </header>

        <div className="mt-12 grid gap-5">
          {tools.map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm transition-all"
            >
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                <t.icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  {t.short}
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </h2>
                <p className="mt-1.5 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </PublicShell>
  );
}
