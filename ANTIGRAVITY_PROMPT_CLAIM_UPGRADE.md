# PROMPT UNTUK ANTIGRAVITY — FIX GRANT RPC `claim_upgrade` (Revenue Leak)

Kamu adalah engineer Supabase / PostgreSQL. Tugas: **ANALISA + FIX 1 bug kritis** di My Invoice
tanpa mengubah code/fitur lain yang sudah jalan.
LOKASI SOURCE: `C:\My Invoice Apps\`
STACK: Supabase (Postgres) + React/Vite + Capacitor Android. Frontend cuma pakai **anon key** (VITE_*),
jadi semua RPC yang dipanggil browser HARUS di-grant ke role `authenticated`.

> ⚠️ JANGAN ikut prompt lama `ANTIGRAVITY_FIX_UPGRADE_BUG.md` — itu sudah KADALUARSA.
> Fungsi `upgrade_to_pro` / `upgrade_to_ultimate` sudah di-DROP dan diganti `claim_upgrade`.

---

## BUG KRITIS (temuan audit Hermes, 20 Jul 2026)

**Gejala:** User BAYAR via Mayar → webhook sukses catat ke `mayar_transactions` →
frontend (`src/pages/ProSuccess.jsx` & `src/pages/UltimateSuccess.jsx`) memanggil
`supabase.rpc('claim_upgrade', { p_trx_id })` → **GAGAL dengan error
"permission denied for function claim_upgrade"** → kolom `profiles.plan` TETAP `free`.
Uang masuk, akses PRO/ULTIMATE tidak keluar = revenue leak + komplain pelanggan.

**Akar masalah:** Fungsi `public.claim_upgrade(p_trx_id text)` dibuat di migrasi
`supabase/migrations/20260707_mayar_transactions.sql` **TANPA `GRANT EXECUTE`**.
Di Supabase/Postgres, fungsi baru default-nya hanya bisa di-execute oleh pemilik (postgres).
Role `authenticated` (yang dipakai frontend lewat anon key) TIDAK otomatis dapat akses.

**Bukti di repo:** Grep seluruh `*.sql` hanya menemukan 1 grant →
`GRANT EXECUTE ON FUNCTION public.activate_pro_trial() TO authenticated;`
(security_hardening.sql:147). Tidak ada grant untuk `claim_upgrade`.

---

## LANGKAH KERJA (WAJIB URUTAN INI)

### 1. VERIFIKASI DULU (jangan langsung fix buta)
Jalankan di Supabase SQL Editor (atau via psql ke DB staging):
```sql
-- Cek apakah fungsi ada & signature-nya
SELECT routine_name, routine_arguments
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'claim_upgrade';

-- Cek grant EXECUTE untuk role authenticated
SELECT grantee, routine_name, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' AND routine_name = 'claim_upgrade';

-- Atau cek langsung hak role authenticated
SELECT has_function_privilege(
  'authenticated',
  'public.claim_upgrade(text)'::regprocedure,
  'EXECUTE'
) AS can_exec;
```
Konfirmasi: `has_function_privilege` = **false** (atau baris grant untuk `authenticated` kosong).
Jika sudah true → STOP, laporkan bahwa grant sudah ada (mungkin sudah di-fix orang lain) dan jangan ubah apa-apa.

### 2. ANALISA RPCs LAIN yang dipanggil frontend tapi mungkin kelewat grant
Ini bagian "analisa" — cari semua pemanggilan `supabase.rpc('...')` di `src/`, lalu
cross-check ke `information_schema.routine_privileges`. Laporkan di output:
- Daftar RPC yang dipanggil frontend.
- Mana yang SUDAH di-grant ke `authenticated` (aman).
- Mana yang BELUM di-grant (harus di-fix juga, jangan cuma `claim_upgrade`).
Gunakan ini untuk ngecek kebocoran grant serupa sebelum di-deploy.

### 3. FIX (hanya jika step 1 konfirmasi grant hilang)
Jalankan:
```sql
GRANT EXECUTE ON FUNCTION public.claim_upgrade(text) TO authenticated;
```
Dan untuk RPC lain yang ketahuan kelewat di step 2, grant juga ke `authenticated`
dengan signature yang benar (cek `routine_arguments` dulu).

> CATATAN: Ini adalah DB DDL, bukan file code. Tidak perlu ubah `*.js`/`*.tsx`.
> Jangan sentuh `process_sale`, `activate_pro_trial`, trigger `tr_protect_profiles_plan`,
> atau fungsi lain yang sudah jalan.

### 4. TEST
```sql
-- Test 1: hak authenticated sekarang harus TRUE
SELECT has_function_privilege('authenticated','public.claim_upgrade(text)'::regprocedure,'EXECUTE');

-- Test 2: panggil dengan trx_id tidak valid -> harus return FALSE (bukan error)
SELECT public.claim_upgrade('trx_yang_tidak_ada_123');

-- Test 3 (OPSIONAL, butuh row dummy di mayar_transactions dgn status SUCCESS & claimed_by NULL):
-- INSERT dummy, lalu panggil claim_upgrade(dummy_trx) -> harus return TRUE & profiles.plan naik.
```
Di sisi aplikasi: simulasikan flow bayar (atau pakai akun test) → pastikan `ProSuccess.jsx`
tidak lempar error permission dan `profiles.plan` benar-benar berubah jadi `pro`/`ultimate`.

---

## DELIVERABLE (laporkan ke user / Hermes)
1. Hasil step 1 (bukti grant hilang / atau sudah ada).
2. Hasil analisa step 2 (daftar RPC frontend + status grant masing-masing).
3. SQL yang dijalankan di step 3.
4. Hasil test step 4.
5. Konfirmasi: apakah rantai upgrade (bayar → webhook → claim_upgrade → plan naik) sudah utuh.

## BOUNDARY
- Hermes = auditor (tidak edit code). **Kamu (Antigravity)** yang jalankan SQL & test.
- Ini mengubah DB produksi → jika ada akses staging, **FIX & TEST di staging dulu**,
  lalu LAPORKAN. Jangan auto-apply ke production tanpa konfirmasi user.
- Jangan ikut prompt lama `ANTIGRAVITY_FIX_UPGRADE_BUG.md` (stale — fungsi sudah di-drop).
- Jangan ubah file source kecuali diperlukan untuk test; fokus ke grant DB.
