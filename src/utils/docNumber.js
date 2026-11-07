// Document number auto-increment utilities (synced with Settings -> doc_settings)
const DOC_KEYS = {
    invoice: 'doc_num_invoice',
    kwitansi: 'doc_num_kwitansi',
    sph: 'doc_num_sph',
    po: 'doc_num_po',
    ttr: 'doc_num_ttr',
};

const DOC_PREFIXES = {
    invoice: 'INV',
    kwitansi: 'KWT',
    sph: 'SPH',
    po: 'PO',
    ttr: 'TTR',
};

const SETTINGS_PREFIX_KEY = {
    invoice: 'inv_prefix',
    kwitansi: 'kwt_prefix',
    sph: 'sph_prefix',
    po: 'po_prefix',
    ttr: 'tt_prefix',
};

function getCustomDocSettings() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('doc_settings');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function formatWithSettings(type, counter) {
    const custom = getCustomDocSettings();
    const fallbackPrefix = DOC_PREFIXES[type] || type.toUpperCase();
    if (!custom) {
        return `${fallbackPrefix}-${String(counter).padStart(3, '0')}`;
    }

    const prefixField = SETTINGS_PREFIX_KEY[type];
    const prefix = (prefixField && custom[prefixField]) ? custom[prefixField] : fallbackPrefix;
    const sep = custom.separator || '/';
    const now = new Date();
    const parts = [prefix];
    if (custom.include_year) parts.push(String(now.getFullYear()));
    if (custom.include_month) parts.push(String(now.getMonth() + 1).padStart(2, '0'));
    parts.push(String(counter).padStart(3, '0'));
    return parts.join(sep);
}

function computeNextCounter(type) {
    const key = DOC_KEYS[type];
    const rawStored = typeof window !== 'undefined' ? parseInt(localStorage.getItem(key) || '0', 10) : 0;
    const stored = Number.isFinite(rawStored) ? rawStored : 0;
    const custom = getCustomDocSettings();
    const startNum = Math.max(1, parseInt(custom?.start_num ?? 1, 10) || 1);
    return stored === 0 ? startNum : Math.max(stored + 1, startNum);
}

export function getNextDocNumber(type) {
    return formatWithSettings(type, computeNextCounter(type));
}

export function incrementDocNumber(type) {
    const key = DOC_KEYS[type];
    const next = computeNextCounter(type);
    if (typeof window !== 'undefined' && key) {
        localStorage.setItem(key, String(next));
    }
    return formatWithSettings(type, next);
}

export function peekDocNumber(type) {
    return formatWithSettings(type, computeNextCounter(type));
}
