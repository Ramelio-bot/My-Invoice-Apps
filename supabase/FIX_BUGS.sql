-- BUG 2 FIX: Ensure handle_new_user strictly applies interval '14 days'
-- Execute this on Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, role, trial_ends_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'free',
    'user',
    now() + interval '14 days'
  );
  RETURN new;
END;
$$;


-- BUG 3 FIX: Ensure delete_user_account drops EVERYTHING from the database side (for redundancy)
-- Execute this on Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();
  
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Protectively wipe all tables that might have user_id
  DELETE FROM documents WHERE user_id = uid;
  DELETE FROM clients WHERE user_id = uid;
  DELETE FROM cashbook WHERE user_id = uid;
  DELETE FROM hpp_records WHERE user_id = uid;
  DELETE FROM download_logs WHERE user_id = uid;
  
  DELETE FROM profiles WHERE id = uid;
  
  DELETE FROM auth.users WHERE id = uid;
END;
$$;
