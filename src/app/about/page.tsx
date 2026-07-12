import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ContentPage from "@/components/site/ContentPage";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "About AttendMate",
  description:
    "AttendMate is a free, student-built attendance tracker that helps college students stay above the 75% requirement.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About AttendMate"
      intro="A simple attendance tracker built by a student, for students."
    >
      <h2>Why AttendMate exists</h2>
      <p>
        Almost every college enforces a minimum attendance rule — usually 75% —
        and falling below it can mean being barred from exams or repeating a
        semester. Yet most students track their attendance with mental math, a
        note on their phone, or a college portal that updates weeks late. By the
        time the real number appears, it's often too late to fix.
      </p>
      <p>
        AttendMate was built to solve exactly that problem. Instead of guessing,
        you get an accurate, real-time picture of where you stand in every subject
        — and a clear answer to the question every student asks: "Can I afford to
        skip this class?"
      </p>

      <h2>What makes it different</h2>
      <ul>
        <li>
          <strong>Per-subject tracking.</strong> A healthy overall average can
          hide one subject quietly slipping below the line. AttendMate tracks each
          subject separately.
        </li>
        <li>
          <strong>Real-time, not delayed.</strong> Your percentage updates the
          moment you mark a class — no waiting on the college portal.
        </li>
        <li>
          <strong>Genuinely free.</strong> No paywalls, no credit card, no selling
          your data. The free tools even work without an account.
        </li>
      </ul>

      <h2>Who built it</h2>
      <p>
        AttendMate is built and maintained by {siteConfig.author}, a student who
        got tired of doing attendance math by hand and decided to build something
        better. It started as a personal project and grew into a tool anyone can
        use.
      </p>

      <h2>Try it yourself</h2>
      <p>
        You can start with the free calculators — no sign-up needed — or create an
        account to track your attendance automatically across the whole semester.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-6 not-prose">
        <Button href="/register" size="md">
          Create free account <ArrowRight className="w-4 h-4" />
        </Button>
        <Button href="/tools" variant="secondary" size="md">
          Explore the free tools
        </Button>
      </div>

      <p className="mt-10">
        Have feedback or a feature idea? We'd love to hear it —{" "}
        <Link href="/contact">get in touch</Link>.
      </p>
    </ContentPage>
  );
}
