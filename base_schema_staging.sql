-- ============================================================
-- MY INVOICE — BASE SCHEMA (STAGING INITIALIZATION)
-- Jalankan script ini di Supabase SQL Editor Project Staging lu
-- sebelum menjalankan fnb_staging.sql
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (User settings & plan)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    plan TEXT DEFAULT 'free',
    role TEXT DEFAULT 'user',
    trial_ends_at TIMESTAMPTZ,
    pro_expires_at TIMESTAMPTZ,
    company_logo TEXT,
    store_name TEXT DEFAULT 'My Store',
    store_address TEXT,
    store_phone TEXT,
    store_footer TEXT,
    store_logo_url TEXT,
    business_type TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Documents Table (Invoice, Kwitansi, SPH, PO, Tanda Terima, etc.)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'invoice', 'kwitansi', 'sph', 'po', 'ttr', 'download', etc.
    doc_number TEXT NOT NULL,
    client_name TEXT,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'unpaid',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cashbook Table (Financial records)
CREATE TABLE IF NOT EXISTS public.cashbook (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'income' atau 'expense'
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_id UUID,
    reference_type TEXT,
    bukti TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Kasir Products Table
CREATE TABLE IF NOT EXISTS public.kasir_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'Umum',
    emoji TEXT DEFAULT '🛍️',
    sku TEXT,
    product_type TEXT DEFAULT 'fixed' CHECK (product_type IN ('fixed', 'recipe', 'ingredient')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Kasir Recipes Table (Added for F&B)
CREATE TABLE IF NOT EXISTS public.kasir_recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.kasir_products(id) ON DELETE CASCADE NOT NULL,
    ingredient_id UUID REFERENCES public.kasir_products(id) ON DELETE CASCADE NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Kasir Transactions Table
CREATE TABLE IF NOT EXISTS public.kasir_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_type TEXT DEFAULT 'none',
    discount_value NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    change_amount NUMERIC(15, 2) DEFAULT 0,
    kasir_name TEXT,
    store_name TEXT,
    notes TEXT,
    voucher_code TEXT,
    customer_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Kasir Transaction Items Table
CREATE TABLE IF NOT EXISTS public.kasir_transaction_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES public.kasir_transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.kasir_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_emoji TEXT DEFAULT '🛍️',
    price NUMERIC(15, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Kasir Employees Table
CREATE TABLE IF NOT EXISTS public.kasir_employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Kasir',
    pin TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Kasir Expenses Table
CREATE TABLE IF NOT EXISTS public.kasir_expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    category TEXT DEFAULT 'Operasional',
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Kasir Stock History Table
CREATE TABLE IF NOT EXISTS public.kasir_stock_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.kasir_products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    qty_added INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Kasir Vouchers Table
CREATE TABLE IF NOT EXISTS public.kasir_vouchers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. HPP Recipes Table
CREATE TABLE IF NOT EXISTS public.hpp_recipes (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    selling_price INTEGER DEFAULT 0,
    components   JSONB DEFAULT '{}',
    total_hpp    INTEGER DEFAULT 0,
    margin_percent DECIMAL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function decrease stock
CREATE OR REPLACE FUNCTION public.decrease_kasir_stock(product_id UUID, qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.kasir_products
  SET stock = GREATEST(0, stock - qty),
      updated_at = NOW()
  WHERE id = product_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-insert ke cashbook saat transaksi kasir dibuat
CREATE OR REPLACE FUNCTION public.kasir_tx_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (user_id, type, category, description, amount, date)
    VALUES (NEW.user_id, 'income', 'Penjualan Kasir', 'Transaksi Kasir ' || COALESCE(NEW.receipt_number, NEW.id::text), NEW.total, COALESCE(NEW.created_at::date, CURRENT_DATE));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kasir_tx_to_cashbook ON public.kasir_transactions;
CREATE TRIGGER trg_kasir_tx_to_cashbook AFTER INSERT ON public.kasir_transactions FOR EACH ROW EXECUTE FUNCTION public.kasir_tx_to_cashbook();

-- Trigger: auto-insert ke cashbook saat pengeluaran kasir dibuat
CREATE OR REPLACE FUNCTION public.kasir_expense_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (user_id, type, category, description, amount, date)
    VALUES (NEW.user_id, 'expense', COALESCE(NEW.category, 'Pengeluaran Kasir'), COALESCE(NEW.description, 'Pengeluaran Kasir'), NEW.amount, COALESCE(NEW.expense_date, CURRENT_DATE));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kasir_expense_to_cashbook ON public.kasir_expenses;
CREATE TRIGGER trg_kasir_expense_to_cashbook AFTER INSERT ON public.kasir_expenses FOR EACH ROW EXECUTE FUNCTION public.kasir_expense_to_cashbook();

-- Delete User Account Function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.documents WHERE user_id = uid;
  DELETE FROM public.clients WHERE user_id = uid;
  DELETE FROM public.cashbook WHERE user_id = uid;
  DELETE FROM public.kasir_transactions WHERE user_id = uid;
  DELETE FROM public.kasir_expenses WHERE user_id = uid;
  DELETE FROM public.kasir_recipes WHERE user_id = uid;
  DELETE FROM public.kasir_products WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Process Sale Function for Offline Queue Sync with Server-Side Price Validation
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


-- Verify Employee PIN
CREATE OR REPLACE FUNCTION public.verify_employee_pin(p_employee_id UUID, p_entered_pin TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.kasir_employees 
    WHERE id = p_employee_id 
      AND (pin IS NULL OR pin = '' OR pin = p_entered_pin)
      AND is_active = true
      AND user_id = auth.uid()
  );
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpp_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own profile" ON public.profiles;
CREATE POLICY "Users access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users access own clients" ON public.clients;
CREATE POLICY "Users access own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own documents" ON public.documents;
CREATE POLICY "Users access own documents" ON public.documents FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own cashbook" ON public.cashbook;
CREATE POLICY "Users access own cashbook" ON public.cashbook FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own products" ON public.kasir_products;
CREATE POLICY "Users access own products" ON public.kasir_products FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own transactions" ON public.kasir_transactions;
CREATE POLICY "Users access own transactions" ON public.kasir_transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own items" ON public.kasir_transaction_items;
CREATE POLICY "Users access own items" ON public.kasir_transaction_items FOR ALL USING (transaction_id IN (SELECT id FROM public.kasir_transactions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users access own employees" ON public.kasir_employees;
CREATE POLICY "Users access own employees" ON public.kasir_employees FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own expenses" ON public.kasir_expenses;
CREATE POLICY "Users access own expenses" ON public.kasir_expenses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own history" ON public.kasir_stock_history;
CREATE POLICY "Users access own history" ON public.kasir_stock_history FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own vouchers" ON public.kasir_vouchers;
CREATE POLICY "Users access own vouchers" ON public.kasir_vouchers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own recipes" ON public.kasir_recipes;
CREATE POLICY "Users access own recipes" ON public.kasir_recipes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own hpp" ON public.hpp_recipes;
CREATE POLICY "Users access own hpp" ON public.hpp_recipes FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SECURITY TRIGGER: Protect public.profiles.plan & pro_expires_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profiles_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if database role is 'authenticated' or 'anon' (client-side connections)
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

-- ============================================================
-- SECURE FUNCTION: Activate Pro Trial
-- ============================================================
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

GRANT EXECUTE ON FUNCTION public.activate_pro_trial() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_pro_trial() FROM public, anon;

