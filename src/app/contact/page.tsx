import type { Metadata } from "next";
import { Mail, Github, MessageSquare } from "lucide-react";
import PublicShell from "@/components/site/PublicShell";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the AttendMate team for support, feedback, or feature requests.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PublicShell>
      <Container size="narrow" className="py-14 lg:py-20">
        <header>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Contact us</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Questions, bug reports, or feature ideas — we read everything. The
            fastest way to reach us is by email.
          </p>
        </header>

        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          <a
            href={`mailto:${siteConfig.email}`}
            className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
          >
            <div className="grid place-items-center w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">Email</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              For support and general questions.
            </p>
            <p className="mt-3 text-sm font-medium text-indigo-600 group-hover:text-indigo-700 break-all">
              {siteConfig.email}
            </p>
          </a>

          <a
            href="https://github.com/attendmate"
            target="_blank"
            rel="noreferrer"
            className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
          >
            <div className="grid place-items-center w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
              <Github className="w-5 h-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">GitHub</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Report issues or follow development.
            </p>
            <p className="mt-3 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
              github.com/attendmate
            </p>
          </a>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-5">
          <MessageSquare className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We're a small, student-run project, so please allow a couple of days
            for a reply. Including your account email and a clear description of
            the issue helps us respond faster.
          </p>
        </div>
      </Container>
    </PublicShell>
  );
}
