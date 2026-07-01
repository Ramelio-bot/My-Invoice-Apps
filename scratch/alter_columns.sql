ALTER TABLE public.kasir_transactions ALTER COLUMN subtotal TYPE NUMERIC(15, 2);
ALTER TABLE public.kasir_transactions ALTER COLUMN total TYPE NUMERIC(15, 2);
ALTER TABLE public.kasir_transactions ALTER COLUMN amount_paid TYPE NUMERIC(15, 2);
ALTER TABLE public.kasir_transactions ALTER COLUMN change_amount TYPE NUMERIC(15, 2);
ALTER TABLE public.kasir_transactions ALTER COLUMN discount_amount TYPE NUMERIC(15, 2);

ALTER TABLE public.kasir_transaction_items ALTER COLUMN price TYPE NUMERIC(15, 2);
ALTER TABLE public.kasir_transaction_items ALTER COLUMN subtotal TYPE NUMERIC(15, 2);

ALTER TABLE public.kasir_products ALTER COLUMN price TYPE NUMERIC(15, 2);

ALTER TABLE public.kasir_expenses ALTER COLUMN amount TYPE NUMERIC(15, 2);

ALTER TABLE public.hpp_recipes ALTER COLUMN selling_price TYPE NUMERIC(15, 2);
ALTER TABLE public.hpp_recipes ALTER COLUMN total_hpp TYPE NUMERIC(15, 2);

ALTER TABLE public.kasir_shifts ALTER COLUMN total_revenue TYPE NUMERIC(15, 2);
