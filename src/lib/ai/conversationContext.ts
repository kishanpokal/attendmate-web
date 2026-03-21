/**
 * Offline Conversation Context Manager
 * Resolves pronouns and maintains session state.
 */

export interface PendingIntent {
  intent: string;
  missingField: "subject" | "time" | "date" | "target";
}

export class ConversationContext {
  private history: { intent: string; entities: any }[] = [];
  private pendingIntent: PendingIntent | null = null;

  push(intent: string, entities: any) {
    this.history.unshift({ intent, entities });
    if (this.history.length > 20) this.history.pop();
  }

  resolveSubject(currentSubject?: string): string | undefined {
    if (currentSubject) return currentSubject;
    return this.getLastSubject();
  }

  getLastSubject(): string | undefined {
    // Look back in history for the last mentioned subject
    for (const turn of this.history) {
      if (turn.entities.subject) return turn.entities.subject;
    }
    return undefined;
  }

  getLastIntent(): string | undefined {
    return this.history[0]?.intent;
  }

  setPending(intent: string, missingField: "subject" | "time" | "date" | "target") {
    this.pendingIntent = { intent, missingField };
  }

  getPending(): PendingIntent | null {
    return this.pendingIntent;
  }

  clearPending() {
    this.pendingIntent = null;
  }

  getSummary(): string {
    if (this.history.length === 0) return "No conversation history.";
    const lastSub = this.getLastSubject();
    const lastIntent = this.getLastIntent();
    return `Last topic: ${lastSub || "General"} (${lastIntent})`;
  }
}
