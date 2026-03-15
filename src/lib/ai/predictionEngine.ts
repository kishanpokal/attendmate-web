/**
 * Offline Prediction Engine for AttendMate
 * Handles forecasting and pattern recognition on-device.
 */

export interface AttendanceRecord {
  subject: string;
  status: "PRESENT" | "ABSENT";
  date: string;
}

export class PredictionEngine {
  predict(records: AttendanceRecord[], subject?: string) {
    const filtered = subject 
      ? records.filter(r => r.subject.toLowerCase() === subject.toLowerCase())
      : records;

    const total = filtered.length;
    const present = filtered.filter(r => r.status.toUpperCase() === "PRESENT").length;
    
    if (total === 0) return { current: 0, next: 0, status: "NO_DATA" };

    const current = (present / total) * 100;
    
    // Basic linear projection (assuming next 5 classes are attended)
    const projected = ((present + 5) / (total + 5)) * 100;
    
    return {
      current: Number(current.toFixed(1)),
      projected: Number(projected.toFixed(1)),
      needed: Math.ceil((0.75 * (total + 10) - present) / 1), // Simplistic: how many more to reach 75%
      bunkable: Math.max(0, Math.floor(present / 0.75 - total))
    };
  }

  analyzePatterns(records: AttendanceRecord[]) {
    const dayCounts: Record<number, { total: number, absent: number }> = {};
    
    records.forEach(r => {
      const day = new Date(r.date).getDay();
      if (!dayCounts[day]) dayCounts[day] = { total: 0, absent: 0 };
      dayCounts[day].total++;
      if (r.status.toUpperCase() === "ABSENT") dayCounts[day].absent++;
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let worstDay = -1;
    let maxAbsentRate = -1;

    Object.entries(dayCounts).forEach(([day, stats]) => {
      const rate = stats.absent / stats.total;
      if (rate > maxAbsentRate) {
        maxAbsentRate = rate;
        worstDay = parseInt(day);
      }
    });

    return {
      worstDay: worstDay !== -1 ? days[worstDay] : "None",
      absentRate: maxAbsentRate !== -1 ? Number((maxAbsentRate * 100).toFixed(1)) : 0
    };
  }

  getWeeklySummary(records: AttendanceRecord[]) {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recent = records.filter(r => new Date(r.date) >= last7Days);
    const present = recent.filter(r => r.status.toUpperCase() === "PRESENT").length;
    
    return {
      total: recent.length,
      present,
      absent: recent.length - present,
      score: recent.length > 0 ? Number(((present / recent.length) * 100).toFixed(1)) : 0
    };
  }

  predictByDate(records: AttendanceRecord[], targetDate: string, timetable: any[], subject?: string) {
    const now = new Date();
    const target = new Date(targetDate);
    const daysDiff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return { error: "Target date is in the past." };

    const filtered = subject 
      ? records.filter(r => r.subject.toLowerCase() === subject.toLowerCase())
      : records;

    const currentTotal = filtered.length;
    const currentPresent = filtered.filter(r => r.status.toUpperCase() === "PRESENT").length;

    // Estimate future classes based on timetable
    let estimatedFutureClasses = 0;
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    
    for (let i = 1; i <= daysDiff; i++) {
       const futureDate = new Date();
       futureDate.setDate(now.getDate() + i);
       const dayName = days[futureDate.getDay()];
       const classesOnThatDay = timetable.filter(t => t.day.toUpperCase() === dayName && (!subject || t.subjectName.toLowerCase() === subject.toLowerCase())).length;
       estimatedFutureClasses += classesOnThatDay;
    }

    const worstCase = ((currentPresent) / (currentTotal + estimatedFutureClasses)) * 100;
    const bestCase = ((currentPresent + estimatedFutureClasses) / (currentTotal + estimatedFutureClasses)) * 100;

    return {
      currentTotal,
      currentPresent,
      estimatedFutureClasses,
      worstCase: Number(worstCase.toFixed(1)),
      bestCase: Number(bestCase.toFixed(1)),
      targetDate
    };
  }

  getMotivation(percentage: number) {
    const high = [
      "You're an absolute legend! Keeping that score high is the mark of a pro.",
      "Consistency is your superpower. Keep that shield high!",
      "You're in the safe zone, but don't get too comfortable. Keep the momentum!"
    ];
    const medium = [
      "You're doing okay, but one slip could be risky. Stay sharp!",
      "The 75% line is closer than it looks. Attend the next few sessions to build a buffer.",
      "Don't let 'good enough' be the enemy of 'great'. Let's boost that score!"
    ];
    const low = [
      "Time for a comeback! Every class from here is a critical win.",
      "The struggle is real, but so is your potential. Let's claw back to 75%!",
      "One class at a time. That's how legends are made. Start today!"
    ];

    const list = percentage >= 85 ? high : percentage >= 75 ? medium : low;
    return list[Math.floor(Math.random() * list.length)];
  }

  getBehavioralInsights(records: AttendanceRecord[]) {
    const insights: string[] = [];
    if (records.length < 5) return ["I need more data to provide personalized behavioral insights. Keep logging!"];

    // 1. Monday Slump Detection
    const mondays = records.filter(r => new Date(r.date).getDay() === 1);
    const mondayMisses = mondays.filter(r => r.status.toUpperCase() === "ABSENT").length;
    if (mondays.length >= 3 && (mondayMisses / mondays.length) > 0.4) {
      insights.push("🚨 **Monday Slump Detected**: You miss over 40% of your Monday classes. Try setting an extra alarm or prepping your bag on Sunday night!");
    }

    // 2. Subject Burnout Detection (trending down)
    const subjectStats: Record<string, { total: number, recentAbsent: number }> = {};
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10);

    records.forEach(r => {
      if (!subjectStats[r.subject]) subjectStats[r.subject] = { total: 0, recentAbsent: 0 };
      subjectStats[r.subject].total++;
      if (new Date(r.date) >= recentDate && r.status.toUpperCase() === "ABSENT") {
        subjectStats[r.subject].recentAbsent++;
      }
    });

    Object.entries(subjectStats).forEach(([subject, stats]) => {
      if (stats.recentAbsent >= 2) {
        insights.push(`🔥 **Subject Burnout**: You've missed multiple **${subject}** sessions recently. Consider review sessions to catch up before the gap grows.`);
      }
    });

    // 3. Peak Performance Detection
    const morningClasses = records.filter(r => {
        // Since we don't have time in AttendanceRecord yet, we might need to adjust or skip this 
        // until we add time to records. For now, let's use a "win streak" insight.
        return true;
    });
    
    const presentStreak = [...records].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .findIndex(r => r.status.toUpperCase() === "ABSENT");
    
    if (presentStreak >= 5) {
        insights.push(`🏆 **Legendary Momentum**: You're on a **${presentStreak} session win-streak!** You're becoming an attendance pro.`);
    }

    return insights.length > 0 ? insights : ["No negative patterns detected. You're maintaining a very consistent attendance behavior!"];
  }
}
