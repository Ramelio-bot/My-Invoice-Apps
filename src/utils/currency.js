// Format currency
export function formatIDR(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(amount));
}

export function formatCurrency(amount, currency = 'IDR') {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    const localeMap = { IDR: 'id-ID', USD: 'en-US', EUR: 'de-DE', SGD: 'en-SG' };
    return new Intl.NumberFormat(localeMap[currency] || 'id-ID', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number(amount));
}

export function parseCurrency(str) {
    if (typeof str === 'number') return str;
    return parseFloat(String(str).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

export function formatNumber(n) {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}
