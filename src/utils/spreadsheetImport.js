/**
 * Shared dynamic Excel (.xlsx/.xls) and CSV parser & template generator.
 * Uses dynamic import('xlsx') so the main application bundle remains lightweight.
 */

const normalizeHeader = (text) => String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Parse currency / quantity strings safely into numbers (handles "Rp 25.000", "25,000", etc.).
 */
export function parseSpreadsheetNumber(value, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const raw = String(value ?? '').trim();
    if (!raw) return fallback;
    // Strip currency prefix and whitespace
    let cleaned = raw.replace(/rp/gi, '').replace(/\s+/g, '');
    // Handle Indonesian thousand separator dots (e.g. 25.000 or 1.250.000) without decimals
    if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        cleaned = cleaned.replace(/\./g, '');
    } else if (/^-?\d{1,3}(,\d{3})+$/.test(cleaned)) {
        cleaned = cleaned.replace(/,/g, '');
    } else {
        cleaned = cleaned.replace(/,/g, '.');
    }
    const parsed = Number(cleaned.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Read a spreadsheet file and map headers against fieldAliases:
 *   { targetField: ['alias1', 'alias2', ...], ... }
 * Returns { rows, totalRows, skippedEmpty }.
 */
export async function parseSpreadsheetFile(file, fieldAliases) {
    const { read, utils } = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        return { rows: [], totalRows: 0, skippedEmpty: 0 };
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const rawObjects = utils.sheet_to_json(worksheet, { defval: '' });

    const aliasMap = {};
    for (const [targetKey, aliases] of Object.entries(fieldAliases)) {
        aliasMap[targetKey] = [normalizeHeader(targetKey), ...aliases.map(normalizeHeader)];
    }

    const mappedRows = [];
    let skippedEmpty = 0;

    for (const rawRow of rawObjects) {
        const normalizedRow = {};
        for (const [k, v] of Object.entries(rawRow)) {
            normalizedRow[normalizeHeader(k)] = v;
        }

        const item = {};
        let hasAnyValue = false;

        for (const [targetKey, normAliases] of Object.entries(aliasMap)) {
            let foundVal = '';
            for (const alias of normAliases) {
                if (normalizedRow[alias] !== undefined && String(normalizedRow[alias]).trim() !== '') {
                    foundVal = normalizedRow[alias];
                    hasAnyValue = true;
                    break;
                }
            }
            item[targetKey] = typeof foundVal === 'string' ? foundVal.trim() : foundVal;
        }

        if (hasAnyValue) {
            mappedRows.push(item);
        } else {
            skippedEmpty++;
        }
    }

    return { rows: mappedRows, totalRows: rawObjects.length, skippedEmpty };
}

/**
 * Generate and download a clean .xlsx import template file.
 */
export async function downloadSpreadsheetTemplate(filename, sheetName, sampleRows) {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.json_to_sheet(sampleRows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, sheetName);
    writeFile(wb, filename);
}
