-- ====================================================================
-- Migrasi: Perbaikan Skema & RPC Pembayaran Mayar Checkout
-- Tanggal: 3 November 2026
-- Masalah yang diatasi:
--   1. Error 42703: Kolom "claimed_by" belum ada di tabel mayar_transactions
--   2. Error 42703: Kolom "last_payment_trx_id" belum ada di tabel profiles
--   3. Logika pro_expires_at agar memperhitungkan GREATEST(pro_expires_at, now())
-- ====================================================================

-- 1. Tambahkan kolom claimed_by ke mayar_transactions
ALTER TABLE public.mayar_transactions 
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_mayar_claimed_by ON public.mayar_transactions(claimed_by);

-- 2. Tambahkan kolom last_payment_trx_id ke profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_payment_trx_id TEXT;

-- 3. Perbarui RPC claim_upgrade
CREATE OR REPLACE FUNCTION public.claim_upgrade(p_trx_id text)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_trx RECORD;
    v_days INTEGER;
BEGIN
    -- Cari transaksi yang cocok, status sukses, belum diklaim
    SELECT * INTO v_trx 
    FROM public.mayar_transactions 
    WHERE trx_id = p_trx_id 
      AND status IN ('SUCCESS', 'settled')
      AND claimed_by IS NULL
    FOR UPDATE;

    -- Jika tidak ditemukan / sudah diklaim
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Hitung durasi paket (Tahunan: 365 hari, Bulanan: 30 hari)
    v_days := CASE WHEN v_trx.is_yearly THEN 365 ELSE 30 END;

    -- Update profil user (upgrade)
    UPDATE public.profiles
    SET 
        plan = v_trx.plan,
        pro_expires_at = GREATEST(COALESCE(pro_expires_at, now()), now()) + (v_days || ' days')::interval,
        last_payment_trx_id = p_trx_id,
        trial_ends_at = NULL
    WHERE id = auth.uid();

    -- Tandai bahwa transaksi ini sudah diklaim oleh user yang login
    UPDATE public.mayar_transactions
    SET claimed_by = auth.uid()
    WHERE id = v_trx.id;

    RETURN TRUE;
END;
$$;

-- 4. Berikan izin eksekusi ke authenticated & anon
GRANT EXECUTE ON FUNCTION public.claim_upgrade(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_upgrade(text) TO anon;
