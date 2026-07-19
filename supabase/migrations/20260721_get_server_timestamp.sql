-- ==============================================================================
-- 🕰️ MIGRATION: GET SERVER TIMESTAMP
-- ==============================================================================
-- Tujuan: Membuat fungsi RPC get_server_timestamp() untuk melindungi
-- frontend (PlanContext dan Kasir) dari eksploitasi manipulasi jam lokal
-- di perangkat user.

CREATE OR REPLACE FUNCTION public.get_server_timestamp()
RETURNS TIMESTAMPTZ 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    RETURN now();
END;
$$;

-- Memberikan izin eksekusi kepada user yang terautentikasi dan anon
-- karena fungsi ini mungkin dipanggil di halaman awal sebelum state auth ter-resolve sepenuhnya
GRANT EXECUTE ON FUNCTION public.get_server_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_server_timestamp() TO anon;
