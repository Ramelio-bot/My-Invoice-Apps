-- Tabel Cashbook (Catatan Bisnis Global)
-- Dibuat untuk mengakomodasi integrasi dengan fitur Kasir V2

CREATE TABLE IF NOT EXISTS public.cashbook (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'income' atau 'expense'
  category TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_id UUID,
  reference_type TEXT,
  bukti TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies untuk cashbook
ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cashbook"
ON public.cashbook FOR ALL USING (auth.uid() = user_id);
