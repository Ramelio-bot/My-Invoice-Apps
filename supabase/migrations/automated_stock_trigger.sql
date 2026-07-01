-- ============================================================
-- 🛡️ AUTOMATED STOCK TRIGGER & PROCESS_SALE REFACTOR
-- Mencegah lost stock deduction dengan trigger BEFORE INSERT
-- ============================================================

BEGIN;

-- 1. REFACTOR TERBAIK: Pasang Trigger BEFORE INSERT langsung pada detail item transaksi
CREATE OR REPLACE FUNCTION public.deduct_stock_per_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Potong stok pada tabel kasir_products secara otomatis per item yang masuk
    -- Menggunakan GREATEST untuk mencegah stok minus
    UPDATE public.kasir_products
    SET stock = GREATEST(0, stock - NEW.quantity),
        updated_at = NOW()
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deduct_stock_per_item ON public.kasir_transaction_items;
CREATE TRIGGER trg_deduct_stock_per_item
    BEFORE INSERT ON public.kasir_transaction_items
    FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_per_item();

-- ────────────────────────────────────────────────────────────────────
-- 📌 2. AMANDEMEN RPC PROCESS_SALE (Matikan Pemotongan Stok Manual)
-- ────────────────────────────────────────────────────────────────────
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

  -- 4. Catat Item ke Tabel kasir_transaction_items
  -- INI AKAN MEMICU TRIGGER trg_deduct_stock_per_item
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

  -- KLAUSA UPDATE STOCK MANUAL TELAH DIHAPUS DI SINI.

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

-- Eksekusi aman
COMMIT;
