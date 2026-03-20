import { NlpEngine, Intent, ExtractedEntities } from "./nlpEngine";
import { PredictionEngine, AttendanceRecord } from "./predictionEngine";
import { KnowledgeBase } from "./knowledgeBase";
import { ConversationContext } from "./conversationContext";

export interface TimetableEntry {
  subjectName: string;
  subjectId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  day: string;
}

export class OfflineAiEngine {
  private nlp = new NlpEngine();
  private predictor = new PredictionEngine();
  private kb = new KnowledgeBase();
  private context = new ConversationContext();
  private timetable: TimetableEntry[] = [];

  setSubjects(subjects: string[]) {
    this.nlp.setSubjects(subjects);
  }

  setTimetable(timetable: TimetableEntry[]) {
    this.timetable = timetable;
  }

  async processRequest(text: string, records: AttendanceRecord[]): Promise<string> {
    const intent = this.nlp.classifyIntent(text);
    const entities = this.nlp.extractEntities(text);
    
    // Resolve context
    const resolvedSubject = this.context.resolveSubject(entities.subject);
    this.context.push(intent, entities);

    switch (intent) {
      case "NAVIGATE":
        if (!entities.page) return "I'm not sure which page you want to go to. Try saying 'go to dashboard' or 'open subjects'.";
        const targetRoute = entities.page === 'home' ? 'dashboard' : entities.page;
        return `ACTION_REQUIRED:NAVIGATE:/${targetRoute}`;

      case "MARK_ATTENDANCE":
        return this.handleMarkAttendance(entities);
      
      case "BULK_MARK_PRESENT":
      case "BULK_MARK_ABSENT":
        return this.handleBulkMark(intent, entities);

      case "BULK_MARK_SPLIT":
        if (!entities.time) return "Please specify a time, like 'mark all present till 4pm'.";
        return this.handleBulkMarkSplit(entities.time);
      
      case "GET_SUMMARY":
        return this.handleSummary(records, resolvedSubject);
      
      case "PREDICT_ATTENDANCE":
        return this.handlePrediction(records, resolvedSubject);
      
      case "GET_TIMETABLE":
        return this.handleTimetable();
      
      case "GET_TRENDS":
      case "GET_PATTERNS":
        const patterns = this.predictor.analyzePatterns(records);
        return `Your worst day for attendance is **${patterns.worstDay}** with an absence rate of ${patterns.absentRate}%. I recommend focusing on those specific lectures.`;
      
      case "WEEKLY_SUMMARY":
        const weekly = this.predictor.getWeeklySummary(records);
        return `Weekly Snapshot: You attended ${weekly.present}/${weekly.total} classes (${weekly.score}%). You missed ${weekly.absent} classes this week.`;

      case "PREDICT_BY_DATE":
        return this.handleDatePrediction(records, entities, resolvedSubject);

      case "GREETING":
        return "Hey there! I'm your AttendMate Pro AI. I'm ready to help you analyze your attendance, mark new sessions, or forecast your future Standing. What's on your mind?";

      case "GET_INSIGHTS":
        const behavior = this.predictor.getBehavioralInsights(records);
        return `Intelligence Report:\n\n${behavior.map(b => `• ${b}`).join("\n")}`;

      case "GET_FRIEND_ATTENDANCE":
        if (!entities.friend) return "I need to know the friend's name. Example: 'How is Kishan doing?'.";
        return `ACTION_REQUIRED:GET_FRIEND_DATA:${entities.friend}`;

      case "GET_TIPS":
        const tips = this.predictor.getBehavioralInsights(records);
        return `Current Strategy:\n${tips[0]}\n\nPro Tip: Focus on consistent logging to refine these insights!`;

      case "MOTIVATE":
        const currentStats = this.predictor.predict(records, resolvedSubject);
        return this.predictor.getMotivation(currentStats.current);

      case "SET_GOAL":
        const target = entities.target || 75;
        return `Target locked: **${target}%**. I'll monitor your progress and alert you if you're straying from this path.`;

      case "QA_POLICY":
        const answer = this.kb.findAnswer(text);
        return answer || "I'm not entirely sure about that specific policy. Usually, keeping it above 75% is the safest bet!";

      case "HELP":
        return `ACTION_REQUIRED:SHOW_HELP`;

      default:
        return "I'm not quite sure how to handle that request yet. I'm specialized in attendance tracking, predictions, and social standing. Try asking 'How many can I skip?' or 'Check my friend's attendance'. Type 'help' to see everything I can do!";
    }
  }

  private handleMarkAttendance(entities: ExtractedEntities): string {
    if (!entities.subject || !entities.status) {
      return "I need to know which subject and status. Example: 'Mark present for Math'.";
    }
    return `CONFIRMATION_REQUIRED:MARK_ATTENDANCE:${entities.subject}:${entities.status}`;
  }

