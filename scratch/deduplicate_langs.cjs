const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/context/LanguageContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find ID: { ... }
const idMatch = content.match(/ID:\s*{([\s\S]*?)},\s*EN:/);
const enMatch = content.match(/EN:\s*{([\s\S]*?)}\s*}\s*;/);

if (!idMatch || !enMatch) {
    console.error('Could not find ID or EN blocks');
    process.exit(1);
}

function deduplicate(block) {
    const lines = block.split('\n');
    const seen = new Set();
    const result = [];
    for (const line of lines) {
        const match = line.match(/^\s*['"]?(\w+)['"]?:\s*/);
        if (match) {
            const key = match[1];
            if (seen.has(key)) {
                result.push(`// DUPLICATE: ${line.trim()}`);
            } else {
                seen.add(key);
                result.push(line);
            }
        } else {
            result.push(line);
        }
    }
    return result.join('\n');
}

const newId = deduplicate(idMatch[1]);
const newEn = deduplicate(enMatch[1]);

content = content.replace(idMatch[1], newId);
content = content.replace(enMatch[1], newEn);

fs.writeFileSync(filePath, content);
console.log('Successfully deduplicated LanguageContext.jsx');
