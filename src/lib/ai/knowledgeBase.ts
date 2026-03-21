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
  },
  {
    keywords: ["debarred", "debar", "exam", "not allowed", "barred"],
    answer: "If your attendance drops below 75%, most universities will debar you from sitting the final exam. Some allow a grace period with a written application, but it is never guaranteed. Stay above 75% to be safe."
  },
  {
    keywords: ["condonation", "condone", "grace", "exception"],
    answer: "Condonation is a one-time exception some colleges grant when attendance is between 65-75% due to genuine reasons. It requires a formal application to the HOD. It is NOT automatic and NOT guaranteed."
  },
  {
    keywords: ["proxy", "fake", "mark someone", "sign for"],
    answer: "Proxy attendance (marking someone else present) is considered academic fraud and can result in disciplinary action including suspension. AttendMate only tracks your own attendance honestly."
  },
  {
    keywords: ["semester", "how long", "weeks", "duration"],
    answer: "A typical semester is 16-18 weeks long with around 90 working days. The 75% rule means you can miss a maximum of 22-23 days across the whole semester."
  }
];

export class KnowledgeBase {
  findAnswer(text: string): string | null {
    const tokens = text.toLowerCase().split(/\s+/);
    
    let bestMatch: { answer: string, score: number } | null = null;

    for (const item of POLICY_QA) {
      let score = 0;
      for (const k of item.keywords) {
        if (tokens.includes(k)) {
          score++;
        }
      }
      
      if (score >= 1) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { answer: item.answer, score };
        }
      }
    }
    
    return bestMatch ? bestMatch.answer : null;
  }
}
