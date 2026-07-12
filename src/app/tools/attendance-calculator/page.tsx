import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import AttendanceCalculator from "@/components/tools/AttendanceCalculator";
import { getTool } from "@/lib/toolsData";

const tool = getTool("attendance-calculator")!;

export const metadata: Metadata = {
  title: "Attendance Percentage Calculator",
  description: tool.description,
  alternates: { canonical: "/tools/attendance-calculator" },
};

const faqs = [
  {
    q: "How is attendance percentage calculated?",
    a: "Attendance percentage is the number of classes you attended divided by the total number of classes held, multiplied by 100. For example, 32 attended out of 40 held is (32 ÷ 40) × 100 = 80%.",
  },
  {
    q: "How many classes can I miss and stay above 75%?",
    a: "It depends on how many classes have been held so far. If you have already attended enough classes, you can skip some and stay above 75%. This calculator shows the exact number based on your current attendance.",
  },
  {
    q: "Does this calculator work for any required percentage?",
    a: "Yes. The default is 75% because that is the most common requirement, but you can set any target from 1% to 100% to match your college's rule.",
  },
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolLayout
        slug="attendance-calculator"
        article={
          <>
            <h2>How to calculate your attendance percentage</h2>
            <p>
              Your attendance percentage is one of the simplest — and most
              important — numbers in college. It decides whether you are allowed
              to sit your exams. The formula is straightforward:
            </p>
            <blockquote>
              Attendance % = (Classes attended ÷ Total classes held) × 100
            </blockquote>
            <p>
              Say your college has held <strong>40 lectures</strong> in a subject
              so far and you have attended <strong>32</strong> of them. Your
              attendance is (32 ÷ 40) × 100 = <strong>80%</strong>. Because 80% is
              above the usual 75% requirement, you are in the safe zone — for now.
            </p>

            <h2>What the 75% rule actually means</h2>
            <p>
              Most colleges and universities require a minimum of 75% attendance
              to allow a student to appear for end-of-semester examinations. A
              student who falls below this threshold may be marked{" "}
              <em>detained</em> or debarred, which can mean repeating the entire
              semester regardless of academic performance.
            </p>
            <p>
              The 75% figure means you are only allowed to miss{" "}
              <strong>25%</strong> of your classes. In a subject with 40 total
              lectures, that is a maximum of 10 absences across the whole
              semester. This is your "buffer" — and spending it carelessly early
              in the term is the most common way students end up detained.
            </p>

            <h2>How many classes can you skip?</h2>
            <p>
              Once you are above the requirement, you can afford to miss a certain
              number of upcoming classes and still stay above the line. This
              calculator does that math for you: enter your attended and held
              counts, and it shows exactly how many classes you can skip before
              your percentage would drop below your target.
            </p>
            <p>
              If you are already below the requirement, the calculator instead
              tells you how many classes you must attend in a row to recover.
              Recovering is always harder than staying above the line, which is
              why tracking early matters.
            </p>

            <h2>Tips for staying above the requirement</h2>
            <ul>
              <li>
                <strong>Front-load your attendance.</strong> Aim for near-100% in
                the first few weeks so you build a buffer before assignments pile
                up.
              </li>
              <li>
                <strong>Track per subject, not overall.</strong> A healthy overall
                average can hide one subject that is quietly slipping below 75%.
              </li>
              <li>
                <strong>Don't trust the college portal alone.</strong> Portals
                often update weeks late. Keep your own running count so you always
                know where you stand.
              </li>
            </ul>

            <h2>Frequently asked questions</h2>
            {faqs.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </>
        }
      >
        <AttendanceCalculator />
      </ToolLayout>
    </>
  );
}
