// Date formatting labels
const LOCALES = {
    ID: {
        months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
        days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    },
    EN: {
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
};

export function normalizeDateYMD(val, fallbackIso = '') {
    const pick = (input) => {
        if (!input) return '';
        if (typeof input === 'string') {
            const trimmed = input.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        }
        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('en-CA');
        }
        return '';
    };
    return pick(val) || pick(fallbackIso);
}

export function formatDateID(dateStr, lang = 'ID') {
    if (!dateStr) return '';
    const raw = String(dateStr).trim();
    const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    const months = LOCALES[lang]?.months || LOCALES.EN.months;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const raw = String(dateStr).trim();
    const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function todayStr() {
    return new Date().toLocaleDateString('en-CA');
}

export function getMonthName(monthIndex, lang = 'ID') {
    const months = LOCALES[lang]?.months || LOCALES.EN.months;
    return months[monthIndex];
}

export function isToday(dateStr) {
    if (!dateStr) return false;
    return normalizeDateYMD(dateStr) === todayStr();
}

export function isThisWeek(dateStr) {
    if (!dateStr) return false;
    const ymd = normalizeDateYMD(dateStr);
    if (!ymd) return false;
    const d = new Date(`${ymd}T00:00:00`);
    const now = new Date();
    const startOfWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return d >= startOfWindow && d <= endOfToday;
}

export function isThisMonth(dateStr) {
    if (!dateStr) return false;
    const ymd = normalizeDateYMD(dateStr);
    if (!ymd) return false;
    const d = new Date(`${ymd}T00:00:00`);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function getLast6Months(lang = 'ID') {
    const months = [];
    const now = new Date();
    const labels = LOCALES[lang]?.months || LOCALES.EN.months;
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: labels[d.getMonth()].slice(0, 3), month: d.getMonth(), year: d.getFullYear() });
    }
    return months;
}
