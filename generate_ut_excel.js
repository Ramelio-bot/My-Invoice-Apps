const ExcelJS = require('exceljs');
const path = require('path');

async function createMasterExcel() {
    const workbook = new ExcelJS.Workbook();
    
    // 1. HOME
    const shHome = workbook.addWorksheet('HOME');
    shHome.getCell('A1').value = 'MENU UTAMA KWITANSI UT';
    shHome.getCell('A1').font = { size: 20, bold: true };
    
    // 2. DB_MAHASISWA
    const shMhs = workbook.addWorksheet('DB_MAHASISWA');
    shMhs.columns = [
        { header: 'NIM', key: 'nim' },
        { header: 'Nama_Lengkap', key: 'nama' },
        { header: 'NIK', key: 'nik' },
        { header: 'Tempat_Tanggal_Lahir', key: 'ttl' },
        { header: 'No_WA', key: 'wa' },
        { header: 'Prodi', key: 'prodi' },
        { header: 'Fakultas', key: 'fakultas' },
        { header: 'UPBJJ', key: 'upbjj' },
        { header: 'Status', key: 'status' }
    ];
    shMhs.getRow(1).font = { bold: true };
    
    // Add 1 dummy data
    shMhs.addRow(['041234567', 'Budi Santoso', '320123456789', 'Jakarta, 01-01-2000', '0812345678', 'Sistem Informasi', 'FST', 'Bogor', 'Aktif']);

    // 3. LOG_TRANSAKSI
    const shLog = workbook.addWorksheet('LOG_TRANSAKSI');
    shLog.columns = [
        { header: 'No_Kwitansi', key: 'no' },
        { header: 'Tanggal_Transaksi', key: 'tgl' },
        { header: 'Petugas_TU', key: 'petugas' },
        { header: 'NIM', key: 'nim' },
        { header: 'Masa_Registrasi', key: 'masa' },
        { header: 'Komponen_Biaya', key: 'komponen' },
        { header: 'Kode_Billing', key: 'billing' },
        { header: 'Nominal', key: 'nominal' },
        { header: 'Keterangan', key: 'ket' }
    ];
    shLog.getRow(1).font = { bold: true };

    // 4. FORM_INPUT
    const shInput = workbook.addWorksheet('FORM_INPUT');
    shInput.getCell('B2').value = 'FORM INPUT KASIR TU';
    shInput.getCell('B2').font = { size: 16, bold: true };
    
    // Input Fields
    shInput.getCell('C5').value = 'No Kwitansi:';
    shInput.getCell('D5').value = 'UT-2026-0001'; // Default start
    
    shInput.getCell('C7').value = 'NIM Mahasiswa:';
    shInput.getCell('D7').value = '041234567'; // Placeholder
    
    shInput.getCell('C8').value = 'Nama:';
    shInput.getCell('D8').value = { formula: '=IFERROR(VLOOKUP(D7,DB_MAHASISWA!A:B,2,FALSE),"BELUM ADA")' };
    
    shInput.getCell('C9').value = 'Prodi:';
    shInput.getCell('D9').value = { formula: '=IFERROR(VLOOKUP(D7,DB_MAHASISWA!A:F,6,FALSE),"-")' };
    
    shInput.getCell('C13').value = 'Masa Registrasi:';
    shInput.getCell('D13').value = '2025.2';
    
    shInput.getCell('C14').value = 'Komponen Biaya:';
    shInput.getCell('D14').value = 'Uang Kuliah';
    
    shInput.getCell('C15').value = 'Nominal:';
    shInput.getCell('D15').value = 1500000;
    
    shInput.getCell('C16').value = 'Kode Billing:';
    shInput.getCell('D16').value = '1234567890';
    
    shInput.getCell('C17').value = 'Keterangan:';
    shInput.getCell('D17').value = 'Lunas';
    
    shInput.getCell('C19').value = 'Petugas TU:';
    shInput.getCell('D19').value = 'Admin TU';

    // 5. CETAK_KWITANSI
    const shCetak = workbook.addWorksheet('CETAK_KWITANSI');
    shCetak.getCell('B2').value = 'KWITANSI PEMBAYARAN UT';
    shCetak.getCell('B2').font = { size: 18, bold: true };
    
    shCetak.getCell('B4').value = 'No:';
    shCetak.getCell('C4').value = { formula: "=FORM_INPUT!D5" };
    
    shCetak.getCell('B6').value = 'Sudah Terima Dari:';
    shCetak.getCell('D6').value = { formula: "=FORM_INPUT!D8" };
    
    shCetak.getCell('B8').value = 'Sejumlah:';
    shCetak.getCell('D8').value = { formula: '=PROPER(Terbilang(FORM_INPUT!D15)) & " Rupiah"' };
    
    shCetak.getCell('B10').value = 'Untuk Pembayaran:';
    shCetak.getCell('D10').value = { formula: "=FORM_INPUT!D14 & \" Masa \" & FORM_INPUT!D13" };
    
    shCetak.getCell('B12').value = 'Terbilang:';
    shCetak.getCell('D12').value = { formula: "=FORM_INPUT!D15" };
    shCetak.getCell('D12').numFmt = '#,##0';
    
    shCetak.pageSetup.paperSize = 11; // A5
    shCetak.pageSetup.orientation = 'landscape';

    // 6. PENGATURAN
    const shSet = workbook.addWorksheet('PENGATURAN');
    shSet.getCell('A1').value = 'Daftar Prodi';
    shSet.getCell('A2').value = 'Sistem Informasi';
    shSet.getCell('A3').value = 'Ilmu Hukum';
    shSet.getCell('A4').value = 'Manajemen';
    
    shSet.getCell('C1').value = 'Daftar Komponen';
    shSet.getCell('C2').value = 'Uang Kuliah';
    shSet.getCell('C3').value = 'Pendaftaran';
    shSet.getCell('C4').value = 'Sertifikat';

    const filePath = path.join('c:\\My Invoice Apps', 'Kwitansi_UT_Master.xlsx');
    await workbook.xlsx.writeFile(filePath);
    console.log('File berhasil dibuat di: ' + filePath);
}

createMasterExcel().catch(err => console.error(err));
