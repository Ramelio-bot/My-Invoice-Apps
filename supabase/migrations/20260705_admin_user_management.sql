CREATE OR REPLACE FUNCTION public.admin_manage_user(
    p_target_user_id UUID,
    p_action TEXT,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
BEGIN
    v_caller_id := auth.uid();
    
    -- Validasi wajib: Hanya Admin terautentikasi yang boleh mengeksekusi
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RAISE EXCEPTION '🚨 FORBIDDEN: Anda tidak memiliki hak akses Admin untuk mengubah data user!';
    END IF;

    -- Eksekusi Aksi Berdasarkan Parameter p_action
    IF p_action = 'updatePlan' THEN
        UPDATE public.profiles 
        SET plan = (p_payload->>'plan'),
            pro_expires_at = CASE WHEN (p_payload->>'plan') != 'free' THEN NOW() + INTERVAL '1 year' ELSE NULL END
        WHERE id = p_target_user_id;
        
    ELSIF p_action = 'setAdmin' THEN
        UPDATE public.profiles SET role = 'admin' WHERE id = p_target_user_id;
        
    ELSIF p_action = 'removeAdmin' THEN
        UPDATE public.profiles SET role = 'user' WHERE id = p_target_user_id;
        
    ELSIF p_action = 'deleteUser' THEN
        DELETE FROM public.profiles WHERE id = p_target_user_id;
    ELSE
        RAISE EXCEPTION '🚨 INVALID_ACTION: Aksi manajemen tidak dikenali.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Buat tabel global di database untuk mencatat limitasi telegram
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    telegram_id TEXT PRIMARY KEY,
    hit_count INT DEFAULT 1,
    last_reset TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.increment_telegram_rate_limit(p_telegram_id TEXT)
RETURNS INT AS $$
DECLARE
    v_hit_count INT;
BEGIN
    INSERT INTO public.api_rate_limits (telegram_id, hit_count, last_reset)
    VALUES (p_telegram_id, 1, NOW())
    ON CONFLICT (telegram_id) DO UPDATE
    SET hit_count = CASE 
            WHEN NOW() - public.api_rate_limits.last_reset > INTERVAL '60 seconds' THEN 1 
            ELSE public.api_rate_limits.hit_count + 1 
        END,
        last_reset = CASE 
            WHEN NOW() - public.api_rate_limits.last_reset > INTERVAL '60 seconds' THEN NOW() 
            ELSE public.api_rate_limits.last_reset 
        END
    RETURNING hit_count INTO v_hit_count;

    RETURN v_hit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_manage_user(uuid, text, jsonb) TO authenticated;
