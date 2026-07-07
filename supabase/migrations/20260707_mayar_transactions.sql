-- 1. Cabut hak akses dari fungsi publik yang lama agar tidak dieksploitasi
REVOKE EXECUTE ON FUNCTION public.upgrade_to_pro(text, boolean) FROM public, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.upgrade_to_ultimate(text, boolean) FROM public, authenticated, anon;

-- 2. Buat tabel transaksi Mayar (Idempotency + Log Audit)
CREATE TABLE IF NOT EXISTS public.mayar_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trx_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    is_yearly BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    claimed_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_mayar_trx_id ON public.mayar_transactions(trx_id);

-- Aktifkan RLS
ALTER TABLE public.mayar_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Buat RPC baru claim_upgrade untuk frontend sukses page
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

    -- Jika tidak ditemukan / tidak valid
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Hitung durasi paket
    v_days := CASE WHEN v_trx.is_yearly THEN 365 ELSE 30 END;

    -- Update profil user (upgrade)
    UPDATE public.profiles
    SET 
        plan = v_trx.plan,
        pro_expires_at = COALESCE(pro_expires_at, now()) + (v_days || ' days')::interval,
        last_payment_trx_id = p_trx_id,
        trial_ends_at = CASE WHEN v_trx.plan IN ('pro', 'ultimate') THEN NULL ELSE trial_ends_at END
    WHERE id = auth.uid();

    -- Tandai bahwa transaksi ini sudah diklaim
    UPDATE public.mayar_transactions
    SET claimed_by = auth.uid()
    WHERE id = v_trx.id;

    RETURN TRUE;
END;
$$;
