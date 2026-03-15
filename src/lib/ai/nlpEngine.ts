/**
 * Offline NLP Engine for AttendMate
 * Handles intent classification and entity extraction without APIs.
 */

export type Intent = 
  | "MARK_ATTENDANCE"
  | "BULK_MARK_PRESENT"
  | "BULK_MARK_ABSENT"
  | "PREDICT_BY_DATE"
  | "GET_FRIEND_ATTENDANCE"
  | "GET_SUMMARY"
  | "GET_INSIGHTS"
  | "PREDICT_ATTENDANCE"
  | "GET_TRENDS"
  | "GET_PATTERNS"
  | "WEEKLY_SUMMARY"
  | "GET_TIPS"
  | "GREETING"
  | "MOTIVATE"
  | "SET_GOAL"
  | "QA_POLICY"
  | "HELP"
  | "UNKNOWN";

export interface ExtractedEntities {
  subject?: string;
  status?: "PRESENT" | "ABSENT";
  date?: string;
  target?: number;
  time?: string; // HH:mm format
  friend?: string;
}

const SYNONYMS: Record<string, string[]> = {
  PRESENT: ["present", "attended", "went", "p", "was", "there"],
  ABSENT: ["absent", "missed", "bunked", "skipped", "a", "not"],
  SUMMARY: ["summary", "status", "attendance", "standing", "stats", "score", "overview", "quick", "analytics"],
  PREDICT: ["predict", "forecast", "future", "projection", "bunk", "skip"],
  TREND: ["trend", "progress", "growth", "velocity"],
  PATTERN: ["pattern", "usually", "when", "most"],
  TIPS: ["tips", "advice", "help", "guide"],
  MOTIVATE: ["motivate", "lazy", "bored", "inspiration"],
  GOAL: ["goal", "target", "aim", "set"],
  BULK: ["all", "every", "mass", "bulk", "everything"],
  FRIEND: ["friend", "someone", "mate", "classmate", "buddy"],
  INSIGHTS: ["insights", "burnout", "slump", "behavior", "analysis"],
  GREETING: ["hi", "hello", "hey", "sup", "yo", "morning", "evening", "thanks", "thank"],
};

export class NlpEngine {
  private subjects: string[] = [];

  setSubjects(subjects: string[]) {
    this.subjects = subjects.map(s => s.toLowerCase());
  }

  tokenize(text: string): string[] {
    return text.toLowerCase().replace(/[?.,!]/g, "").split(/\s+/);
  }

  classifyIntent(text: string): Intent {
    const tokens = this.tokenize(text);
    
    if (this.matches(tokens, SYNONYMS.GREETING)) return "GREETING";

    // Detect if a friend name is present to prioritize social intents
    const entities = this.extractEntities(text);
    if (entities.friend && (this.matches(tokens, ["attendance", "score", "standing", "how", "hows", "check", "status", "summary", "stats"]))) {
      return "GET_FRIEND_ATTENDANCE";
    }

    // Check for bulk marking (More flexible: "mark all present" OR "all present")
    if (this.matches(tokens, SYNONYMS.BULK) || this.matches(tokens, ["mark", "set", "log"])) {
      if (this.matches(tokens, SYNONYMS.BULK) && this.matches(tokens, SYNONYMS.PRESENT)) return "BULK_MARK_PRESENT";
      if (this.matches(tokens, SYNONYMS.BULK) && this.matches(tokens, SYNONYMS.ABSENT)) return "BULK_MARK_ABSENT";
    }

    if (this.matches(tokens, SYNONYMS.PREDICT) || this.matches(tokens, ["skip", "bunk", "miss", "leave", "drop"]) || 
       (this.matches(tokens, SYNONYMS.SUMMARY) && (this.matches(tokens, ["by", "on", "until", "till", "date", "day", "for", "tomorrow", "week"]) || text.match(/\d+(st|nd|rd|th)?/)))) {
      if (this.matches(tokens, ["by", "on", "until", "till", "date", "day", "for", "tomorrow", "week"]) || text.match(/\d+(st|nd|rd|th)?/)) {
        return "PREDICT_BY_DATE";
      }
      return "PREDICT_ATTENDANCE";
    }

    if (this.matches(tokens, SYNONYMS.SUMMARY)) return "GET_SUMMARY";
    if (this.matches(tokens, SYNONYMS.TREND)) return "GET_TRENDS";
    if (this.matches(tokens, SYNONYMS.PATTERN)) return "GET_PATTERNS";
    if (this.matches(tokens, ["weekly", "week"])) return "WEEKLY_SUMMARY";
    if (this.matches(tokens, SYNONYMS.FRIEND)) return "GET_FRIEND_ATTENDANCE";
    if (this.matches(tokens, SYNONYMS.INSIGHTS)) return "GET_INSIGHTS";
    if (this.matches(tokens, ["tip", "tips", "advice", "guide"])) return "GET_TIPS";
    if (this.matches(tokens, SYNONYMS.MOTIVATE)) return "MOTIVATE";
    if (this.matches(tokens, SYNONYMS.GOAL)) return "SET_GOAL";

    // Help last to avoid hijacking commands like "Can you predict..."
    if (this.matches(tokens, ["help", "commands", "support", "options"])) return "HELP";
    
    // Check for marking attendance
    const hasStatus = this.matches(tokens, [...SYNONYMS.PRESENT, ...SYNONYMS.ABSENT]);
    if (hasStatus && (this.matches(tokens, ["mark", "log", "add", "set"]) || this.hasSubject(tokens))) {
      return "MARK_ATTENDANCE";
    }

    // Keyword based Q&A
    if (this.matches(tokens, ["why", "policy", "rule", "75", "important"])) return "QA_POLICY";

    return "UNKNOWN";
  }

