-- 1. Tambah kolom ke kasir_transactions:
ALTER TABLE public.kasir_transactions
ADD COLUMN IF NOT EXISTS discount_type TEXT,
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS voucher_code TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 2. Buat tabel voucher:
CREATE TABLE IF NOT EXISTS public.kasir_vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

ALTER TABLE public.kasir_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vouchers" ON public.kasir_vouchers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
