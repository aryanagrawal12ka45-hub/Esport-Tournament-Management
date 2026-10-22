const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const rawPatterns = [
  /#[0-9a-fA-F]{3,8}\b/g,
  /rgba?\([^)]+\)/g,
  /hsl\([^)]+\)/g,
  /\b(text|bg|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}(\/[0-9]{1,3})?\b/g,
  /var\(--arena-[^)]+\)/g
];

function scanDir(dir) {
  let results = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(results, scanDir(fullPath));
    } else if (/\.(tsx?|jsx?|html)$/.test(entry.name)) {
      if (entry.name === 'tokens.css') continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = [];
      const lines = content.split('\n');
      lines.forEach((line, lineIdx) => {
        for (const pat of rawPatterns) {
          const m = line.match(pat);
          if (m) {
            matches.push({ line: lineIdx + 1, matches: m, text: line.trim() });
          }
        }
      });
      if (matches.length > 0) {
        results[path.relative(path.join(__dirname, '..'), fullPath)] = matches;
      }
    }
  }
  return results;
}

const audit = scanDir(srcDir);
let totalMatches = 0;
console.log('--- DETAILED AUDIT ---');
for (const [file, matches] of Object.entries(audit)) {
  console.log(`\n=== ${file} (${matches.length} matches) ===`);
  matches.forEach(m => console.log(`  L${m.line}: ${m.matches.join(', ')} -> ${m.text.slice(0, 80)}`));
  totalMatches += matches.length;
}
console.log(`\nTOTAL REMAINING MATCHES: ${totalMatches}`);
