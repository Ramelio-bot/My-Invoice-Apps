-- ============================================================
-- hpp_recipes table for Advanced HPP Calculator
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hpp_recipes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  selling_price INTEGER DEFAULT 0,
  components   JSONB DEFAULT '{}',   -- { materials, wages, rents, utilities, misc }
  total_hpp    INTEGER DEFAULT 0,
  margin_percent DECIMAL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.hpp_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own hpp recipes" ON public.hpp_recipes;
CREATE POLICY "Users manage own hpp recipes"
ON public.hpp_recipes FOR ALL
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hpp_recipes_updated_at ON public.hpp_recipes;
CREATE TRIGGER hpp_recipes_updated_at
  BEFORE UPDATE ON public.hpp_recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS hpp_recipes_user_id_idx ON public.hpp_recipes (user_id);
