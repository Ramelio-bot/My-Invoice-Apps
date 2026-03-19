-- F&B ADVANCED INVENTORY STAGING SCHEMA
-- Run this in your Supabase Staging SQL Editor

-- 1. Update kasir_products with product_type
-- type: 'fixed' (Barang Jadi), 'recipe' (Menu Resep), 'ingredient' (Bahan Baku)
ALTER TABLE public.kasir_products 
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'fixed' CHECK (product_type IN ('fixed', 'recipe', 'ingredient'));

-- 2. Create kasir_recipes table
-- Relates a 'recipe' product to its 'ingredient' components
CREATE TABLE IF NOT EXISTS public.kasir_recipes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.kasir_products(id) ON DELETE CASCADE NOT NULL,
    ingredient_id uuid REFERENCES public.kasir_products(id) ON DELETE CASCADE NOT NULL,
    quantity numeric NOT NULL DEFAULT 1,
    unit text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS for kasir_recipes
ALTER TABLE public.kasir_recipes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policy
DROP POLICY IF EXISTS "Users can only access their own recipes" ON public.kasir_recipes;
CREATE POLICY "Users can only access their own recipes" 
ON public.kasir_recipes FOR ALL 
USING (auth.uid() = user_id);

-- 5. Helpful View for Recipe Costs (Optional but recommended)
CREATE OR REPLACE VIEW public.recipe_view AS
SELECT 
    r.id as recipe_item_id,
    p.name as menu_name,
    i.name as ingredient_name,
    r.quantity,
    r.unit,
    i.price as ingredient_unit_price,
    (r.quantity * i.price) as cost_contribution
FROM public.kasir_recipes r
JOIN public.kasir_products p ON r.product_id = p.id
JOIN public.kasir_products i ON r.ingredient_id = i.id;
