export interface CollegeAttendanceRecord {
  subject: string;
  date: string;
  fromTime: string;
  toTime: string;
  topic: string;
  status: "Present" | "Absent";
}

export interface AppAttendanceRecord {
  id?: string;
  date: string; // Format: YYYY-MM-DD
  status: string; // "PRESENT" or "ABSENT"
  subject: string;
}

export type SyncResultCategory = "MATCHED" | "MISMATCHED" | "MISSING_IN_APP" | "MISSING_IN_COLLEGE";

export interface SyncProgressEvent {
  step: 'login' | 'navigate' | 'select_params' | 'scraping_subject' | 'complete' | 'error';
  message: string;
  subject?: string;
  page?: number;
  totalPages?: number;
  recordsFound?: number;
  totalSubjects?: number;
  currentSubjectIndex?: number;
  totalRecords?: CollegeAttendanceRecord[];
}

export interface SyncComparisonResult {
  collegeRecord?: CollegeAttendanceRecord;
  appRecord?: AppAttendanceRecord;
  category: SyncResultCategory;
  subject: string;
  date: string;
}

export interface SyncSummary {
  matched: SyncComparisonResult[];
  mismatched: SyncComparisonResult[];
  missingInApp: SyncComparisonResult[];
  missingInCollege: SyncComparisonResult[];
  totalCollegeRecords: number;
  totalAppRecords: number;
}

/**
 * Attempt to normalize Indian/European format DD/MM/YYYY or DD-MM-YYYY
 * into standard ISO YYYY-MM-DD used safely by the App database.
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const str = dateStr.trim();
  
  // If it's already YYYY-MM-DD (e.g. from the App database)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    let [p0, p1, p2] = parts;
    
    // If the first part is a 4-digit year, it might be YYYY/MM/DD
    if (p0.length === 4) {
      return `${p0}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
    }
    
    // Otherwise it must be DD/MM/YYYY or MM/DD/YYYY
    let day = p0;
    let month = p1;
    let year = p2;
    
    if (year.length === 2) year = '20' + year;
    
    if (Number(p0) > 12) {
      // Must be DD/MM/YYYY
      day = p0;
      month = p1;
    } else if (Number(p1) > 12) {
      // Must be MM/DD/YYYY
      month = p0;
      day = p1;
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return str;
}

/**
 * Normalizes subject names for comparison (lowercase, trims spaces, removes special chars).
 */
function normalizeSubject(sub: string): string {
  return sub.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Compares two arrays of attendance records and categorizes the differences.
 */
export function compareAttendanceData(
  collegeData: CollegeAttendanceRecord[], 
  appData: AppAttendanceRecord[]
): SyncSummary {
  
  const summary: SyncSummary = {
    matched: [],
    mismatched: [],
    missingInApp: [],
    missingInCollege: [],
    totalCollegeRecords: collegeData.length,
    totalAppRecords: appData.length
  };

  // Build a strict 1-to-1 mapping from App Subject to the BEST Scraped Subject
  const allScrapedSubjects = Array.from(new Set(collegeData.map(r => r.subject)));
  const appToScrapedSubjectMap: Record<string, string> = {};
  
  const allAppSubjects = Array.from(new Set(appData.map(r => r.subject)));
  for (const appSubj of allAppSubjects) {
    const s1 = appSubj.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Exact alphanumeric match first
    let bestMatch = allScrapedSubjects.find(scrapedSubj => {
       const s2 = scrapedSubj.toLowerCase().replace(/[^a-z0-9]/g, '');
       return s1 === s2;
    });
    
    // If no exact match, find longest containing match
    if (!bestMatch) {
       let matches = allScrapedSubjects.filter(scrapedSubj => {
          const s2 = scrapedSubj.toLowerCase().replace(/[^a-z0-9]/g, '');
          return s1.includes(s2) || s2.includes(s1);
       });
       if (matches.length > 0) {
         bestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);
       }
    }
    
    appToScrapedSubjectMap[appSubj] = bestMatch || appSubj; // fallback
  }

  const matchedAppRecords = new Set<AppAttendanceRecord>();

  for (const scraped of collegeData) {
    const scrapedDate = normalizeDate(scraped.date);
    
    // Pass 1: Match Subject, Date, AND Status
    let matchedApp = appData.find(app => {
      const isMatched = !matchedAppRecords.has(app) &&
                        appToScrapedSubjectMap[app.subject] === scraped.subject &&
                        normalizeDate(app.date) === scrapedDate &&
                        app.status.toUpperCase() === scraped.status.toUpperCase();
      return isMatched;
    });
    
    // Pass 2: Subject and Date match (status differs)
    if (!matchedApp) {
      matchedApp = appData.find(app => {
        const isMatched = !matchedAppRecords.has(app) &&
                          appToScrapedSubjectMap[app.subject] === scraped.subject &&
                          normalizeDate(app.date) === scrapedDate;
        return isMatched;
      });
    }

    if (matchedApp) {
      matchedAppRecords.add(matchedApp);
      if (matchedApp.status.toUpperCase() === scraped.status.toUpperCase()) {
         summary.matched.push({
            category: "MATCHED",
            subject: scraped.subject,
            date: scrapedDate,
            collegeRecord: scraped,
            appRecord: matchedApp
         });
      } else {
         summary.mismatched.push({
            category: "MISMATCHED",
            subject: scraped.subject,
            date: scrapedDate,
            collegeRecord: scraped,
            appRecord: matchedApp
         });
      }
    } else {
      // Missing in App
      summary.missingInApp.push({
        category: "MISSING_IN_APP",
        subject: scraped.subject,
        date: scrapedDate,
        collegeRecord: scraped
      });
    }
  }

  // Whatever is unmatched in App
  for (const app of appData) {
    if (!matchedAppRecords.has(app)) {
      summary.missingInCollege.push({
        category: "MISSING_IN_COLLEGE",
        subject: appToScrapedSubjectMap[app.subject] || app.subject, // Map to scraped name for cleaner UI if possible
        date: normalizeDate(app.date),
        appRecord: app
      });
    }
  }

  // Sort logically for UI
  const sortFn = (a: SyncComparisonResult, b: SyncComparisonResult) => {
     return new Date(b.date).getTime() - new Date(a.date).getTime();
  };
  summary.matched.sort(sortFn);
  summary.mismatched.sort(sortFn);
  summary.missingInApp.sort(sortFn);
  summary.missingInCollege.sort(sortFn);

  return summary;
}
