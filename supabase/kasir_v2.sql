-- Tabel produk kasir
CREATE TABLE IF NOT EXISTS public.kasir_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Umum',
  emoji TEXT DEFAULT '🛍️',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel transaksi kasir
CREATE TABLE IF NOT EXISTS public.kasir_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'none', -- 'none', 'persen', 'nominal'
  discount_value INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'transfer', 'qris'
  amount_paid INTEGER DEFAULT 0,
  change_amount INTEGER DEFAULT 0,
  kasir_name TEXT,
  store_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel detail item transaksi kasir
CREATE TABLE IF NOT EXISTS public.kasir_transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.kasir_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.kasir_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_emoji TEXT DEFAULT '🛍️',
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel karyawan kasir
CREATE TABLE IF NOT EXISTS public.kasir_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Kasir',
  pin TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel pengeluaran kasir
CREATE TABLE IF NOT EXISTS public.kasir_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT DEFAULT 'Operasional',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function decrease stock
CREATE OR REPLACE FUNCTION public.decrease_kasir_stock(
  product_id UUID,
  qty INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.kasir_products
  SET stock = GREATEST(0, stock - qty),
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.kasir_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasir_expenses ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users manage own kasir products"
ON public.kasir_products FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users manage own kasir transactions"
ON public.kasir_transactions FOR ALL USING (auth.uid() = user_id);

-- Transaction items policies
CREATE POLICY "Users manage own kasir items"
ON public.kasir_transaction_items FOR ALL
USING (
  transaction_id IN (
    SELECT id FROM public.kasir_transactions WHERE user_id = auth.uid()
  )
);

-- Employees policies
CREATE POLICY "Users manage own kasir employees"
ON public.kasir_employees FOR ALL USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users manage own kasir expenses"
ON public.kasir_expenses FOR ALL USING (auth.uid() = user_id);


-- Tabel riwayat stok masuk
CREATE TABLE IF NOT EXISTS public.kasir_stock_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.kasir_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  qty_added INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.kasir_stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own kasir stock history" ON public.kasir_stock_history FOR ALL USING (auth.uid() = user_id);

