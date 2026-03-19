-- SQL Migration: Add product_type to kasir_products
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add the column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kasir_products' AND column_name='product_type') THEN
        ALTER TABLE kasir_products ADD COLUMN product_type text DEFAULT 'fixed';
    END IF;
END $$;

-- 2. Update existing records to 'fixed' if they are null (optional, usually handled by DEFAULT)
UPDATE kasir_products SET product_type = 'fixed' WHERE product_type IS NULL;

-- 3. (Optional) Add a check constraint to ensure only valid types are used
ALTER TABLE kasir_products DROP CONSTRAINT IF EXISTS check_product_type;
ALTER TABLE kasir_products ADD CONSTRAINT check_product_type CHECK (product_type IN ('fixed', 'recipe', 'ingredient'));
