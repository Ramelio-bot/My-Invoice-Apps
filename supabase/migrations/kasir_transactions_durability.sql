-- ============================================================
-- 🛡️ IDEMPOTENCY GUARD & PROCESS_SALE REFACTOR (OPTION A)
-- ============================================================

BEGIN;

-- A. Bersihkan trigger parsial yang dipasang pada percobaan sebelumnya
DROP TRIGGER IF EXISTS trg_deduct_stock_per_item ON public.kasir_transaction_items;
DROP FUNCTION IF EXISTS public.deduct_stock_per_item();

-- B. Buat fungsi Idempotency Guard untuk menolak duplikasi receipt_number per user
CREATE OR REPLACE FUNCTION public.guard_kasir_idempotency()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.kasir_transactions 
        WHERE receipt_number = NEW.receipt_number 
          AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Transaksi dengan nomor nota % sudah terproses sebelumnya (Idempotency Block)!', NEW.receipt_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Pasang Trigger BEFORE INSERT pada kasir_transactions
DROP TRIGGER IF EXISTS trg_guard_kasir_idempotency ON public.kasir_transactions;
CREATE TRIGGER trg_guard_kasir_idempotency
    BEFORE INSERT ON public.kasir_transactions
    FOR EACH ROW EXECUTE FUNCTION public.guard_kasir_idempotency();

-- D. Kembalikan Logika Pengurangan Stok ke dalam tubuh RPC 'process_sale'
DROP FUNCTION IF EXISTS public.process_sale(UUID, UUID, JSONB, INTEGER, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.process_sale(
  p_outlet_id UUID,
  p_user_id UUID,
  p_items JSONB,
  p_total INTEGER,
  p_subtotal INTEGER,
  p_payment_method TEXT,
  p_receipt_number TEXT DEFAULT NULL,
  p_amount_paid INTEGER DEFAULT 0,
  p_change_amount INTEGER DEFAULT 0,
  p_discount_type TEXT DEFAULT 'none',
  p_discount_value INTEGER DEFAULT 0,
  p_discount_amount INTEGER DEFAULT 0,
  p_kasir_name TEXT DEFAULT '',
  p_customer_phone TEXT DEFAULT ''
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

  -- Gunakan diskon yang diberikan, namun v_server_calculated_total harus masuk akal
  -- Hitung total akhir secara aman
  v_server_calculated_total := v_server_calculated_subtotal - p_discount_amount;
  IF v_server_calculated_total < 0 THEN
      v_server_calculated_total := 0;
  END IF;

  -- 2. Nomor Nota
  IF p_receipt_number IS NOT NULL AND p_receipt_number <> '' THEN
      v_receipt_number := p_receipt_number;
  ELSE
      v_receipt_number := 'SUTRA-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 6));
  END IF;

  -- 3. Catat Transaksi ke Tabel Penjualan (Idempotency Trigger bekerja di sini)
  INSERT INTO public.kasir_transactions (
    outlet_id, 
    user_id, 
    items, 
    total, 
    subtotal, 
    payment_method, 
    receipt_number, 
    amount_paid,
    change_amount,
    discount_type,
    discount_value,
    discount_amount,
    kasir_name,
    customer_phone,
    status,
    created_at
  ) VALUES (
    p_outlet_id, 
    p_user_id, 
    p_items, 
    v_server_calculated_total, 
    v_server_calculated_subtotal, 
    p_payment_method, 
    v_receipt_number,
    p_amount_paid,
    p_change_amount,
    p_discount_type,
    p_discount_value,
    p_discount_amount,
    p_kasir_name,
    p_customer_phone,
    'paid',
    now()
  )
  RETURNING id INTO v_transaction_id;

  -- 4. Catat Item ke Tabel kasir_transaction_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO public.kasir_transaction_items (
          transaction_id,
          user_id,
          product_id,
          product_name,
          product_emoji,
          price,
          quantity,
          subtotal
      ) VALUES (
          v_transaction_id,
          p_user_id,
          (v_item->>'product_id')::uuid,
          (v_item->>'name')::text,
          COALESCE((v_item->>'emoji')::text, '🛍️'),
          (v_item->>'price')::int,
          (v_item->>'qty')::int,
          ((v_item->>'price')::int * (v_item->>'qty')::int)
      );
  END LOOP;

  -- 5. KEMBALIKAN Logika Pengurangan Stok (Menggunakan GREATEST agar tidak minus)
  UPDATE public.kasir_products p
  SET stock = GREATEST(0, p.stock - (item.value->>'qty')::int),
      updated_at = NOW()
  FROM jsonb_array_elements(p_items) AS item
  WHERE p.id = (item.value->>'product_id')::uuid AND p.user_id = auth.uid();

  -- 6. Kirim Balik Data Lengkap
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

COMMIT;