  private handleBulkMark(intent: Intent, entities: ExtractedEntities): string {
    const time = entities.time || "23:59";
    const status = intent === "BULK_MARK_PRESENT" ? "PRESENT" : "ABSENT";
    
    // Logic: Identify all lectures that start before/at 'time'
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const targets = this.timetable
      .filter(t => t.day.toUpperCase() === today && t.startTime < time)
      .map(t => t.subjectName);

    if (targets.length === 0) {
      return `I couldn't find any lectures scheduled before ${time} today in your timetable.`;
    }

    return `CONFIRMATION_REQUIRED:BULK_MARK:${status}:${time}:${targets.join(",")}`;
  }

  private handleBulkMarkSplit(time: string): string {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const presentTargets = this.timetable
      .filter(t => t.day.toUpperCase() === today && t.startTime < time)
      .map(t => t.subjectName);
    
    const absentTargets = this.timetable
      .filter(t => t.day.toUpperCase() === today && t.startTime >= time)
      .map(t => t.subjectName);

    if (presentTargets.length === 0 && absentTargets.length === 0) {
      return `I couldn't find any lectures scheduled today.`;
    }

    return `CONFIRMATION_REQUIRED:BULK_MARK_SPLIT:${time}:${presentTargets.join(",")}|${absentTargets.join(",")}`;
  }

  private handleSummary(records: AttendanceRecord[], subject?: string): string {
    const stats = this.predictor.predict(records, subject);
    if (stats.status === "NO_DATA") return "I don't have enough data yet. Log some classes first!";
    
    const scope = subject ? `**${subject}**` : "overall";
    let response = `Your ${scope} attendance is **${stats.current}%**. ${stats.current >= 75 ? "You're in good standing!" : "You're currently below the 75% threshold."}`;
    
    // Add extra overview details if summary was specifically requested
    const present = records.filter(r => (!subject || r.subject.toLowerCase() === subject.toLowerCase()) && r.status.toUpperCase() === "PRESENT").length;
    const total = records.filter(r => (!subject || r.subject.toLowerCase() === subject.toLowerCase())).length;
    
    response += `\n\n**Quick Stats:**\n• Total Classes: ${total}\n• Attended: ${present}\n• Missed: ${total - present}`;
    
    return response;
  }

  private handleDatePrediction(records: AttendanceRecord[], entities: ExtractedEntities, subject?: string): string {
    if (!entities.date) return "I need a target date for this prediction (e.g., 'tomorrow' or 'next week').";
    
    const result = this.predictor.predictByDate(records, entities.date, this.timetable, subject);
    
    if (result.error) return result.error;

    const scope = subject ? `**${subject}**` : "overall";
    const dateLabel = new Date(entities.date).toLocaleDateString("en-US", { day: "numeric", month: "long" });

    return `By **${dateLabel}**, there are approximately **${result.estimatedFutureClasses}** classes scheduled for ${scope}.\n\n` +
           `• **Best Case**: Attending all will bring you to **${result.bestCase}%**.\n` +
           `• **Worst Case**: Missing all will drop you to **${result.worstCase}%**.\n\n` +
           `Make every session count!`;
  }

  private handlePrediction(records: AttendanceRecord[], subject?: string): string {
    const stats = this.predictor.predict(records, subject);
    if (stats.status === "NO_DATA") return "Not enough data for a prediction. Keep logging!";
    
    const scope = subject ? `**${subject}**` : "overall";
    if (stats.current < 75) {
      return `Critical: Your ${scope} attendance is ${stats.current}%. You need to attend the next **${stats.needed}** classes consecutively to reach 75%.`;
    } else {
      return `Safe: Your ${scope} attendance is ${stats.current}%. You can safely skip up to **${stats.bunkable}** more classes while staying above 75%.`;
    }
  }

  private handleTimetable(): string {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const todayClasses = this.timetable.filter(t => t.day.toUpperCase() === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    if (todayClasses.length === 0) {
      return "You don't have any classes scheduled for today. Enjoy your day off!";
    }

    let response = `Here is your schedule for today (${new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}):\n\n`;
    todayClasses.forEach(c => {
      // Convert 24h to 12h for better readability
      const formatTime = (time24?: string) => {
        if (!time24) return "TBA";
        let [h, m] = time24.split(":");
        if (!h || !m) return time24;
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${m} ${ampm}`;
      };
      response += `• **${c.subjectName}**: ${formatTime(c.startTime)} - ${formatTime(c.endTime)}\n`;
    });
    
    return response;
  }
}
