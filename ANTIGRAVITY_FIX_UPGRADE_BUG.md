# PROMPT UNTUK ANTIGRAVITY — FIX MY INVOICE BUG KRITIS (upgrade RPC)

Kamu adalah engineer Supabase/Postgres. Tugas: FIX 1 bug kritis di My Invoice
tanpa merusak yang sudah jalan. PROYEK: Supabase + React/Vite + Capacitor Android.
Lokasi source: C:\My Invoice Apps\

## BUG KRITIS (temuan audit Hermes, 18 Jul 2026)
File: update_pricing_rpcs.sql (baris 5-47)
Fungsi: public.upgrade_to_pro(p_trx_id text, p_is_yearly boolean)
        public.upgrade_to_ultimate(p_trx_id text, p_is_yearly boolean)

MASALAH: Kedua RPC pakai SECURITY DEFINER (bypass RLS) tapi TIDAK memverifikasi
bahwa p_trx_id benar-benar ada di tabel payments dengan status='paid'.
DAMPAK: user bisa panggil RPC dgn trx_id sembarang -> plan naik ke pro/ultimate GRATIS
tanpa membayar. Ini kebocoran revenue.

## YANG SUDAH AMAN (JANGAN UBAH / JANGAN RUSAK)
- process_sale SUDAH punya server-side price validation (base_schema_staging.sql:279-309)
- Trigger tr_protect_profiles_plan SUDAH ada (security_hardening.sql:101-122)
  -> mencegah UPDATE plan langsung dr client. TAPI RPC SECURITY DEFINER tetap
  bisa set plan tanpa cek bayar -> itu yg harus ditambal.
- Frontend cuma pakai anon key (VITE_*), gak ada service_role di client.

## TUGAS
1. Baca C:\My Invoice Apps\update_pricing_rpcs.sql
2. Baca C:\My Invoice Apps\supabase\migrations\security_hardening.sql (lihat pola trigger)
3. Perbaiki upgrade_to_pro & upgrade_to_ultimate:
   - TAMBAH verifikasi: SELECT EXISTS(SELECT 1 FROM payments WHERE trx_id=p_trx_id AND status='paid')
   - Jika tidak valid -> RAISE EXCEPTION 'Unauthorized: payment not verified'
   - Baru lanjut UPDATE profiles SET plan=...
4. Pastikan tetap SECURITY DEFINER + filter WHERE id=auth.uid()
5. Buat file migrasi BARU (jangan overwrite yang lama):
   supabase/migrations/fix_upgrade_payment_verify.sql
   Isi: CREATE OR REPLACE FUNCTION upgrade_to_pro/ultimate dgn pengecekan payment.
6. JANGAN ubah process_sale, JANGAN ubah trigger protect_profiles_plan.
7. Test: simulasi panggil RPC dgn trx_id acak -> harus GAGAL (exception).
   Panggil dgn trx_id valid (status paid) -> harus SUKSES.

## DELIVERABLE
- File fix_upgrade_payment_verify.sql (migrasi baru)
- Penjelasan singkat: apa yg diubah + cara test
- LAPORKAN ke user/Hermes (jangan auto-run di production tanpa konfirmasi)

## BOUNDARY
Hermes = auditor (gak edit code). Kamu (Antigravity) yg tulis + test di staging.
User yg setuju sebelum apply ke production.
