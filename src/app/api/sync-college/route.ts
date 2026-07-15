import puppeteer, { Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { CollegeAttendanceRecord } from '@/lib/collegeSync';
import fs from 'fs';
import path from 'path';

export const maxDuration = 300;

const LOGIN_URL = "https://attendence-system-1910.vercel.app/users/login";
const ATTENDANCE_URL = "https://attendence-system-1910.vercel.app/students/current/attendances";

function getDataFilePath(userId: string): string {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, `college_sync_${userId}.json`);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    email, password, course, batch, division, semester, userId,
    mode,            // 'scrape' (default) | 'fetchSubjects'
    targetSubjects,  // optional string[] — when set, only these subjects are scraped
  } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Missing credentials" }), { status: 400 });
  }

  const cfgCourse = course || "Msc Cs";
  const cfgBatch = batch || "MSC CS BATCH 2022-2027";
  const cfgDivision = division || "MSC CS BATCH 2022-2027 Div-2";
  const cfgSemester = semester || "Sem8";
  const cfgMode: 'scrape' | 'fetchSubjects' = mode === 'fetchSubjects' ? 'fetchSubjects' : 'scrape';
  const cfgTargets: string[] = Array.isArray(targetSubjects) ? targetSubjects.filter(Boolean) : [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* stream closed */ }
      };

      let browser;
      try {
        send({ step: 'login', message: 'Launching secure browser instance...' });

        const isLocal = process.env.NODE_ENV === 'development';
        const executablePath = isLocal
          ? (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
              ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
              : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
          : await chromium.executablePath(
              'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
            );

        browser = await puppeteer.launch({
          args: isLocal ? ["--headless", "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-position=-32000,-32000", "--window-size=1920,1080"] : [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1920,1080"],
          defaultViewport: { width: 1920, height: 1080 },
          executablePath,
          headless: true,
        });

        const page = await browser.newPage();
        await page.emulateTimezone('Asia/Kolkata');
        await page.setViewport({ width: 1920, height: 1080 });

        // ————————————————————————————————————————
        // LOGIN — ported from the Android WebView scraper:
        // flexible selectors, simulated typing (native setter + InputEvent so
        // React registers it), already-logged-in detection, and error-element
        // checks instead of a blind timeout.
        // ————————————————————————————————————————
        send({ step: 'login', message: 'Signing into your college portal...' });
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        const alreadyLoggedIn = await page.evaluate(() => {
          const t = document.body?.innerText || '';
          return t.includes("Your Attendances") || t.includes("Your Today's Attendance");
        });

        if (alreadyLoggedIn) {
          send({ step: 'login', message: 'Already logged in, skipping login form...' });
        } else {
          // Wait for the form with flexible selectors (up to 20s, like Android)
          await page.waitForFunction(() => {
            const pass = document.querySelector("input[type='password']");
            const mail = document.querySelector("input[type='email']")
              || document.querySelector("input[placeholder*='@']")
              || document.querySelector("input[type='text']")
              || document.querySelector("input");
            const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('log'))
              || document.querySelector("button[type='submit']")
              || document.querySelector("button");
            return !!(pass && mail && btn);
          }, { timeout: 20000 });

          send({ step: 'login', message: 'Filling credentials...' });

          await page.evaluate(async (mailVal: string, passVal: string) => {
            const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

            // Simulate typing so React's controlled inputs pick up the value
            const simulateTyping = (input: HTMLInputElement, text: string) => {
              input.focus();
              input.value = '';
              input.dispatchEvent(new Event('focus', { bubbles: true }));
              const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
              )!.set!;
              nativeSetter.call(input, text);
              input.dispatchEvent(new InputEvent('input', {
                bubbles: true, cancelable: true, inputType: 'insertText', data: text
              }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('blur', { bubbles: true }));
            };

            const passInput = document.querySelector("input[type='password']") as HTMLInputElement;
            const mailInput = (document.querySelector("input[type='email']")
              || document.querySelector("input[placeholder*='@']")
              || document.querySelector("input[type='text']")
              || document.querySelector("input")) as HTMLInputElement;

            simulateTyping(mailInput, mailVal);
            await sleep(300);
            simulateTyping(passInput, passVal);
            await sleep(500);

            const submitBtn = (Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('log'))
              || document.querySelector("button[type='submit']")
              || document.querySelector("button")) as HTMLElement;
            submitBtn.click();
          }, email, password);

          send({ step: 'login', message: 'Clicking login button...' });

          // Wait for redirect away from /users/login — but also watch for an
          // on-page error message (wrong credentials) like the Android script.
          let urlWait = 0;
          let loggedIn = false;
          while (urlWait < 20000) {
            if (!page.url().includes('/users/login')) { loggedIn = true; break; }
            const errText = await page.evaluate(() => {
              const el = document.querySelector('.error, .alert-danger, [role="alert"]');
              return el && el.textContent ? el.textContent.trim() : '';
            }).catch(() => '');
            if (errText && errText.length > 0) {
              throw new Error(`Login failed: ${errText}`);
            }
            await new Promise(r => setTimeout(r, 500));
            urlWait += 500;
          }
          if (!loggedIn) throw new Error('Login timed out after 20s — check your credentials.');
        }

        // ————————————————————————————————————————
        // NAVIGATE — direct URL first; if the filter page isn't there,
        // click the "Your Attendances" button like the Android scraper.
        // ————————————————————————————————————————
        send({ step: 'navigate', message: 'Navigating to attendance dashboard...' });
        await page.goto(ATTENDANCE_URL, { waitUntil: 'networkidle2' });

        {
          let waited = 0;
          let onFilterPage = false;
          while (waited < 15000) {
            const state = await page.evaluate(() => {
              const hasFilter = Array.from(document.querySelectorAll('label')).some(
                l => (l.textContent || '').toLowerCase().includes('select')
              );
              if (hasFilter) return 'filter';
              const attendBtn = Array.from(document.querySelectorAll('button, a')).find(
                b => ((b as HTMLElement).innerText || '').toLowerCase().trim() === 'your attendances'
              );
              if (attendBtn) { (attendBtn as HTMLElement).click(); return 'clicked'; }
              return 'waiting';
            });
            if (state === 'filter') { onFilterPage = true; break; }
            if (state === 'clicked') {
              send({ step: 'navigate', message: 'Clicking "Your Attendances" button...' });
              await new Promise(r => setTimeout(r, 3000));
            } else {
              await new Promise(r => setTimeout(r, 1000));
              waited += 1000;
            }
          }
          if (!onFilterPage) {
            // Last chance — wait for the labels directly
            await page.waitForFunction(() => {
              return Array.from(document.querySelectorAll('label')).some(
                l => (l.textContent || '').toLowerCase().includes('select')
              );
            }, { timeout: 10000 });
          }
        }

        // ————————————————————————————————————————
        // selectDropdown — Android version: up to 5 open-and-search retries,
        // exact leaf-node text match (take the LAST visible match), then a
        // partial-match fallback as a final safety net.
        // ————————————————————————————————————————
        const selectDropdown = async (labelName: string, optionName: string) => {
          await page.waitForFunction(
            (lbl: string) => Array.from(document.querySelectorAll('label')).some(
              l => l.textContent?.includes(lbl)
            ),
            { timeout: 15000 },
            labelName
          );

          const picked = await page.evaluate(async (lbl: string, opt: string) => {
            const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

            const labels = Array.from(document.querySelectorAll('label'));
            const targetLabel = labels.find(l => l.textContent?.includes(lbl));
            if (!targetLabel) throw new Error(`Label not found: ${lbl}`);

            targetLabel.scrollIntoView({ block: 'center' });
            await sleep(500);

            const box = (targetLabel.nextElementSibling?.querySelector('.dropdown-selected-option')
              || targetLabel.nextElementSibling) as HTMLElement;
            if (!box) throw new Error(`Dropdown box for ${lbl} not found`);

            const lowerOption = opt.toLowerCase().trim();
            let target: HTMLElement | null = null;
            let retry = 0;

            while (retry < 5) {
              box.click();
              await sleep(1500);

              const allEls = document.querySelectorAll('*');
              const visibleMatches: HTMLElement[] = [];
              for (let k = 0; k < allEls.length; k++) {
                const el = allEls[k] as HTMLElement;
                if (el.offsetHeight > 0 && el.innerText) {
                  const elText = el.innerText.trim().toLowerCase();
                  if (elText === lowerOption && el.children.length === 0) {
                    visibleMatches.push(el);
                  }
                }
              }

              if (visibleMatches.length > 0) {
                target = visibleMatches[visibleMatches.length - 1];
                break;
              }

              // Close and retry (portal dropdowns sometimes need a re-open)
              box.click();
              await sleep(1000);
              retry++;
            }

            // Final fallback: partial match among visible leaf nodes
            if (!target) {
              box.click();
              await sleep(1500);
              const allEls = document.querySelectorAll('*');
              const partial: HTMLElement[] = [];
              for (let k = 0; k < allEls.length; k++) {
                const el = allEls[k] as HTMLElement;
                if (el.offsetHeight > 0 && el.innerText && el.children.length === 0) {
                  if (el.innerText.trim().toLowerCase().includes(lowerOption)) partial.push(el);
                }
              }
              if (partial.length > 0) target = partial[partial.length - 1];
            }

            if (!target) throw new Error(`Option not found or not visible: ${opt}`);
            const pickedText = target.innerText.trim();
            target.click();
            await sleep(1000);
            return pickedText;
          }, labelName, optionName);

          send({ step: 'select_params', message: `Selected ${labelName.replace('Select ', '')}: ${picked}` });
        };

        // ————————————————————————————————————————
        // SETUP PARAMETERS
        // ————————————————————————————————————————
        send({ step: 'select_params', message: 'Configuring semester parameters...' });
        await selectDropdown("Select Course", cfgCourse);
        await selectDropdown("Select Batch", cfgBatch);
        await selectDropdown("Select Division", cfgDivision);
        await selectDropdown("Select Semester", cfgSemester);

        // ————————————————————————————————————————
        // DISCOVER SUBJECTS
        // ————————————————————————————————————————
        send({ step: 'select_params', message: 'Discovering available subjects...' });
        await new Promise(r => setTimeout(r, 3000));

        let subjects: string[] = [];
        let retries = 0;
        const maxRetries = 5;

        while (subjects.length === 0 && retries < maxRetries) {
          if (retries > 0) {
            send({ step: 'select_params', message: `Retrying subject discovery (attempt ${retries + 1}/${maxRetries})...` });
            await new Promise(r => setTimeout(r, 2000));
          }

          const result = await page.evaluate(async () => {
            const label = Array.from(document.querySelectorAll('label')).find(
              l => l.textContent?.includes('Select Subjects')
            );
            if (!label) return { subjects: [] as string[] };

            const siblingDiv = label.nextElementSibling;
            if (!siblingDiv) return { subjects: [] as string[] };

            const dropdownBox = (siblingDiv.querySelector('.dropdown-selected-option') || siblingDiv) as HTMLElement;

            dropdownBox.click();
            await new Promise(r => setTimeout(r, 1000));

            const rawText = (siblingDiv as HTMLElement).innerText || '';
            const allSubjects = rawText.split('\n')
              .map(s => s.trim())
              .filter(s => s && s.toLowerCase() !== 'none' && !s.toLowerCase().includes('select'));

            dropdownBox.click();
            await new Promise(r => setTimeout(r, 500));

            return { subjects: [...new Set(allSubjects)].filter(s => s.length > 1) };
          });

          subjects = result.subjects;
          retries++;
        }

        if (subjects.length === 1 && subjects[0].includes('\n')) {
          subjects = subjects[0].split('\n').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'none');
        }

        // ————————————————————————————————————————
        // MODE: fetchSubjects — return the list so the user can pick targets
        // (mirrors the Android app's configuration step).
        // ————————————————————————————————————————
        if (cfgMode === 'fetchSubjects') {
          await browser.close();
          send({
            step: 'subjects_fetched',
            message: `Found ${subjects.length} subjects for ${cfgSemester}.`,
            subjects,
          });
          controller.close();
          return;
        }

        // Restrict to target subjects when configured (Android targetSubjects)
        let scrapeList = subjects;
        if (cfgTargets.length > 0) {
          const wanted = new Set(cfgTargets.map(s => s.toLowerCase().trim()));
          scrapeList = subjects.filter(s => wanted.has(s.toLowerCase().trim()));
          if (scrapeList.length === 0) scrapeList = subjects; // config is stale — fall back to all
        }

        const totalSubjects = scrapeList.filter(s => !s.toLowerCase().includes("web")).length;
        send({ step: 'select_params', message: `Found ${totalSubjects} subjects to scrape`, totalSubjects });

        // ————————————————————————————————————————
        // SCRAPE EACH SUBJECT
        // ————————————————————————————————————————
        const masterData: CollegeAttendanceRecord[] = [];
        let subjectIndex = 0;

        for (const subject of scrapeList) {
          if (subject.toLowerCase().includes("web")) continue;
          subjectIndex++;

          const progress = (message: string, pageNo = 0, totalPages?: number) => send({
            step: 'scraping_subject',
            message,
            subject,
            currentSubjectIndex: subjectIndex,
            totalSubjects,
            page: pageNo,
            ...(totalPages ? { totalPages } : {}),
            recordsFound: masterData.filter(r => r.subject === subject).length,
          });

          try {
            progress(`Scraping: ${subject}`);

            await selectDropdown("Select Subjects", subject);

            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll('button')).find(
                b => b.textContent?.includes('View Attendance')
              );
              if (btn) (btn as HTMLElement).click();
            });

            // Wait for "Loading..." to disappear (15s like the Android script)
            try {
              await page.waitForFunction(() => {
                return !Array.from(document.querySelectorAll('*')).some(
                  el => el.textContent?.trim() === 'Loading...'
                );
              }, { timeout: 15000 });
            } catch { /* timeout is OK */ }
            await new Promise(r => setTimeout(r, 1000));

            const isEmpty = await page.evaluate(() =>
              document.body.innerText.includes('There is no attendances found for you')
            );

            if (isEmpty) {
              progress(`${subject}: No attendance records found`);
              await goBackSafely(page);
              continue;
            }

            const expectedTotal = await page.evaluate(() => {
              const totalElems = Array.from(document.querySelectorAll('*')).filter(
                el => el.textContent?.includes('Total Attendances:')
              );
              if (!totalElems.length) return 0;
              const match = totalElems[totalElems.length - 1].textContent?.match(/\d+/);
              return match ? parseInt(match[0], 10) : 0;
            });

            if (expectedTotal === 0) {
              progress(`${subject}: No attendance records found`);
              await goBackSafely(page);
              continue;
            }

            const estimatedPages = Math.ceil(expectedTotal / 10);
            progress(`${subject}: Targeting ${expectedTotal} records`, 1, estimatedPages);

            let scraped = 0;
            let pageNumber = 1;

            while (scraped < expectedTotal) {
              progress(`${subject}: Reading page ${pageNumber}${estimatedPages > 1 ? ` of ~${estimatedPages}` : ''}...`, pageNumber, estimatedPages);

              // Parse rows — Android positional parsing (lines[0..2] + topic)
              const parsed = await page.evaluate((subName: string) => {
                const rows = Array.from(document.querySelectorAll('*[class*="bg-green"], *[class*="bg-red"]'));
                const recs: { subject: string; date: string; fromTime: string; toTime: string; topic: string; status: 'Present' | 'Absent' }[] = [];

                for (const row of rows) {
                  try {
                    const text = (row as HTMLElement).innerText || '';
                    if (text.includes('/') && text.includes(':')) {
                      const html = row.outerHTML.toLowerCase();
                      const isPresent = html.includes('bg-green') || html.includes('rgb(34, 197, 94');
                      const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);

                      if (lines.length >= 4) {
                        recs.push({
                          subject: subName,
                          date: lines[0],
                          fromTime: lines[1],
                          toTime: lines[2],
                          topic: lines.slice(3).join(' '),
                          status: isPresent ? 'Present' : 'Absent',
                        });
                      }
                    }
                  } catch (rowErr) { }
                }
                return { recs, topRow: rows.length ? (rows[0] as HTMLElement).innerText : '' };
              }, subject);

              masterData.push(...(parsed.recs as CollegeAttendanceRecord[]));
              scraped += parsed.recs.length;

              if (scraped >= expectedTotal) break;
              if (parsed.recs.length === 0) break;

              // Next page — Android approach: last nav button that isn't
              // "Log in" / "Go Back" / "View Attendance"; stop when disabled
              // or styled with opacity- (portal's disabled pagination style).
              const clickedNext = await page.evaluate(() => {
                const pageBtns = Array.from(document.querySelectorAll('button'));
                const navBtns: HTMLButtonElement[] = [];
                for (const b of pageBtns) {
                  const t = (b.innerText || '').toLowerCase().trim();
                  if (t !== 'log in' && t !== 'go back' && !t.includes('view attendance')) {
                    navBtns.push(b as HTMLButtonElement);
                  }
                }
                const nextBtn = navBtns.length > 0 ? navBtns[navBtns.length - 1] : null;
                if (!nextBtn || nextBtn.disabled || (nextBtn.className && nextBtn.className.includes('opacity-'))) return false;
                nextBtn.click();
                return true;
              });

              if (!clickedNext) break;

              // Wait for the page content to actually change (compare first
              // row text) — up to 15s, like the Android script.
              let pw = 0;
              let pageLoaded = false;
              while (pw < 15000) {
                await new Promise(r => setTimeout(r, 500));
                const newTop = await page.evaluate(() => {
                  const rows = document.querySelectorAll('*[class*="bg-green"], *[class*="bg-red"]');
                  return rows.length > 0 ? (rows[0] as HTMLElement).innerText : '';
                });
                if (newTop && newTop !== parsed.topRow) { pageLoaded = true; break; }
                pw += 500;
              }
              if (!pageLoaded) break; // content never changed — avoid duplicating rows
              pageNumber++;
            }

            progress(`${subject}: Completed — ${masterData.filter(r => r.subject === subject).length} records`, pageNumber, pageNumber);

            await goBackSafely(page);
          } catch (subjectErr: any) {
            // One subject failing shouldn't kill the whole sync
            progress(`${subject}: Failed — ${subjectErr.message || 'unknown error'}. Continuing...`);
            try { await goBackSafely(page); } catch { /* best effort */ }
          }
        }

        await browser.close();

        // Save to file
        if (userId) {
          try {
            const filePath = getDataFilePath(userId);
            const saveData = {
              records: masterData,
              lastSynced: new Date().toISOString(),
              totalRecords: masterData.length,
              subjects: Array.from(new Set(masterData.map(r => r.subject)))
            };
            fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));
          } catch (e) {
            console.error("Failed to save sync data to file:", e);
          }
        }

        send({
          step: 'complete',
          message: `Extraction complete! Found ${masterData.length} total records across ${totalSubjects} subjects.`,
          totalRecords: masterData,
          totalSubjects,
          recordsFound: masterData.length
        });

      } catch (error: any) {
        if (browser) await browser.close();
        send({ step: 'error', message: error.message || "Unknown scraping error" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

/**
 * Clicks "Go Back" and waits for the subject-selection form to return —
 * Android's goBackSafely: poll up to 15s for the "View Attendance" button,
 * then give React an extra second to settle.
 */
async function goBackSafely(page: Page) {
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.includes('Go Back')
    );
    if (btn) (btn as HTMLElement).click();
  });

  let backWait = 0;
  while (backWait < 15000) {
    await new Promise(r => setTimeout(r, 1000));
    const isFormVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(
        b => b.innerText && b.innerText.includes('View Attendance')
      ) || Array.from(document.querySelectorAll('label')).some(
        l => l.textContent?.includes('Select Subjects')
      );
    }).catch(() => false);
    if (isFormVisible) break;
    backWait += 1000;
  }
  await new Promise(r => setTimeout(r, 1000)); // extra buffer for React rendering
}
