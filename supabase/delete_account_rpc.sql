-- SQL script for deleting user account and associated data

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
  
  -- Hapus profil dari tabel profiles
  DELETE FROM profiles WHERE id = uid;
  
  -- Account pada tabel auth.users dihapus. Ini memerlukan SECURITY DEFINER 
  -- karena default PostgreSQL RLS akan melarang client biasa menghapus auth.users.
  DELETE FROM auth.users WHERE id = uid;
END;
$$;
