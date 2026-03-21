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
    
    if (total === 0) return { current: 0, next: 0, bunkable: 0, needed: 0, status: "NO_DATA", daysToRecover: 0 };

    const current = (present / total) * 100;
    const projected = ((present + 5) / (total + 5)) * 100; // Basic linear projection

    let status: "SAFE" | "WARNING" | "CRITICAL" = "SAFE";
    if (current < 60) status = "CRITICAL";
    else if (current < 75) status = "WARNING";

    const needed = current < 75 ? Math.ceil((0.75 * total - present) / 0.25) : 0;
    const daysToRecover = needed; // Exact number of consecutive classes
    
    return {
      current: Number(current.toFixed(1)),
      projected: Number(projected.toFixed(1)),
      needed,
      daysToRecover,
      bunkable: Math.max(0, Math.floor(present / 0.75 - total)),
      status
    };
  }

  compareSubjects(records: AttendanceRecord[], subjectA: string, subjectB: string) {
    const aRecords = records.filter(r => r.subject.toLowerCase() === subjectA.toLowerCase());
    const bRecords = records.filter(r => r.subject.toLowerCase() === subjectB.toLowerCase());

    const getPct = (recs: AttendanceRecord[]) => recs.length === 0 ? 0 : (recs.filter(r => r.status.toUpperCase() === "PRESENT").length / recs.length) * 100;

    const pctA = getPct(aRecords);
    const pctB = getPct(bRecords);

    // Trend analysis (last 7 days vs overall)
    const getTrend = (recs: AttendanceRecord[], overallPct: number) => {
      const last7 = new Date();
      last7.setDate(last7.getDate() - 7);
      const recent = recs.filter(r => new Date(r.date) >= last7);
      if (recent.length === 0) return 0;
      const recentPct = (recent.filter(r => r.status.toUpperCase() === "PRESENT").length / recent.length) * 100;
      return recentPct - overallPct;
    };

    const trendA = getTrend(aRecords, pctA);
    const trendB = getTrend(bRecords, pctB);

    const winner = pctA > pctB ? subjectA : (pctB > pctA ? subjectB : "Tie");
    const gap = Math.abs(pctA - pctB);

    let recommendation = "";
    if (trendA < -5) recommendation = `Focus on ${subjectA} — it's trending down by ${Math.abs(Number(trendA.toFixed(1)))}% this week.`;
    else if (trendB < -5) recommendation = `Focus on ${subjectB} — it's trending down by ${Math.abs(Number(trendB.toFixed(1)))}% this week.`;
    else recommendation = winner !== "Tie" ? `Keep maintaining your lead in ${winner}!` : "Both are balanced. Good job!";

    return {
      subjectA,
      pctA: Number(pctA.toFixed(1)),
      trendA: Number(trendA.toFixed(1)),
      subjectB,
      pctB: Number(pctB.toFixed(1)),
      trendB: Number(trendB.toFixed(1)),
      winner,
      gap: Number(gap.toFixed(1)),
      recommendation
    };
  }

  getMonthlyReport(records: AttendanceRecord[], month?: number) {
    const targetMonth = month !== undefined ? month : new Date().getMonth();
    
    const monthRecords = records.filter(r => new Date(r.date).getMonth() === targetMonth);
    const totalClassesThisMonth = monthRecords.length;
    const overallPresent = monthRecords.filter(r => r.status.toUpperCase() === "PRESENT").length;
    const overallPct = totalClassesThisMonth === 0 ? 0 : (overallPresent / totalClassesThisMonth) * 100;

    const subjectGroups: Record<string, { present: number, total: number }> = {};
    monthRecords.forEach(r => {
      if (!subjectGroups[r.subject]) subjectGroups[r.subject] = { present: 0, total: 0 };
      subjectGroups[r.subject].total++;
      if (r.status.toUpperCase() === "PRESENT") subjectGroups[r.subject].present++;
    });

    const subjectBreakdown = Object.keys(subjectGroups).map(sub => {
      const st = subjectGroups[sub];
      const pct = (st.present / st.total) * 100;
      return {
        subject: sub,
        present: st.present,
        absent: st.total - st.present,
        total: st.total,
        pct: Number(pct.toFixed(1))
      };
    }).sort((a,b) => b.pct - a.pct);

    let bestSubject = "None";
    let worstSubject = "None";
    
    if (subjectBreakdown.length > 0) {
      bestSubject = subjectBreakdown[0].subject;
      worstSubject = subjectBreakdown[subjectBreakdown.length - 1].subject;
    }

    return {
      overallPct: Number(overallPct.toFixed(1)),
      totalClassesThisMonth,
      subjectBreakdown,
      bestSubject,
      worstSubject
    };
  }

  subjectSkipCalculator(records: AttendanceRecord[], subject: string, targetPct: number = 75) {
    const subRecords = records.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
    const total = subRecords.length;
    const present = subRecords.filter(r => r.status.toUpperCase() === "PRESENT").length;
    
    if (total === 0) return { current: 0, target: targetPct, canSkip: 0, mustAttend: 0, safeSkipsPerWeek: 0, status: "SAFE" as const };

    const current = (present / total) * 100;
    const decTarget = targetPct / 100;
    
    const canSkip = Math.max(0, Math.floor((present / decTarget) - total));
    const mustAttend = current < targetPct ? Math.ceil((decTarget * total - present) / (1 - decTarget)) : 0;

    // Remaining weeks in semester. Assuming 16 weeks max.
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const days = Math.floor((new Date().getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const currentWeek = Math.ceil(days / 7);
    const remainingWeeks = Math.max(1, 16 - (currentWeek % 16));
    
    const safeSkipsPerWeek = Number((canSkip / remainingWeeks).toFixed(1));

    let status: "SAFE" | "WARNING" | "CRITICAL" = "SAFE";
    if (current < targetPct) status = "CRITICAL";
    else if (canSkip <= 2) status = "WARNING";

    return {
      current: Number(current.toFixed(1)),
      target: targetPct,
      canSkip,
      mustAttend,
      safeSkipsPerWeek,
      status
    };
  }

  getStreak(records: AttendanceRecord[], subject?: string) {
    const sorted = [...records]
      .filter(r => !subject || r.subject.toLowerCase() === subject.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentPresentStreak = 0;
    let currentAbsentStreak = 0;
    let longestPresentStreak = 0;

    // Current streaks
    for (const r of sorted) {
      if (r.status.toUpperCase() === "PRESENT") {
        if (currentAbsentStreak > 0) break;
        currentPresentStreak++;
      } else {
        if (currentPresentStreak > 0) break;
        currentAbsentStreak++;
      }
    }

    // Longest streak
    let temp = 0;
    // Iterate ascending to find longest naturally
    const ascending = [...sorted].reverse();
    for (const r of ascending) {
      if (r.status.toUpperCase() === "PRESENT") {
        temp++;
        if (temp > longestPresentStreak) longestPresentStreak = temp;
      } else {
        temp = 0;
      }
    }

    return {
      currentPresentStreak,
      longestPresentStreak,
      currentAbsentStreak
    };
  }

  getSubjectRanking(records: AttendanceRecord[]) {
    const subjectGroups: Record<string, { present: number, total: number }> = {};
    records.forEach(r => {
      if (!subjectGroups[r.subject]) subjectGroups[r.subject] = { present: 0, total: 0 };
      subjectGroups[r.subject].total++;
      if (r.status.toUpperCase() === "PRESENT") subjectGroups[r.subject].present++;
    });

    return Object.keys(subjectGroups).map(sub => {
      const st = subjectGroups[sub];
      const pct = (st.present / st.total) * 100;
      let status: "SAFE" | "WARNING" | "CRITICAL" = "SAFE";
      if (pct < 60) status = "CRITICAL";
      else if (pct < 75) status = "WARNING";
      
      return {
        subject: sub,
        pct: Number(pct.toFixed(1)),
        status
      };
    }).sort((a,b) => b.pct - a.pct);
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

    const mondays = records.filter(r => new Date(r.date).getDay() === 1);
    const mondayMisses = mondays.filter(r => r.status.toUpperCase() === "ABSENT").length;
    if (mondays.length >= 3 && (mondayMisses / mondays.length) > 0.4) {
      insights.push("🚨 **Monday Slump Detected**: You miss over 40% of your Monday classes. Try setting an extra alarm or prepping your bag on Sunday night!");
    }

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
    
    const presentStreak = [...records].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .findIndex(r => r.status.toUpperCase() === "ABSENT");
    
    if (presentStreak >= 5) {
        insights.push(`🏆 **Legendary Momentum**: You're on a **${presentStreak} session win-streak!** You're becoming an attendance pro.`);
    }

    return insights.length > 0 ? insights : ["No negative patterns detected. You're maintaining a very consistent attendance behavior!"];
  }
}
