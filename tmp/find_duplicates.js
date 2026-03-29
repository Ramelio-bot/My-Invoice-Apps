import fs from 'fs';

const content = fs.readFileSync('c:/My Invoice Apps/src/context/LanguageContext.jsx', 'utf8');

function findDuplicates(text, locale) {
    const startIdx = text.indexOf(locale + ': {');
    if (startIdx === -1) return [];
    
    // Find matching closing brace
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx + locale.length + 3; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') {
            if (depth === 0) {
                endIdx = i;
                break;
            }
            depth--;
        }
    }
    
    if (endIdx === -1) return [];
    
    const localeContent = text.substring(startIdx, endIdx);
    const lines = localeContent.split('\n');
    const keys = {};
    const duplicates = [];
    
    lines.forEach((line, index) => {
        const match = line.match(/^\s*['"]?([a-zA-Z0-9_]+)['"]?\s*:/);
        if (match) {
            const key = match[1];
            if (keys[key]) {
                duplicates.push({ key, line: startIdx + index + 1 }); // Approximate line in original file
            } else {
                keys[key] = true;
            }
        }
    });
    
    return duplicates;
}

const idDuplicates = findDuplicates(content, 'ID');
const enDuplicates = findDuplicates(content, 'EN');

console.log('ID Duplicates:', idDuplicates);
console.log('EN Duplicates:', enDuplicates);
