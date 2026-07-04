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
RETURNS VOID AS $$
BEGIN
    -- Lakukan penguncian baris baris di level database
    PERFORM hit_count FROM public.api_rate_limits WHERE telegram_id = p_telegram_id FOR UPDATE;
    
    UPDATE public.api_rate_limits 
    SET hit_count = hit_count + 1 
    WHERE telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
