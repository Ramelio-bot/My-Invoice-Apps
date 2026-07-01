-- ============================================================
-- 🛡️ ULTIMATE SYSTEM HARDENING V2 (HOTFIXED)
-- MyInvoice.space - DevSecOps Migration Script
-- ============================================================

-- Jalankan di dalam Transaction Block untuk pengujian aman.
-- Jika ingin commit permanen, ganti ROLLBACK; di baris paling bawah menjadi COMMIT;
BEGIN;

-- ─────────────────────────────────────────────────────────────
-- BLOK 1: Pengetatan Fungsi Stok (decrease_kasir_stock)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrease_kasir_stock(product_id UUID, qty INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.kasir_products
  SET stock = GREATEST(0, stock - qty), updated_at = NOW()
  WHERE id = product_id 
    AND user_id = auth.uid(); -- Kunci kepemilikan sah!
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- BLOK 2: Cabut Jalur Ganda Upgrade Plan (REVOKE EXECUTE)
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.upgrade_to_pro(text, boolean) FROM public, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.upgrade_to_ultimate(text, boolean) FROM public, authenticated, anon;


-- ─────────────────────────────────────────────────────────────
-- BLOK 3: Kriptografi Hashing PIN Karyawan Kasir (pgcrypto)
-- ─────────────────────────────────────────────────────────────

-- 3A. Aktifkan ekstensi kriptografi jika belum ada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3B. Rombak fungsi verifikasi PIN menggunakan hashing alg. Blowfish (crypt)
CREATE OR REPLACE FUNCTION public.verify_employee_pin(
  p_employee_id UUID, 
  p_entered_pin TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_db_pin_hash TEXT;
BEGIN
  SELECT pin INTO v_db_pin_hash FROM public.kasir_employees WHERE id = p_employee_id;
  
  -- Jika pin belum diset, atau kosong, return false
  IF v_db_pin_hash IS NULL OR v_db_pin_hash = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Komparasi aman satu arah berbasis kriptografi server-side
  RETURN (v_db_pin_hash = crypt(p_entered_pin, v_db_pin_hash));
END;
$$;

-- 3C. Trigger Auto-Hash PIN saat frontend melakukan Insert/Update PIN plain text
CREATE OR REPLACE FUNCTION public.hash_kasir_employee_pin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- [HOTFIX] Cegah PIN berubah menjadi NULL jika frontend mengosongkan field saat update nama/role
    IF NEW.pin IS NULL OR NEW.pin = '' THEN
        IF TG_OP = 'UPDATE' THEN
            NEW.pin := OLD.pin; -- Pertahankan PIN lama yang sudah terhash
        ELSE
            RAISE EXCEPTION 'PIN karyawan tidak boleh kosong!';
        END IF;
        RETURN NEW;
    END IF;

    -- Lakukan hashing jika data berupa string baru dan belum di-hash sebelumnya ($2a$)
    IF (TG_OP = 'INSERT') OR (NEW.pin IS DISTINCT FROM OLD.pin) THEN
        IF NEW.pin NOT LIKE '$2a$%' THEN
            NEW.pin := crypt(NEW.pin, gen_salt('bf', 8));
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hash_kasir_employee_pin ON public.kasir_employees;
CREATE TRIGGER trg_hash_kasir_employee_pin
BEFORE INSERT OR UPDATE ON public.kasir_employees
FOR EACH ROW EXECUTE FUNCTION public.hash_kasir_employee_pin();

-- 3D. Migrasi data eksisting: Hash semua PIN yang masih berupa Plain Text
UPDATE public.kasir_employees
SET pin = crypt(pin, gen_salt('bf', 8))
WHERE pin IS NOT NULL AND pin <> '' AND pin NOT LIKE '$2a$%';

-- Akhir dari blok transaksi. Untuk pengetesan awal biarkan ROLLBACK;
-- Ubah ke COMMIT; bila Anda sudah yakin eksekusi berhasil tanpa error.
ROLLBACK;
