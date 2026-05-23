const fs = require('fs');
const path = require('path');

const files = [
  'src/components/AICopilot.tsx',
  'src/components/dashboard/AttendanceSummaryCard.tsx',
  'src/components/landing/SmoothNav.tsx',
  'src/components/sync/ErrorView.tsx',
  'src/components/sync/LiveLogFeed.tsx',
  'src/components/sync/OverallProgressBar.tsx',
  'src/components/sync/StepTracker.tsx',
  'src/components/sync/SubjectProgressList.tsx',
  'src/components/sync/SyncStats.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace </div followed by non-word char (like newline or EOF) but not >
  // Actually, we can just replace `</div` with `</div>` if it's not already `</div>`
  content = content.replace(/<\/div(?!>)/g, '</div>');
  content = content.replace(/<\/span(?!>)/g, '</span>');
  content = content.replace(/<\/button(?!>)/g, '</button>');
  content = content.replace(/<\/p(?!>)/g, '</p>');
  content = content.replace(/<\/a(?!>)/g, '</a>');
  content = content.replace(/<\/nav(?!>)/g, '</nav>');
  content = content.replace(/<\/ul(?!>)/g, '</ul>');
  content = content.replace(/<\/li(?!>)/g, '</li>');

  fs.writeFileSync(fullPath, content, 'utf8');
});
console.log("Fixed broken tags.");
