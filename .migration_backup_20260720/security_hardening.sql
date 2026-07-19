-- Migration: Security Hardening for public.process_sale and public.profiles plan column
-- Created: 2026-07-01
-- Target: Supabase / PostgreSQL Database

-- 1. HARDEN process_sale FUNCTION (Server-Side Price Validation)
CREATE OR REPLACE FUNCTION public.process_sale(
  p_outlet_id UUID,
  p_user_id UUID,
  p_items JSONB,
  p_total INTEGER,
  p_subtotal INTEGER,
  p_payment_method TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transaction_id UUID;
  v_receipt_number TEXT;
  v_item JSONB;
  v_item_id UUID;
  v_item_qty INT;
  v_current_price INT;
  v_server_calculated_subtotal INT := 0;
  v_server_calculated_total INT := 0;
  v_discount INT := 0;
BEGIN
  -- Validasi Tenant
  IF p_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: User ID mismatch';
  END IF;

  -- 1. Validasi Harga Sisi Server (Server-Side Price Cross-Check)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      v_item_id := (v_item->>'product_id')::uuid;
      v_item_qty := (v_item->>'qty')::int;
      
      -- Ambil harga riil dari database
      SELECT price INTO v_current_price 
      FROM public.kasir_products 
      WHERE id = v_item_id AND user_id = auth.uid();
      
      IF v_current_price IS NULL THEN
          RAISE EXCEPTION 'Product not found or unauthorized';
      END IF;
      
      v_server_calculated_subtotal := v_server_calculated_subtotal + (v_current_price * v_item_qty);
  END LOOP;

  -- Validasi Selisih Subtotal (Tampering Check)
  IF p_subtotal <> v_server_calculated_subtotal THEN
      RAISE EXCEPTION 'Price tampering detected: subtotal mismatch';
  END IF;

  -- Hitung diskon yang diterapkan oleh klien
  v_discount := p_subtotal - p_total;
  IF v_discount < 0 THEN
      v_discount := 0;
  END IF;
  
  -- Hitung total akhir secara aman
  v_server_calculated_total := v_server_calculated_subtotal - v_discount;
  IF v_server_calculated_total < 0 THEN
      v_server_calculated_total := 0;
  END IF;

  -- 2. Buat Nomor Nota (Format: SUTRA-YYYYMMDD-RANDOM)
  v_receipt_number := 'SUTRA-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 6));

  -- 3. Catat Transaksi ke Tabel Penjualan
  INSERT INTO public.kasir_transactions (
    outlet_id, user_id, items, total, subtotal, payment_method, receipt_number, created_at
  ) VALUES (
    p_outlet_id, p_user_id, p_items, v_server_calculated_total, v_server_calculated_subtotal, p_payment_method, v_receipt_number, now()
  )
  RETURNING id INTO v_transaction_id;

  -- 4. Update Stok Produk secara Otomatis
  UPDATE public.kasir_products p
  SET stock = p.stock - (item.value->>'qty')::int,
      updated_at = NOW()
  FROM jsonb_array_elements(p_items) AS item
  WHERE p.id = (item.value->>'product_id')::uuid AND p.user_id = auth.uid();

  -- 5. Kirim Balik Data Lengkap
  RETURN jsonb_build_object(
    'status', 'success',
    'transaction_id', v_transaction_id,
    'receipt_number', v_receipt_number,
    'total', v_server_calculated_total,
    'payment_method', p_payment_method
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM
  );
END;
$$;


-- 2. SECURITY TRIGGER TO PROTECT profiles.plan & pro_expires_at FROM CLIENT-SIDE DIRECT UPDATES
CREATE OR REPLACE FUNCTION public.protect_profiles_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if database role is 'authenticated' or 'anon' (client-side connection)
  IF CURRENT_USER IN ('authenticated', 'anon') THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'Unauthorized: You cannot modify your own plan column directly.';
    END IF;
    IF NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at THEN
      RAISE EXCEPTION 'Unauthorized: You cannot modify your subscription expiry date directly.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_profiles_plan ON public.profiles;
CREATE TRIGGER tr_protect_profiles_plan
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profiles_plan();

-- 3. SECURE FUNCTION TO ACTIVATE PRO TRIAL
CREATE OR REPLACE FUNCTION public.activate_pro_trial()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Ensure user can only activate trial once (when plan is 'free' and trial_ends_at is NULL)
  IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND plan = 'free' 
        AND trial_ends_at IS NULL
  ) THEN
      UPDATE public.profiles
      SET 
          plan = 'pro',
          trial_ends_at = now() + interval '14 days'
      WHERE id = auth.uid();
  ELSE
      RAISE EXCEPTION 'Trial already used or invalid plan status';
  END IF;
END;
$$;

-- Grant execute permissions only to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_pro_trial() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_pro_trial() FROM public, anon;

