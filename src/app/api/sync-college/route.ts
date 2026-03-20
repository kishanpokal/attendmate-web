import puppeteer from 'puppeteer';
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
  const { email, password, course, batch, division, semester, userId } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Missing credentials" }), { status: 400 });
  }

  const cfgCourse = course || "Msc Cs";
  const cfgBatch = batch || "MSC CS BATCH 2022-2027";
  const cfgDivision = division || "MSC CS BATCH 2022-2027 Div-2";
  const cfgSemester = semester || "Sem8";

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

        browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1920,1080"]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // ————————————————————————————————————————
        // selectDropdown — with POLLING/RETRY logic
        // matching Python's WebDriverWait behavior
        // ————————————————————————————————————————
        const selectDropdown = async (labelName: string, optionName: string) => {
          // Step 1: Wait for the label to appear (retry up to 15s, like Python's WebDriverWait)
          await page.waitForFunction(
            (lbl: string) => {
              return Array.from(document.querySelectorAll('label')).some(
                l => l.textContent?.includes(lbl)
              );
            },
            { timeout: 15000 },
            labelName
          );

          // Step 2: Scroll to label, click dropdown, select option
          await page.evaluate(async (lbl: string, opt: string) => {
            // Find the label
            const labels = Array.from(document.querySelectorAll('label'));
            const targetLabel = labels.find(l => l.textContent?.includes(lbl));
            if (!targetLabel) throw new Error(`Label ${lbl} not found`);

            // Find the dropdown box
            const dropdownBox = targetLabel.nextElementSibling?.querySelector('.dropdown-selected-option')
              || targetLabel.nextElementSibling;
            if (!dropdownBox) throw new Error(`Dropdown box for ${lbl} not found`);

            // Scroll to it and click
            dropdownBox.scrollIntoView({ block: 'center' });
            await new Promise(r => setTimeout(r, 500));
            (dropdownBox as HTMLElement).click();
            await new Promise(r => setTimeout(r, 1500));

            // Find the option — case-insensitive, prefer exact match
            const lowerOpt = opt.toLowerCase().trim();
            const allNodes = Array.from(document.querySelectorAll('*'));

            let exactMatch: Element | null = null;
            const partialMatches: Element[] = [];

            for (const el of allNodes) {
              if (el.nodeType !== 1) continue;
              const htmlEl = el as HTMLElement;
              if (htmlEl.offsetHeight === 0) continue;
              const style = window.getComputedStyle(htmlEl);
              if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
              const elText = htmlEl.textContent?.trim().toLowerCase() || '';
              if (elText === lowerOpt && htmlEl.children.length === 0) {
                exactMatch = el;
              } else if (elText.includes(lowerOpt)) {
                partialMatches.push(el);
              }
            }

            const target = exactMatch || (partialMatches.length > 0 ? partialMatches[partialMatches.length - 1] : null);
            if (!target) throw new Error(`Option ${opt} not found`);

            // Force click
            (target as HTMLElement).click();
            await new Promise(r => setTimeout(r, 1000));
          }, labelName, optionName);
        };

        // ————————————————————————————————————————
        // LOGIN (matching Python's login method)
        // ————————————————————————————————————————
        send({ step: 'login', message: 'Signing into your college portal...' });
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        // Wait for the login form to render
        await page.waitForSelector("input[type='email']", { timeout: 15000 });
        await page.type("input[type='email']", email);
        await page.type("input[type='password']", password);
        await page.click("button[type='submit']");

        // Wait for URL to change (login redirect) — exactly like Python
        await page.waitForFunction(
          (loginUrl: string) => !window.location.href.includes(loginUrl.split('/').pop()!),
          { timeout: 30000 },
          LOGIN_URL
        );

        // ————————————————————————————————————————
        // SETUP PARAMETERS (matching Python's setup_parameters)
        // ————————————————————————————————————————
        send({ step: 'navigate', message: 'Navigating to attendance dashboard...' });
        await page.goto(ATTENDANCE_URL, { waitUntil: 'networkidle2' });

        // Wait for "Select Subjects" label — exactly like Python:
        //   self.wait.until(EC.presence_of_element_located((By.XPATH, "//label[contains(text(), 'Select Subjects')]")))
        await page.waitForFunction(() => {
          return Array.from(document.querySelectorAll('label')).some(
            l => l.textContent?.includes('Select Subjects')
          );
        }, { timeout: 15000 });

        send({ step: 'select_params', message: 'Configuring semester parameters...' });
        await selectDropdown("Select Course", cfgCourse);
        await selectDropdown("Select Batch", cfgBatch);
        await selectDropdown("Select Division", cfgDivision);
        await selectDropdown("Select Semester", cfgSemester);

        // ————————————————————————————————————————
        // GET ALL SUBJECTS (matching Python's get_all_subjects)
        // ————————————————————————————————————————
        send({ step: 'select_params', message: 'Discovering available subjects...' });

        // Wait for subjects to populate after semester selection
        // The React app may need to fetch subjects from the server
        await new Promise(r => setTimeout(r, 3000));

        let subjects: string[] = [];
        let retries = 0;
        const maxRetries = 5;

        while (subjects.length === 0 && retries < maxRetries) {
          if (retries > 0) {
            send({ step: 'select_params', message: `Retrying subject discovery (attempt ${retries + 1}/${maxRetries})...` });
            await new Promise(r => setTimeout(r, 2000));
          }

          // Match Python's get_all_subjects exactly:
          //   1. Find the label
          //   2. Find dropdown-selected-option inside following sibling div  
          //   3. Click it
          //   4. Read following sibling div's .text (visible text only)
          //   5. Split by newlines, filter out empty and 'none'
          //   6. Close dropdown
          const result = await page.evaluate(async () => {
            const label = Array.from(document.querySelectorAll('label')).find(
              l => l.textContent?.includes('Select Subjects')
            );
            if (!label) return { subjects: [], debug: 'Label "Select Subjects" not found' };

            const siblingDiv = label.nextElementSibling;
            if (!siblingDiv) return { subjects: [], debug: 'No sibling div found' };

            // Find dropdown box — exactly like Python:
            //   subject_label.find_element(By.XPATH, "./following-sibling::div//div[contains(@class, 'dropdown-selected-option')]")
            const dropdownBox = siblingDiv.querySelector('.dropdown-selected-option') || siblingDiv;

            // Click to open dropdown
            (dropdownBox as HTMLElement).click();
            await new Promise(r => setTimeout(r, 1000));

            // Read visible text from the sibling container — Python uses .text which is innerText
            const rawText = (siblingDiv as HTMLElement).innerText || '';
            const allSubjects = rawText.split('\n')
              .map(s => s.trim())
              .filter(s => s && s.toLowerCase() !== 'none' && !s.toLowerCase().includes('select'));

            // Close dropdown
            (dropdownBox as HTMLElement).click();
            await new Promise(r => setTimeout(r, 500));

            return {
              subjects: [...new Set(allSubjects)].filter(s => s.length > 1),
              debug: `Raw text (${rawText.length} chars): "${rawText.substring(0, 200)}"`
            };
          });

          subjects = result.subjects;
          send({ step: 'select_params', message: `Discovery attempt ${retries + 1}: found ${subjects.length} subjects. ${result.debug}` });

          retries++;
        }

        // Clean up messy single-string results
        if (subjects.length === 1 && subjects[0].includes('\n')) {
          subjects = subjects[0].split('\n').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'none');
        }

        const totalSubjects = subjects.filter(s => !s.toLowerCase().includes("web")).length;
        send({ step: 'select_params', message: `Found ${totalSubjects} subjects to scrape`, totalSubjects });

        // ————————————————————————————————————————
        // SCRAPE EACH SUBJECT (matching Python's scrape_subject)
        // ————————————————————————————————————————
        const masterData: CollegeAttendanceRecord[] = [];
        let subjectIndex = 0;

        for (const subject of subjects) {
          if (subject.toLowerCase().includes("web")) continue;
          subjectIndex++;

          send({
            step: 'scraping_subject',
            message: `Scraping: ${subject}`,
            subject,
            currentSubjectIndex: subjectIndex,
            totalSubjects,
            page: 0,
            recordsFound: 0
          });

          // selectDropdown now has built-in waitForFunction, so it retries finding the label
          await selectDropdown("Select Subjects", subject);

          // Click "View Attendance"
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent?.includes('View Attendance'));
            if (btn) (btn as HTMLElement).click();
          });

          // Wait for loading to finish (like Python's wait.until_not Loading)
          try {
            await page.waitForFunction(() => {
              return !Array.from(document.querySelectorAll('*')).some(
                el => el.textContent?.trim() === 'Loading...'
              );
            }, { timeout: 10000 });
          } catch { /* timeout is OK */ }
          await new Promise(r => setTimeout(r, 1000));

          // Check for empty
          const isEmpty = await page.evaluate(() => {
            return document.body.innerText.includes('There is no attendances found for you');
          });

          if (isEmpty) {
            send({
              step: 'scraping_subject',
              message: `${subject}: No attendance records found`,
              subject,
              currentSubjectIndex: subjectIndex,
              totalSubjects,
              page: 0,
              recordsFound: 0
            });
            // Go back — wait for "Select Subject For Attendance" like Python
            await goBack(page);
            continue;
          }

          let expectedTotal = await page.evaluate(() => {
            const totalElems = Array.from(document.querySelectorAll('*')).filter(
              el => el.textContent?.includes('Total Attendances:')
            );
            if (!totalElems.length) return 0;
            const match = totalElems[totalElems.length - 1].textContent?.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          });

          if (expectedTotal === 0) {
            await goBack(page);
            send({
              step: 'scraping_subject',
              message: `${subject}: No attendance records found`,
              subject,
              currentSubjectIndex: subjectIndex,
              totalSubjects,
              page: 0,
              recordsFound: 0
            });
            continue;
          }

          send({
            step: 'scraping_subject',
            message: `${subject}: Targeting ${expectedTotal} records`,
            subject,
            currentSubjectIndex: subjectIndex,
            totalSubjects,
            page: 1,
            recordsFound: 0
          });

          let scraped = 0;
          let hasNextPage = true;
          let pageNumber = 1;
          const estimatedPages = Math.ceil(expectedTotal / 10);

          while (scraped < expectedTotal && hasNextPage) {
            send({
              step: 'scraping_subject',
              message: `${subject}: Reading page ${pageNumber}${estimatedPages > 1 ? ` of ~${estimatedPages}` : ''}...`,
              subject,
              currentSubjectIndex: subjectIndex,
              totalSubjects,
              page: pageNumber,
              totalPages: estimatedPages,
              recordsFound: masterData.filter(r => r.subject === subject).length
            });

            const parsedData = await page.evaluate((subName) => {
              const rows = Array.from(document.querySelectorAll('*[class*="bg-green"], *[class*="bg-red"]'));
              const recs: CollegeAttendanceRecord[] = [];
              for (const row of rows) {
                const text = row.textContent || "";
                if (text.includes('/') && text.includes(':')) {
                  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
                  const timeMatches = text.match(/(\d{1,2}:\d{2})/g);
                  if (dateMatch && timeMatches && timeMatches.length >= 2) {
                    const extractedDate = dateMatch[1];
                    const extractedFromTime = timeMatches[0];
                    const extractedToTime = timeMatches[1];
                    const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
                    const topicParts: string[] = [];
                    for (const line of lines) {
                      if (line === extractedDate || line === extractedFromTime || line === extractedToTime) continue;
                      topicParts.push(line);
                    }
                    const html = row.outerHTML.toLowerCase();
                    const isPresent = html.includes('bg-green') || html.includes('rgb(34, 197, 94') || text.toLowerCase().includes('present');
                    recs.push({
                      subject: subName,
                      date: extractedDate,
                      fromTime: extractedFromTime,
                      toTime: extractedToTime,
                      topic: topicParts.join(' '),
                      status: isPresent ? 'Present' : 'Absent'
                    });
                  }
                }
              }
              return { recs, topRow: rows.length ? rows[0].textContent! : "" };
            }, subject);

            const newRecords = parsedData.recs.filter(nr => {
              return !masterData.some(mr => mr.subject === nr.subject && mr.date === nr.date && mr.fromTime === nr.fromTime);
            });

            masterData.push(...newRecords);
            scraped += parsedData.recs.length;

            if (masterData.filter(r => r.subject === subject).length >= expectedTotal) break;
            if (parsedData.recs.length === 0) break;

            // Click next page — like Python's _click_next_page
            hasNextPage = await page.evaluate(async (prevTop, nextPgNum) => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const nextBtn = buttons.find(b => b.textContent?.trim() === nextPgNum.toString());
              if (!nextBtn || (nextBtn as HTMLButtonElement).disabled || nextBtn.className.includes('opacity-')) return false;
              (nextBtn as HTMLElement).click();
              return true;
            }, parsedData.topRow, pageNumber + 1);

            if (hasNextPage) {
              pageNumber++;
              // Wait for page content to actually change (like Python's wait)
              await new Promise(r => setTimeout(r, 1500));
            }
          }

          send({
            step: 'scraping_subject',
            message: `${subject}: Completed — ${masterData.filter(r => r.subject === subject).length} records`,
            subject,
            currentSubjectIndex: subjectIndex,
            totalSubjects,
            page: pageNumber,
            totalPages: pageNumber,
            recordsFound: masterData.filter(r => r.subject === subject).length
          });

          // Go back — wait for page to be ready for next subject selection
          await goBack(page);
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
 * Clicks "Go Back" and waits for the subject selection page to reload.
 * Matches Python's _go_back which waits for "Select Subject For Attendance" text.
 */
async function goBack(page: any) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('Go Back'));
    if (btn) (btn as HTMLElement).click();
  });

  // Wait for the subject selection page to fully load back
  // Python does: self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Select Subject For Attendance')]")))
  try {
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('label')).some(
        l => l.textContent?.includes('Select Subjects')
      );
    }, { timeout: 10000 });
  } catch {
    // Fallback — just wait
  }
  await new Promise(r => setTimeout(r, 1000));
}
