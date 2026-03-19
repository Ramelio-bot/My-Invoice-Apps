-- SQL Migration: Universal Inventory Upgrade (Revised)
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Drop view that depends on price/stock
DROP VIEW IF EXISTS public.recipe_view;

-- 2. Add min_stock column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kasir_products' AND column_name='min_stock') THEN
        ALTER TABLE kasir_products ADD COLUMN min_stock NUMERIC DEFAULT 5;
    END IF;
END $$;

-- 3. Convert columns to NUMERIC for decimal support
ALTER TABLE kasir_products ALTER COLUMN stock TYPE NUMERIC USING stock::NUMERIC;
ALTER TABLE kasir_products ALTER COLUMN price TYPE NUMERIC USING price::NUMERIC;

-- 4. Recreate the view
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
