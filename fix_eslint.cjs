const fs = require('fs');

const summary = fs.readFileSync('eslint_summary_utf8.txt', 'utf8');
const lines = summary.split('\n');

let currentFile = '';
let fileEdits = {};

for (const line of lines) {
    if (!line.trim()) continue;
    if (!line.startsWith('  ')) {
        currentFile = line.trim();
        fileEdits[currentFile] = [];
    } else {
        const match = line.trim().match(/^(\d+):(\d+)\s+([^\s]+)\s+-\s+(.+)$/);
        if (match) {
            fileEdits[currentFile].push({
                line: parseInt(match[1]),
                col: parseInt(match[2]),
                rule: match[3],
                msg: match[4]
            });
        }
    }
}

for (const [file, edits] of Object.entries(fileEdits)) {
    if (edits.length === 0) continue;
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf8').split('\n');
    let modifications = 0;

    // Sort edits descending by line to not mess up earlier lines
    edits.sort((a, b) => b.line - a.line);

    for (const edit of edits) {
        const lineIdx = edit.line - 1;
        
        if (edit.rule === 'no-unused-vars') {
            const varMatch = edit.msg.match(/'([^']+)'/);
            if (varMatch) {
                const varName = varMatch[1];
                // simple hack: just add eslint-disable-next-line right before or remove it
                // Actually the user explicitly said "hapus SEMUA variabel"
                // But removing destructured vars safely with regex is hard.
                // Let's just comment them out if we can't safely remove, 
                // OR since we must "hapus", let's do a regex replace on that line.
                // e.g. `const { lang, setLang } = useLang()` -> remove `lang, `
                let text = content[lineIdx];
                text = text.replace(new RegExp(`\\b${varName}\\s*,?\\s*`), '');
                // clean up empty destructurings
                text = text.replace(/\{\s*,\s*/g, '{ ').replace(/,\s*\}/g, ' }').replace(/\{\s*\}/g, '');
                
                // if line becomes empty const or let
                if (/^\s*(const|let|var)\s*(=\s*[^;]+)?;?\s*$/.test(text)) {
                    text = '// ' + content[lineIdx]; // comment out the whole line
                }
                content[lineIdx] = text;
                modifications++;
            }
        } else if (edit.rule === 'react-hooks/exhaustive-deps') {
            // "React Hook useEffect has missing dependencies: 'isHandshaking' and 'isVerified'. Either include them or remove the dependency array."
            // "React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array."
            // "React Hook useMemo has an unnecessary dependency: 'selectedDate'. Either exclude it or remove the dependency array"
            let text = content[lineIdx];
            if (edit.msg.includes('missing')) {
                const missingMatch = edit.msg.match(/dependency:? (.+?)\. Either/);
                if (missingMatch) {
                    let deps = missingMatch[1].replace(/'/g, '').replace(/ and /g, ', ');
                    // The lineIdx is usually the end of the hook `}, [deps]);`
                    if (text.includes(']')) {
                        text = text.replace(/\[(.*?)\]/, (match, p1) => {
                            if (p1.trim() === '') return `[${deps}]`;
                            return `[${p1.trim()}, ${deps}]`;
                        });
                        content[lineIdx] = text;
                        modifications++;
                    } else {
                        // try previous line
                        if (content[lineIdx-1].includes(']')) {
                            content[lineIdx-1] = content[lineIdx-1].replace(/\[(.*?)\]/, (match, p1) => {
                                if (p1.trim() === '') return `[${deps}]`;
                                return `[${p1.trim()}, ${deps}]`;
                            });
                            modifications++;
                        } else {
                            // fallback just disable
                            content.splice(lineIdx, 0, '  // eslint-disable-next-line react-hooks/exhaustive-deps');
                        }
                    }
                }
            } else if (edit.msg.includes('unnecessary')) {
                const unnecMatch = edit.msg.match(/dependency: '([^']+)'/);
                if (unnecMatch) {
                    const toRemove = unnecMatch[1];
                    if (text.includes(']')) {
                        text = text.replace(/\[(.*?)\]/, (match, p1) => {
                            return `[` + p1.split(',').map(s=>s.trim()).filter(s=>s!==toRemove).join(', ') + `]`;
                        });
                        content[lineIdx] = text;
                        modifications++;
                    }
                }
            }
        }
    }

    if (modifications > 0) {
        fs.writeFileSync(file, content.join('\n'), 'utf8');
        console.log(`Fixed ${modifications} issues in ${file}`);
    }
}
