// Date formatting labels
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatDateID(dateStr, lang = 'ID') {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const months = lang === 'ID' ? MONTHS_ID : MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function todayStr() {
    return new Date().toISOString().split('T')[0];
}

export function getMonthName(monthIndex, lang = 'ID') {
    const months = lang === 'ID' ? MONTHS_ID : MONTHS_EN;
    return months[monthIndex];
}

export function isToday(dateStr) {
    return dateStr === todayStr();
}

export function isThisWeek(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo && d <= now;
}

export function isThisMonth(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function getLast6Months(lang = 'ID') {
    const months = [];
    const now = new Date();
    const labels = lang === 'ID' ? MONTHS_ID : MONTHS_EN;
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: labels[d.getMonth()].slice(0, 3), month: d.getMonth(), year: d.getFullYear() });
    }
    return months;
}
