export const terbilang = (angka) => {
  const b = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  let a = Math.abs(angka);
  if (a < 12) return b[a];
  if (a < 20) return terbilang(a - 10) + ' Belas';
  if (a < 100) return terbilang(Math.floor(a / 10)) + ' Puluh ' + (a % 10 !== 0 ? terbilang(a % 10) : '');
  if (a < 200) return 'Seratus ' + (a - 100 !== 0 ? terbilang(a - 100) : '');
  if (a < 1000) return terbilang(Math.floor(a / 100)) + ' Ratus ' + (a % 100 !== 0 ? terbilang(a % 100) : '');
  if (a < 2000) return 'Seribu ' + (a - 1000 !== 0 ? terbilang(a - 1000) : '');
  if (a < 1000000) return terbilang(Math.floor(a / 1000)) + ' Ribu ' + (a % 1000 !== 0 ? terbilang(a % 1000) : '');
  if (a < 1000000000) return terbilang(Math.floor(a / 1000000)) + ' Juta ' + (a % 1000000 !== 0 ? terbilang(a % 1000000) : '');
  return '';
};
