const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
      walk(fullPath, results);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      if (entry.name === 'fix-corruption.cjs') continue;
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk('src');
let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const hadBOM = content.charCodeAt(0) === 0xFEFF;
  if (hadBOM) {
    content = content.substring(1);
  }
  if (content.includes('n`n')) {
    const fixed = content.replace(/n`n/g, '');
    fs.writeFileSync(file, fixed, hadBOM ? { flag: 'w' } : 'utf8');
    if (hadBOM) {
      fs.writeFileSync(file, '\uFEFF' + fixed, 'utf8');
    } else {
      fs.writeFileSync(file, fixed, 'utf8');
    }
    fixedCount++;
    console.log('Fixed: ' + file);
  }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
