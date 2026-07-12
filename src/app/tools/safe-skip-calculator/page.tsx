import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SafeSkipCalculator from "@/components/tools/SafeSkipCalculator";
import { getTool } from "@/lib/toolsData";

const tool = getTool("safe-skip-calculator")!;

export const metadata: Metadata = {
  title: "Safe Skip Calculator — How Many Classes Can I Miss?",
  description: tool.description,
  alternates: { canonical: "/tools/safe-skip-calculator" },
};

const faqs = [
  {
    q: "How many classes can I skip and still have 75%?",
    a: "It depends on how many classes have already been held and how many you have attended. If you are comfortably above 75%, you have a buffer of classes you can miss. Enter your numbers and the calculator shows the exact safe number.",
  },
  {
    q: "What happens if I skip more than the safe number?",
    a: "Each extra class you miss pushes your percentage lower. If you go past the safe limit, your attendance drops below the requirement and you risk being detained. The simulator lets you see the exact percentage for any number of skips.",
  },
  {
    q: "Should I use up all my safe skips?",
    a: "It's smarter not to. Illness, emergencies, and travel happen. Keeping a few classes in reserve means one bad week won't push you below the line.",
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
        slug="safe-skip-calculator"
        article={
          <>
            <h2>How many classes can you actually skip?</h2>
            <p>
              "Can I bunk today?" is the most common question in college — and
              answering it with a rough guess is how students end up detained.
              The honest answer depends on three numbers: how many classes you've
              attended, how many have been held so far, and your required
              percentage.
            </p>
            <p>
              This calculator turns those three numbers into a single, clear
              answer: the exact number of upcoming classes you can miss while
              staying at or above your target. The slider then lets you play out
              "what if" — drag it to any number of skips and watch your projected
              percentage update instantly.
            </p>

            <h2>The math behind your safe-skip number</h2>
            <p>
              To stay at or above your required percentage <em>r</em>, your
              attended classes divided by your total classes (including the ones
              you skip) must remain at least <em>r</em>. Rearranged, the maximum
              number of classes you can skip is:
            </p>
            <blockquote>
              Max safe skips = ⌊ (attended ÷ r) − total held ⌋
            </blockquote>
            <p>
              For example, if you've attended <strong>34</strong> of{" "}
              <strong>42</strong> classes with a 75% target: 34 ÷ 0.75 = 45.3, so
              45 total classes are allowed before you'd drop below 75%. Since 42
              have already happened, you can safely skip{" "}
              <strong>3 more</strong>.
            </p>

            <h2>Why you shouldn't spend your whole buffer</h2>
            <p>
              Your safe-skip number is a maximum, not a target. Semesters are
              long, and unexpected absences — a fever, a family emergency, a
              cancelled bus — are guaranteed to happen. Students who burn their
              entire buffer early have zero room left when a real emergency
              arrives, and that's exactly when attendance problems become
              detentions.
            </p>
            <p>
              A good rule of thumb: keep at least two or three classes of buffer
              per subject in reserve at all times. Use the simulator above to see
              how close each skip brings you to the edge.
            </p>

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
        <SafeSkipCalculator />
      </ToolLayout>
    </>
  );
}
