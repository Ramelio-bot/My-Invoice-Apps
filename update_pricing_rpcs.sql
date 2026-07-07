-- SQL for updating RPCs to support yearly plan expiry (365 days)
-- Run this in your Supabase SQL Editor

-- 1. Update upgrade_to_pro
CREATE OR REPLACE FUNCTION public.upgrade_to_pro(p_trx_id text, p_is_yearly boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_days integer;
BEGIN
    v_days := CASE WHEN p_is_yearly THEN 365 ELSE 30 END;
    
    UPDATE public.profiles
    SET 
        plan = 'pro',
        pro_expires_at = COALESCE(pro_expires_at, now()) + (v_days || ' days')::interval,
        last_payment_trx_id = p_trx_id,
        trial_ends_at = NULL -- end trial if active
    WHERE id = auth.uid();
END;
$$;

-- 2. Keamanan Ekstra: Cegah eksploitasi RPC ini dari sisi client
REVOKE EXECUTE ON FUNCTION public.upgrade_to_pro(text, boolean) FROM public, authenticated, anon;

-- 2. Update upgrade_to_ultimate
CREATE OR REPLACE FUNCTION public.upgrade_to_ultimate(p_trx_id text, p_is_yearly boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_days integer;
BEGIN
    v_days := CASE WHEN p_is_yearly THEN 365 ELSE 30 END;

    UPDATE public.profiles
    SET 
        plan = 'ultimate',
        pro_expires_at = COALESCE(pro_expires_at, now()) + (v_days || ' days')::interval,
        last_payment_trx_id = p_trx_id,
        trial_ends_at = NULL
    WHERE id = auth.uid();
END;
$$;

-- 3. Keamanan Ekstra: Cegah eksploitasi RPC ini dari sisi client
REVOKE EXECUTE ON FUNCTION public.upgrade_to_ultimate(text, boolean) FROM public, authenticated, anon;
