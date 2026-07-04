-- SQL script for deleting user account and associated data

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
BEGIN
  -- Ambil ID user yang sedang login dan melakukan request
  uid := auth.uid();
  
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Hapus data dari tabel-tabel terkait yang mereferensikan user_id
  -- Meskipun sudah ada ON DELETE CASCADE pada set up tabel, ini double protection
  DELETE FROM documents WHERE user_id = uid;
  DELETE FROM clients WHERE user_id = uid;
  DELETE FROM cashbook WHERE user_id = uid;
  DELETE FROM hpp_records WHERE user_id = uid;
  DELETE FROM download_logs WHERE user_id = uid;
  
  -- Soft-delete user profile to keep auth.users intact
  UPDATE profiles SET deleted_at = NOW() WHERE id = uid;
  
  -- We do not DELETE FROM auth.users anymore to comply with Supabase Auth Admin API constraints
END;
$$;
