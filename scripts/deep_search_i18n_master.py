import os
import re
import json

SOURCE_DIR = os.path.join(os.path.dirname(__file__), '..', 'src')

ID_WORDS = [
    r'\b(dan|atau|untuk|dengan|dari|ke|di|pada|yang|adalah|ini|itu|bisa|tidak|belum|sudah)\b',
    r'\b(gratis|bayar|tagihan|faktur|kasir|toko|produk|pesanan|laporan|pengaturan|pelanggan)\b',
    r'\b(tambah|hapus|ubah|simpan|batal|kembali|masuk|keluar|unduh|cetak|kirim|lihat)\b',
    r'\b(bulan|hari|tahun|minggu|lunas|menunggu|jatuh tempo|diskon|pajak|kembalian)\b',
    r'\b(halaman|bantuan|tutorial|syarat|ketentuan|kebijakan|panduan|catatan|rekening)\b'
]
REGEX_ID = re.compile('|'.join(ID_WORDS), re.IGNORECASE)

findings = []

for root, dirs, files in os.walk(SOURCE_DIR):
    if any(skip in root for skip in ['node_modules', '.git', 'dist', 'build']):
        continue
    for f in files:
        if f.endswith(('.jsx', '.js')) and f != 'LanguageContext.jsx':
            filepath = os.path.join(root, f)
            relpath = os.path.relpath(filepath, SOURCE_DIR).replace('\\', '/')
            
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                lines = fp.readlines()
                
            for idx, line in enumerate(lines):
                line_str = line.strip()
                if line_str.startswith(('//', '/*', '*', 'import ')):
                    continue
                if REGEX_ID.search(line_str):
                    findings.append({
                        'file': relpath,
                        'line': idx + 1,
                        'snippet': line_str[:140]
                    })

output_path = os.path.join(os.path.dirname(__file__), '..', 'i18n_audit_findings.json')
with open(output_path, 'w', encoding='utf-8') as out:
    json.dump(findings, out, indent=2, ensure_ascii=False)

print(f"Pemindaian selesai! Ditemukan {len(findings)} baris di {len(set(x['file'] for x in findings))} file.")
print(f"Hasil lengkap disimpan di: {os.path.abspath(output_path)}")
