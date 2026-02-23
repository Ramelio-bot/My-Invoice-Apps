const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
    'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];

const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
    'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

function convertHundreds(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
        const r = n % 10;
        return tens[Math.floor(n / 10)] + (r ? ' ' + ones[r] : '');
    }
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const h = hundreds === 1 ? 'Seratus' : ones[hundreds] + ' Ratus';
    return h + (rest ? ' ' + convertHundreds(rest) : '');
}

export function terbilang(amount) {
    const n = Math.floor(Math.abs(Number(amount)));
    if (n === 0) return 'Nol Rupiah';

    const parts = [];

    if (n >= 1000000000000) {
        const t = Math.floor(n / 1000000000000);
        parts.push((t === 1 ? 'Satu' : convertHundreds(t)) + ' Triliun');
        const rem = n % 1000000000000;
        if (rem > 0) parts.push(terbilangCore(rem));
    } else {
        parts.push(terbilangCore(n));
    }

    return parts.join(' ') + ' Rupiah';
}

function terbilangCore(n) {
    const parts = [];
    if (n >= 1000000000) {
        const b = Math.floor(n / 1000000000);
        parts.push((b === 1 ? 'Satu' : convertHundreds(b)) + ' Miliar');
        n = n % 1000000000;
    }
    if (n >= 1000000) {
        const m = Math.floor(n / 1000000);
        parts.push((m === 1 ? 'Satu' : convertHundreds(m)) + ' Juta');
        n = n % 1000000;
    }
    if (n >= 1000) {
        const k = Math.floor(n / 1000);
        parts.push((k === 1 ? 'Seribu' : convertHundreds(k) + ' Ribu'));
        n = n % 1000;
    }
    if (n > 0) {
        parts.push(convertHundreds(n));
    }
    return parts.join(' ');
}
