ALTER TABLE public.kasir_products
ADD COLUMN IF NOT EXISTS sku TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS kasir_products_sku_unique 
ON public.kasir_products(sku, user_id) 
WHERE sku IS NOT NULL AND sku != '';