  extractEntities(text: string): ExtractedEntities {
    const tokens = this.tokenize(text);
    const entities: ExtractedEntities = {};

    // Friend Extraction (Improved RegEx)
    // Matches: "how is kishan", "kishan attendance", "check kishan"
    // Excludes common fillers like "my", "your", "my friend" from being the name
    const friendMatch = text.match(/(?:how is|how's|check|attendance of|standing of|friend)\s+(?!my|friend|your)([a-zA-Z]+)/i) || 
                       text.match(/^([a-zA-Z]+)(?:\s+attendance|\s+standing|\s+score)/i);
    
    if (friendMatch) {
       entities.friend = friendMatch[1];
    }

    // Subject Extraction
    for (const sub of this.subjects) {
      if (text.toLowerCase().includes(sub)) {
        entities.subject = sub;
        break;
      }
    }

    // Status Extraction
    if (this.matches(tokens, SYNONYMS.PRESENT)) entities.status = "PRESENT";
    else if (this.matches(tokens, SYNONYMS.ABSENT)) entities.status = "ABSENT";

    // Date Extraction
    if (text.toLowerCase().includes("tomorrow")) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      entities.date = d.toISOString().split('T')[0];
    } else if (text.toLowerCase().includes("next week")) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      entities.date = d.toISOString().split('T')[0];
    } else {
      const dateMatch = text.match(/(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      if (dateMatch) {
         const day = parseInt(dateMatch[1]);
         const monthStr = dateMatch[3].toLowerCase();
         const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
         const month = months.indexOf(monthStr);
         const d = new Date();
         d.setMonth(month, day);
         if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
         entities.date = d.toISOString().split('T')[0];
      }
    }

    // Time Extraction (e.g., "4pm", "16:00", "at 4", "till 4", "before 4")
    const timeMatch = text.match(/(?:till|before|at|by|until)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch && !entities.date) { // Avoid mismatch if date uses numbers
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? timeMatch[2] : "00";
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      // Default to PM if time is small and no AM/PM (e.g., "till 4")
      if (!ampm && hours > 0 && hours < 8) hours += 12; 

      entities.time = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    // Target Extraction (for goals)
    const targetMatch = text.match(/(\d+)%/);
    if (targetMatch) {
      entities.target = parseInt(targetMatch[1]);
    }

    return entities;
  }

  private matches(tokens: string[], keywords: string[]): boolean {
    return tokens.some(token => keywords.includes(token));
  }

  private hasSubject(tokens: string[]): boolean {
    return tokens.some(token => this.subjects.includes(token));
  }
}
