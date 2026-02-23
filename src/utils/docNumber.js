// Document number auto-increment utilities
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

export function getNextDocNumber(type) {
    const key = DOC_KEYS[type];
    const num = parseInt(localStorage.getItem(key) || '0') + 1;
    const prefix = DOC_PREFIXES[type];
    return `${prefix}-${String(num).padStart(3, '0')}`;
}

export function incrementDocNumber(type) {
    const key = DOC_KEYS[type];
    const num = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(num));
    const prefix = DOC_PREFIXES[type];
    return `${prefix}-${String(num).padStart(3, '0')}`;
}

export function peekDocNumber(type) {
    const key = DOC_KEYS[type];
    const num = parseInt(localStorage.getItem(key) || '0') + 1;
    const prefix = DOC_PREFIXES[type];
    return `${prefix}-${String(num).padStart(3, '0')}`;
}
