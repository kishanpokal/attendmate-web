/**
 * Offline Knowledge Base for AttendMate
 * Basic keyword-based Q&A engine.
 */

export const POLICY_QA = [
  {
    keywords: ["75", "important", "why", "rule"],
    answer: "Most universities require 75% attendance to allow you to sit for final exams. It's a mandatory legal requirement and ensures you don't miss core academic content."
  },
  {
    keywords: ["medical", "sick", "leave", "hospital"],
    answer: "If you are sick, you can usually submit a medical certificate to your department head. This might grant you 'On-Duty' (OD) status, which doesn't count against your attendance percentage."
  },
  {
    keywords: ["bunk", "skip", "safe"],
    answer: "You can safely 'bunk' as long as your percentage stays above 75%. My forecasting tool can tell you exactly how many classes you can skip based on your current standing."
  },
  {
    keywords: ["calculate", "how", "math"],
    answer: "Attendance is calculated as (Total Present / Total Classes Conducted) * 100. To reach 75%, you need at least 3 present marks for every 1 absent mark."
  }
];

export class KnowledgeBase {
  findAnswer(text: string): string | null {
    const tokens = text.toLowerCase().split(/\s+/);
    
    for (const item of POLICY_QA) {
      if (item.keywords.some(k => tokens.includes(k))) {
        return item.answer;
      }
    }
    
    return null;
  }
}
