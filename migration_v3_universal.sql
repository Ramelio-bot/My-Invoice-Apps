-- SQL Migration: Universal Inventory Upgrade
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add min_stock column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kasir_products' AND column_name='min_stock') THEN
        ALTER TABLE kasir_products ADD COLUMN min_stock NUMERIC DEFAULT 5;
    END IF;
END $$;

-- 2. Convert stock column from INTEGER to NUMERIC to support decimals (e.g., 0.1 kg)
ALTER TABLE kasir_products ALTER COLUMN stock TYPE NUMERIC USING stock::NUMERIC;

-- 3. Ensure price is also numeric (just in case)
ALTER TABLE kasir_products ALTER COLUMN price TYPE NUMERIC USING price::NUMERIC;
