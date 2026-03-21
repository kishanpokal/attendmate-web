/**
 * Offline NLP Engine for AttendMate
 * Handles intent classification and entity extraction without APIs.
 */

export type Intent = 
  | "MARK_ATTENDANCE"
  | "BULK_MARK_PRESENT"
  | "BULK_MARK_ABSENT"
  | "BULK_MARK_SPLIT"
  | "NAVIGATE"
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
  | "GET_TIMETABLE"
  | "COMPARE_SUBJECTS"
  | "MONTHLY_REPORT"
  | "SUBJECT_SKIP_CALC"
  | "GET_STREAK"
  | "GET_LOWEST_SUBJECT"
  | "GET_BEST_SUBJECT"
  | "RESET_CONTEXT"
  | "CLARIFY"
  | "UNKNOWN";

export interface ExtractedEntities {
  subject?: string;
  subject2?: string;
  status?: "PRESENT" | "ABSENT";
  date?: string;
  month?: number; // 0-indexed month
  target?: number;
  time?: string; // HH:mm format
  friend?: string;
  page?: string;
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
  NAVIGATE: ["go", "open", "show", "take", "navigate", "visit", "redirect", "page", "screen"],
  PAGES: ["dashboard", "attendance", "analytics", "settings", "timetable", "friends", "subjects", "home", "ai"],
  SPLIT_INDICATORS: ["till", "until", "before", "after", "rest", "remaining"],
  TIMETABLE: ["timetable", "schedule", "classes", "today", "lectures", "routine"],
  COMPARE: ["compare", "versus", "vs", "difference", "between", "which", "better", "worse"],
  MONTHLY: ["monthly", "month", "last month", "this month", "report", "30 days"],
  SKIP_CALC: ["skip", "bunk", "miss", "how many", "can i", "afford", "allowed", "safe to"],
  STREAK: ["streak", "consecutive", "row", "in a row", "chain"],
  LOWEST: ["lowest", "worst", "weakest", "poor", "failing", "danger", "critical"],
  BEST: ["best", "highest", "strongest", "top", "great", "excellent"]
};

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export class NlpEngine {
  private subjects: string[] = [];

  setSubjects(subjects: string[]) {
    this.subjects = subjects.map(s => s.toLowerCase());
  }

  tokenize(text: string): string[] {
    return text.toLowerCase().replace(/[?.,!]/g, "").split(/\s+/);
  }

  classifyIntent(text: string, isPendingSubject: boolean = false): Intent {
    const tokens = this.tokenize(text);
    const entities = this.extractEntities(text);
    
    // Check for GREETING
    if (this.matches(tokens, SYNONYMS.GREETING)) return "GREETING";

    // Detect if a friend name is present to prioritize social intents
    if (entities.friend && (this.matches(tokens, ["attendance", "score", "standing", "how", "hows", "check", "status", "summary", "stats"]))) {
      return "GET_FRIEND_ATTENDANCE";
    }

    // Check for navigation
    if (this.matches(tokens, SYNONYMS.NAVIGATE) && this.matches(tokens, SYNONYMS.PAGES)) {
      return "NAVIGATE";
    }

    // Check for bulk marking
    if (this.matches(tokens, SYNONYMS.BULK) || this.matches(tokens, ["mark", "set", "log"])) {
      if (this.matches(tokens, SYNONYMS.SPLIT_INDICATORS) && entities.time) {
        return "BULK_MARK_SPLIT";
      }
      if (this.matches(tokens, SYNONYMS.BULK) && this.matches(tokens, SYNONYMS.PRESENT)) return "BULK_MARK_PRESENT";
      if (this.matches(tokens, SYNONYMS.BULK) && this.matches(tokens, SYNONYMS.ABSENT)) return "BULK_MARK_ABSENT";
    }

    // New intents explicitly ordered before UNKNOWN
    if (this.matches(tokens, SYNONYMS.COMPARE) && entities.subject && entities.subject2) return "COMPARE_SUBJECTS";
    if (this.matches(tokens, SYNONYMS.MONTHLY)) return "MONTHLY_REPORT";
    if (this.matches(tokens, SYNONYMS.SKIP_CALC)) return "SUBJECT_SKIP_CALC";
    if (this.matches(tokens, SYNONYMS.STREAK)) return "GET_STREAK";
    if (this.matches(tokens, SYNONYMS.LOWEST)) return "GET_LOWEST_SUBJECT";
    if (this.matches(tokens, SYNONYMS.BEST)) return "GET_BEST_SUBJECT";

    if (tokens.length <= 2 && isPendingSubject && entities.subject) {
      return "CLARIFY";
    }

    if (this.matches(tokens, SYNONYMS.PREDICT) || this.matches(tokens, ["skip", "bunk", "miss", "leave", "drop"]) || 
       (this.matches(tokens, SYNONYMS.SUMMARY) && (this.matches(tokens, ["by", "on", "until", "till", "date", "day", "for", "tomorrow", "week"]) || text.match(/\d+(st|nd|rd|th)?/)))) {
      if (this.matches(tokens, ["by", "on", "until", "till", "date", "day", "for", "tomorrow", "week"]) || text.match(/\d+(st|nd|rd|th)?/)) {
        return "PREDICT_BY_DATE";
      }
      return "PREDICT_ATTENDANCE";
    }

    if (this.matches(tokens, SYNONYMS.SUMMARY)) return "GET_SUMMARY";
    if (this.matches(tokens, SYNONYMS.TIMETABLE)) return "GET_TIMETABLE";
    if (this.matches(tokens, SYNONYMS.TREND)) return "GET_TRENDS";
    if (this.matches(tokens, SYNONYMS.PATTERN)) return "GET_PATTERNS";
    if (this.matches(tokens, ["weekly", "week"])) return "WEEKLY_SUMMARY";
    if (this.matches(tokens, SYNONYMS.FRIEND)) return "GET_FRIEND_ATTENDANCE";
    if (this.matches(tokens, SYNONYMS.INSIGHTS)) return "GET_INSIGHTS";
    if (this.matches(tokens, ["tip", "tips", "advice", "guide"])) return "GET_TIPS";
    if (this.matches(tokens, SYNONYMS.MOTIVATE)) return "MOTIVATE";
    if (this.matches(tokens, SYNONYMS.GOAL)) return "SET_GOAL";

    // Help last to avoid hijacking
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

    // Friend Extraction
    const friendMatch = text.match(/(?:how is|how's|check|attendance of|standing of|friend)\s+(?!my|friend|your)([a-zA-Z]+)/i) || 
                       text.match(/^([a-zA-Z]+)(?:\s+attendance|\s+standing|\s+score)/i);
    if (friendMatch) {
       entities.friend = friendMatch[1];
    }

    // Identify single-subject only message (for CLARIFY)
    const matchedSubjects: string[] = [];
    for (const sub of this.subjects) {
      if (text.toLowerCase().includes(sub) || tokens.some(t => this.isFuzzyMatch(t, sub))) {
        if (!matchedSubjects.includes(sub)) {
          matchedSubjects.push(sub);
        }
      }
    }

    if (matchedSubjects.length > 0) {
      entities.subject = matchedSubjects[0];
      if (matchedSubjects.length > 1) {
        entities.subject2 = matchedSubjects[1];
      }
    }

    if (tokens.length <= 2 && matchedSubjects.length === 1 && !this.matches(tokens, SYNONYMS.SUMMARY) && !this.matches(tokens, ["mark", "attendance", "score", "skip"])) {
       // Message contains ONLY a subject name with no intent tokens -> treat it mostly as a subject response
       entities.subject = matchedSubjects[0];
    }

    // Month Extraction
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    for (let i = 0; i < months.length; i++) {
       if (tokens.includes(months[i]) || tokens.includes(shortMonths[i])) {
          entities.month = i;
          break;
       }
    }

    // Page Extraction
    for (const p of SYNONYMS.PAGES) {
      if (text.toLowerCase().includes(p)) {
        entities.page = p;
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
         const month = shortMonths.indexOf(monthStr);
         const d = new Date();
         d.setMonth(month, day);
         if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
         entities.date = d.toISOString().split('T')[0];
      }
    }

    // Time Extraction
    const timeMatch = text.match(/(?:till|before|at|by|until)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch && !entities.date) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? timeMatch[2] : "00";
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      if (!ampm && hours > 0 && hours < 8) hours += 12; 

      entities.time = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    // Target Extraction robust
    const targetMatch = text.match(/((?:eighty|seventy|ninety|sixty) percent|\d+\s*(?:%|percent))/i);
    if (targetMatch) {
      let valStr = targetMatch[1].toLowerCase();
      if (valStr.includes("eighty")) entities.target = 80;
      else if (valStr.includes("seventy")) entities.target = 70;
      else if (valStr.includes("ninety")) entities.target = 90;
      else if (valStr.includes("sixty")) entities.target = 60;
      else {
        const numMatch = valStr.match(/(\d+)/);
        if (numMatch) entities.target = parseInt(numMatch[1]);
      }
    }

    return entities;
  }

  private isFuzzyMatch(word: string, target: string): boolean {
    if (word === target) return true;
    
    // Exact match for very short words
    if (target.length <= 3) return word === target;

    // Truncated words handling (e.g., "pred" -> "predict")
    if (target.length >= 3 && word.startsWith(target.substring(0, 3)) && Math.abs(word.length - target.length) <= 3) {
      return true;
    }

    if (Math.abs(word.length - target.length) > 2) return false;
    
    const dist = levenshtein(word, target);
    if (target.length <= 5) return dist <= 1;
    return dist <= 2;
  }

  private matches(tokens: string[], keywords: string[]): boolean {
    // If ANY part of the multi-word keyword is matched directly or via hyphen
    return tokens.some(token => keywords.some(keyword => {
      if (keyword.includes(" ")) {
        const kwTokens = keyword.split(" ");
        return kwTokens.every(kwT => tokens.some(t => this.isFuzzyMatch(t, kwT)));
      }
      return this.isFuzzyMatch(token, keyword);
    }));
  }

  private hasSubject(tokens: string[]): boolean {
    return tokens.some(token => this.subjects.some(sub => this.isFuzzyMatch(token, sub)));
  }
}
