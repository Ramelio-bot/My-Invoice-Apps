import fs from 'fs';

const content = fs.readFileSync('c:/My Invoice Apps/src/context/LanguageContext.jsx', 'utf8');

function cleanLocale(text, locale) {
    const startMarker = locale + ': {';
    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1) return text;
    
    // Find matching closing brace for the locale object
    let depth = 0;
    let endIdx = -1;
    const searchStart = startIdx + startMarker.length;
    for (let i = searchStart; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') {
            if (depth === 0) {
                endIdx = i;
                break;
            }
            depth--;
        }
    }
    
    if (endIdx === -1) return text;
    
    const localeBody = text.substring(searchStart, endIdx);
    const lines = localeBody.split('\n');
    const seenKeys = new Set();
    const cleanLines = [];
    
    lines.forEach(line => {
        const match = line.match(/^\s*['"]?([a-zA-Z0-9_]+)['"]?\s*:/);
        if (match) {
            const key = match[1];
            if (!seenKeys.has(key)) {
                cleanLines.push(line);
                seenKeys.add(key);
            } else {
                // Duplicate key, skip it
            }
        } else {
            // Not a key-value line (comments, empty lines, etc.), keep it IF it's not a trailing comma issue or something
            cleanLines.push(line);
        }
    });
    
    // Join lines and replace in original text
    const cleanBody = cleanLines.join('\n');
    return text.substring(0, searchStart) + cleanBody + text.substring(endIdx);
}

let cleanedContent = cleanLocale(content, 'ID');
cleanedContent = cleanLocale(cleanedContent, 'EN');

fs.writeFileSync('c:/My Invoice Apps/src/context/LanguageContext.jsx', cleanedContent);
console.log('LanguageContext.jsx has been cleaned of duplicate keys.');
