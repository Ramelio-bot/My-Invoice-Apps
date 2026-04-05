// Format currency
export function formatIDR(amount, lang = 'ID') {
    if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
    const locale = String(lang).toLowerCase() === 'en' ? 'en-US' : 'id-ID';
    return new Intl.NumberFormat(locale, {
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
    const s = String(str).trim();
    // Format Indonesia: titik = pemisah ribuan, koma = desimal
    const cleaned = s
        .replace(/[^\d.,]/g, '')   // hapus semua kecuali angka, titik, koma
        .replace(/\./g, '')         // hapus titik (pemisah ribuan)
        .replace(',', '.');         // ganti koma jadi titik desimal
    return parseFloat(cleaned) || 0;
}

export function formatNumber(n) {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}

export function formatCompactCurrency(amount) {
    if (!amount || isNaN(amount)) return 'Rp 0';
    const val = Number(amount);
    
    // Thresholds adjusted for rounding (e.g., 999,950,000 rounds to 1.0 Miliar)
    if (val >= 999_950_000) {
        const b = val / 1_000_000_000;
        return `Rp ${b.toFixed(1).replace('.0', '')} M`;
    }
    if (val >= 999_950) {
        const m = val / 1_000_000;
        return `Rp ${m.toFixed(1).replace('.0', '')} Jt`;
    }
    if (val >= 999.5) {
        const k = val / 1_000;
        return `Rp ${k.toFixed(1).replace('.0', '')} Rb`;
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);
}

// Format number with thousand separators for input fields
export function formatInputNumber(val) {
    if (val === '' || val === null || val === undefined) return '';
    const num = String(val).replace(/\./g, '').replace(/[^\d]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(num, 10));
}

