BEGIN;

CREATE OR REPLACE FUNCTION public.protect_profiles_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Mencegah user non-admin atau trigger anon/authenticated mengubah role mereka sendiri menjadi admin secara sepihak
    IF NEW.role = 'admin' AND (OLD.role IS DISTINCT FROM 'admin') AND (auth.role() <> 'service_role') THEN
        RAISE EXCEPTION 'Otorisasi Ditolak: Perubahan hak akses Admin hanya bisa dilakukan melalui Backend System!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profiles_role ON public.profiles;
CREATE TRIGGER trg_protect_profiles_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profiles_role();

COMMIT;
