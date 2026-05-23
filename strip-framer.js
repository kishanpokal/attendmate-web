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
  'src/components/sync/SyncStats.tsx',
  'src/hooks/useScrollAnimation.ts'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove imports
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]framer-motion['"];?\r?\n/g, '');
  
  // Replace <motion.div to <div
  content = content.replace(/<motion\.([a-zA-Z]+)/g, '<$1');
  
  // Replace </motion.div> to </div>
  content = content.replace(/<\/motion\.([a-zA-Z]+)>/g, '</$1');

  // Remove AnimatePresence wrappers (just delete the lines)
  content = content.replace(/<AnimatePresence[^>]*>/g, '');
  content = content.replace(/<\/AnimatePresence>/g, '');

  // Remove motion props (initial, animate, exit, transition, layoutId, whileHover, whileTap)
  // This is a naive regex but usually works for simple props
  content = content.replace(/\s+(initial|animate|exit|transition|layoutId|whileHover|whileTap|layout|mode)=\{[\s\S]*?\}(?=\s|>)/g, '');
  
  // If the prop is a simple string layoutId="xyz"
  content = content.replace(/\s+layoutId=["'][^"']+["']/g, '');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Cleaned ${file}`);
});
