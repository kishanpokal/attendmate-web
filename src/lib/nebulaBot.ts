/**
 * Nebula Intelligent Rule Engine
 * Deterministic expert system for academic strategy.
 */

export interface SubjectStats {
  id: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
  targetPercentage: number;
}

export interface NebulaInsight {
  type: "CRITICAL" | "POSITIVE" | "WARNING" | "NEUTRAL";
  title: string;
  message: string;
}

export class NebulaBot {
  static getStrategicAdvice(subjects: SubjectStats[]): NebulaInsight[] {
    const insights: NebulaInsight[] = [];

    if (subjects.length === 0) return [{
      type: "NEUTRAL",
      title: "Silent Nebula",
      message: "Add subjects to activate your strategic consultant."
    }];

    // 1. Overall Health Check
    const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
    const totalConducted = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
    const overallPercentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 100;

    if (overallPercentage < 75) {
      insights.push({
        type: "CRITICAL",
        title: "Academic Warning",
        message: `Your overall attendance is ${overallPercentage.toFixed(1)}%. You are in the danger zone.`
      });
    } else if (overallPercentage > 85) {
      insights.push({
        type: "POSITIVE",
        title: "Elite Consistency",
        message: `Outstanding! Your ${overallPercentage.toFixed(1)}% attendance gives you a massive strategic buffer.`
      });
    }

    // 2. Individual Subject Analysis
    subjects.forEach(subject => {
      const percentage = subject.totalClasses > 0 
        ? (subject.attendedClasses / subject.totalClasses) * 100 
        : 100;

      // Calculate "Surplus Bunks" - How many more can they skip while staying above 75%
      // Equation: (Attended) / (Total + Skip) >= 0.75
      // Attended >= 0.75 * Total + 0.75 * Skip
      // Skip <= (Attended - 0.75 * Total) / 0.75
      const availableSkips = Math.floor((subject.attendedClasses - 0.75 * subject.totalClasses) / 0.75);

      if (percentage < 75) {
        const needed = Math.ceil((0.75 * subject.totalClasses - subject.attendedClasses) / 0.25);
        insights.push({
          type: "CRITICAL",
          title: `Shortage: ${subject.name}`,
          message: `You need to attend next ${needed} classes consecutively to touch 75%.`
        });
      } else if (availableSkips > 2) {
        insights.push({
          type: "POSITIVE",
          title: `Bunkable: ${subject.name}`,
          message: `You can safely skip up to ${availableSkips} classes of "${subject.name}". Use them wisely!`
        });
      } else if (availableSkips >= 0 && availableSkips <= 1) {
        insights.push({
          type: "WARNING",
          title: `Treading Thin: ${subject.name}`,
          message: `Zero skip tolerance for "${subject.name}". One absence will drop you below 75%.`
        });
      }
    });

    // 3. Global Strategy
    if (insights.length === 0) {
      insights.push({
        type: "NEUTRAL",
        title: "Stability Protocol",
        message: "Current attendance is stable. Maintaining 80%+ is recommended for internal marks."
      });
    }

    return insights;
  }

  static getBunkabilityScore(subjects: SubjectStats[]): number {
    if (subjects.length === 0) return 100;
    const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
    const totalConducted = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
    const overall = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 100;
    
    // Scale 0-100 where 100 is "Safest to Bunk"
    // Formula: (Overall - 75) * 4 capped 0-100
    return Math.min(Math.max((overall - 60) * 2.5, 0), 100);
  }
}
