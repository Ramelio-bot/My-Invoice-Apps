import { useLocalStorage } from './useLocalStorage';

const DEFAULTS = {
    inv_prefix: 'INV',
    kwt_prefix: 'KWT',
    tt_prefix: 'TT',
    sph_prefix: 'SPH',
    po_prefix: 'PO',
    separator: '/',
    include_year: true,
    include_month: false,
    start_num: 1,
};

export function useDocSettings() {
    const [settings, setSettings] = useLocalStorage('doc_settings', DEFAULTS);

    /**
     * Build a formatted document number for a given prefix key and incrementing counter.
     * @param {'inv'|'kwt'|'tt'|'sph'|'po'} key
     * @param {number} counter - sequential number (1-based)
     */
    const buildNumber = (key, counter) => {
        const s = { ...DEFAULTS, ...settings };
        const prefix = s[`${key}_prefix`] || key.toUpperCase();
        const sep = s.separator || '/';
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const num = String(counter).padStart(3, '0');

        const parts = [prefix];
        if (s.include_year) parts.push(year);
        if (s.include_month) parts.push(month);
        parts.push(num);

        return parts.join(sep);
    };

    /** Preview example for settings UI */
    const preview = (key) => buildNumber(key, settings.start_num ?? 1);

    return { settings, setSettings, buildNumber, preview, DEFAULTS };
}
