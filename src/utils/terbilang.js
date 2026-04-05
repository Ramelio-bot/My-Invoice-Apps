const terbilangID = (angka) => {
  const b = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  let a = Math.abs(angka);
  if (a < 12) return b[a];
  if (a < 20) return terbilangID(a - 10) + ' Belas';
  if (a < 100) return terbilangID(Math.floor(a / 10)) + ' Puluh ' + (a % 10 !== 0 ? terbilangID(a % 10) : '');
  if (a < 200) return 'Seratus ' + (a - 100 !== 0 ? terbilangID(a - 100) : '');
  if (a < 1000) return terbilangID(Math.floor(a / 100)) + ' Ratus ' + (a % 100 !== 0 ? terbilangID(a % 100) : '');
  if (a < 2000) return 'Seribu ' + (a - 1000 !== 0 ? terbilangID(a - 1000) : '');
  if (a < 1000000) return terbilangID(Math.floor(a / 1000)) + ' Ribu ' + (a % 1000 !== 0 ? terbilangID(a % 1000) : '');
  if (a < 1000000000) return terbilangID(Math.floor(a / 1000000)) + ' Juta ' + (a % 1000000 !== 0 ? terbilangID(a % 1000000) : '');
  return '';
};

const terbilangEN = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  let n = Math.abs(num);
  if (n === 0) return '';
  
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + terbilangEN(n % 10) : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + terbilangEN(n % 100) : '');
  if (n < 1000000) return terbilangEN(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + terbilangEN(n % 1000) : '');
  if (n < 1000000000) return terbilangEN(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + terbilangEN(n % 1000000) : '');
  return '';
};

export const terbilang = (angka, lang = 'id') => {
  const l = String(lang).toLowerCase();
  if (l === 'en') {
    const result = terbilangEN(angka);
    return result || 'Zero';
  }
  const result = terbilangID(angka);
  return result || '';
};
