# Panduan Deploy Lokal - My Invoice Apps

Ikuti langkah-langkah simpel berikut untuk menjalankan aplikasi di komputer lokal Anda:

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js** (versi 18 ke atas direkomendasikan).

### 2. Instalasi Dependensi
Buka terminal di folder project ini, lalu jalankan:
```bash
npm install
```

### 3. Konfigurasi Environment (PENTING)
Buat file bernama `.env` di root folder (sejajar dengan `package.json`). Isi dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
> [!NOTE]
> Anda bisa mendapatkan URL dan Key ini dari dashboard Supabase di bagian **Project Settings > API**.

### 4. Menjalankan Aplikasi
Setelah instalasi selesai dan `.env` sudah siap, jalankan perintah:
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang muncul di terminal).

---
### Tips Tambahan:
- Jika ada error terkait "Module not found", coba hapus folder `node_modules` dan jalankan `npm install` kembali.
- Pastikan koneksi internet stabil karena aplikasi terhubung langsung ke database Supabase.
