/**
 * Offline Conversation Context Manager
 * Resolves pronouns and maintains session state.
 */

export class ConversationContext {
  private history: { intent: string; entities: any }[] = [];

  push(intent: string, entities: any) {
    this.history.unshift({ intent, entities });
    if (this.history.length > 10) this.history.pop();
  }

  resolveSubject(currentSubject?: string): string | undefined {
    if (currentSubject) return currentSubject;
    
    // Look back in history for the last mentioned subject
    for (const turn of this.history) {
      if (turn.entities.subject) return turn.entities.subject;
    }
    
    return undefined;
  }

  getLastIntent(): string | undefined {
    return this.history[0]?.intent;
  }
}
