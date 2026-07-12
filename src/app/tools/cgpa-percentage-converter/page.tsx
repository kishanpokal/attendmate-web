import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import CgpaConverter from "@/components/tools/CgpaConverter";
import { getTool } from "@/lib/toolsData";

const tool = getTool("cgpa-percentage-converter")!;

export const metadata: Metadata = {
  title: "CGPA to Percentage Converter",
  description: tool.description,
  alternates: { canonical: "/tools/cgpa-percentage-converter" },
};

const faqs = [
  {
    q: "How do you convert CGPA to percentage?",
    a: "The most widely used formula is Percentage = CGPA × 9.5. For example, a CGPA of 8.4 equals 8.4 × 9.5 = 79.8%. Some universities use a different multiplier, which you can change in the calculator.",
  },
  {
    q: "Why is 9.5 used as the multiplier?",
    a: "The 9.5 multiplier comes from the CBSE method, based on the average marks of top-scoring students mapped onto the 10-point grade scale. It has become the default for many Indian universities.",
  },
  {
    q: "Does every university use the same formula?",
    a: "No. While CGPA × 9.5 is the most common, some institutions use × 10, subtract a constant, or publish their own conversion table. Always confirm your university's official formula for anything important.",
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
        slug="cgpa-percentage-converter"
        article={
          <>
            <h2>Converting between CGPA and percentage</h2>
            <p>
              Colleges report results as a CGPA (Cumulative Grade Point Average)
              on a 10-point scale, but job applications, scholarships, and higher
              studies often ask for a percentage. Converting between the two is
              simple once you know the multiplier your institution uses.
            </p>
            <blockquote>Percentage = CGPA × 9.5</blockquote>
            <p>
              To go the other way, divide instead: CGPA = Percentage ÷ 9.5. The
              converter above does both directions instantly — just pick which
              value you have and enter it.
            </p>

            <h2>Where the 9.5 multiplier comes from</h2>
            <p>
              The 9.5 factor is the CBSE (Central Board of Secondary Education)
              standard. It was derived by taking the average of the marks scored
              by high-performing students across five main subjects and mapping
              those onto the grade-point scale. Because it produces reasonable
              results across the range, many universities adopted it as their
              default conversion.
            </p>

            <h2>A quick reference table</h2>
            <p>Using the standard × 9.5 formula:</p>
            <ul>
              <li><strong>CGPA 10</strong> → 95%</li>
              <li><strong>CGPA 9</strong> → 85.5%</li>
              <li><strong>CGPA 8</strong> → 76%</li>
              <li><strong>CGPA 7</strong> → 66.5%</li>
              <li><strong>CGPA 6</strong> → 57%</li>
            </ul>

            <h2>Always check your university's rule</h2>
            <p>
              This converter gives an accurate estimate using the most common
              formula, and lets you switch the multiplier if yours is different.
              But for anything official — a job application, a transcript, a
              scholarship form — confirm the exact conversion method published by
              your own university, since a small difference in the multiplier can
              change your final number by a percent or more.
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
        <CgpaConverter />
      </ToolLayout>
    </>
  );
}
