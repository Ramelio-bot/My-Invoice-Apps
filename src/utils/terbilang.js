const onesId = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
    'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];

const tensId = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
    'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

function convertHundredsId(n) {
    if (n === 0) return '';
    if (n < 20) return onesId[n];
    if (n < 100) {
        const r = n % 10;
        return tensId[Math.floor(n / 10)] + (r ? ' ' + onesId[r] : '');
    }
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const h = hundreds === 1 ? 'Seratus' : onesId[hundreds] + ' Ratus';
    return h + (rest ? ' ' + convertHundredsId(rest) : '');
}

const onesEn = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

const tensEn = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const scalesEn = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function convertHundredsEn(n) {
    if (n === 0) return '';
    if (n < 20) return onesEn[n];
    if (n < 100) {
        return tensEn[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + onesEn[n % 10] : '');
    }
    return onesEn[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertHundredsEn(n % 100) : '');
}

export function terbilang(amount, lang = 'id') {
    const n = Math.floor(Math.abs(Number(amount)));
    if (n === 0) return lang === 'id' ? 'Nol Rupiah' : 'Zero Dollars'; // Default to Dollars or just words? Let's use words + currency

    if (lang === 'id') {
        return terbilangId(n) + ' Rupiah';
    } else {
        return terbilangEn(n);
    }
}

function terbilangId(n) {
    if (n === 0) return '';
    const parts = [];
    if (n >= 1000000000000) {
        const t = Math.floor(n / 1000000000000);
        parts.push((t === 1 ? 'Satu' : convertHundredsId(t)) + ' Triliun');
        n %= 1000000000000;
    }
    if (n >= 1000000000) {
        const b = Math.floor(n / 1000000000);
        parts.push((b === 1 ? 'Satu' : convertHundredsId(b)) + ' Miliar');
        n %= 1000000000;
    }
    if (n >= 1000000) {
        const m = Math.floor(n / 1000000);
        parts.push((m === 1 ? 'Satu' : convertHundredsId(m)) + ' Juta');
        n %= 1000000;
    }
    if (n >= 1000) {
        const k = Math.floor(n / 1000);
        parts.push((k === 1 ? 'Seribu' : convertHundredsId(k) + ' Ribu'));
        n %= 1000;
    }
    if (n > 0) parts.push(convertHundredsId(n));
    return parts.join(' ');
}

function terbilangEn(n) {
    if (n === 0) return 'Zero';
    const parts = [];
    let scaleIdx = 0;
    while (n > 0) {
        const chunk = n % 1000;
        if (chunk > 0) {
            const chunkStr = convertHundredsEn(chunk);
            parts.unshift(chunkStr + (scalesEn[scaleIdx] ? ' ' + scalesEn[scaleIdx] : ''));
        }
        n = Math.floor(n / 1000);
        scaleIdx++;
    }
    return parts.join(', ');
}
