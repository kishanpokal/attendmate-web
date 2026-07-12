import { Calculator, CalendarClock, GraduationCap, LucideIcon } from "lucide-react";

export interface Tool {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
}

export const tools: Tool[] = [
  {
    slug: "attendance-calculator",
    title: "Attendance Percentage Calculator",
    short: "Attendance Calculator",
    description:
      "Calculate your exact attendance percentage from classes attended and total classes held, and see how far you are from the 75% requirement.",
    icon: Calculator,
  },
  {
    slug: "safe-skip-calculator",
    title: "Safe Skip Calculator — How Many Classes Can I Miss?",
    short: "Safe Skip Calculator",
    description:
      "Find out exactly how many classes you can skip and still stay above your minimum attendance requirement.",
    icon: CalendarClock,
  },
  {
    slug: "cgpa-percentage-converter",
    title: "CGPA to Percentage Converter",
    short: "CGPA ↔ Percentage",
    description:
      "Convert CGPA to percentage and back using the standard 9.5 multiplier or your own university's formula.",
    icon: GraduationCap,
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
