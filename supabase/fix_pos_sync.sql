-- 1. Buat ulang fungsi sinkronisasi transaksi POS ke Cashbook
CREATE OR REPLACE FUNCTION public.kasir_tx_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (
        user_id, 
        type, 
        category, 
        description, 
        amount, 
        date, 
        outlet_id,
        reference_type,
        reference_id,
        is_automated
    ) VALUES (
        NEW.user_id,
        'income',
        'Penjualan Kasir',
        'Transaksi Kasir ' || COALESCE(NEW.receipt_number, NEW.id::text),
        NEW.total,
        COALESCE(NEW.created_at::date, CURRENT_DATE),
        NEW.outlet_id,
        'kasir_sale',
        NEW.id,
        true
    );
    RETURN NEW;
END;
$$;

-- 2. Pasang kembali Trigger AFTER INSERT secara clean
DROP TRIGGER IF EXISTS trg_kasir_tx_to_cashbook ON public.kasir_transactions;
CREATE TRIGGER trg_kasir_tx_to_cashbook
    AFTER INSERT ON public.kasir_transactions
    FOR EACH ROW EXECUTE FUNCTION public.kasir_tx_to_cashbook();

-- 3. Data Correction: Ambil semua data omset yang bolong sejak 6 Mei 2026 secara aman
INSERT INTO public.cashbook (
    user_id, 
    type, 
    category, 
    description, 
    amount, 
    date, 
    outlet_id,
    reference_type,
    reference_id,
    is_automated
)
SELECT 
    t.user_id,
    'income',
    'Penjualan Kasir',
    'Transaksi Kasir ' || COALESCE(t.receipt_number, t.id::text),
    t.total,
    COALESCE(t.created_at::date, CURRENT_DATE),
    t.outlet_id,
    'kasir_sale',
    t.id,
    true
FROM public.kasir_transactions t
LEFT JOIN public.cashbook c 
    ON c.user_id = t.user_id 
    AND (
        c.reference_id = t.id 
        OR c.description = 'Transaksi Kasir ' || COALESCE(t.receipt_number, t.id::text)
    )
WHERE c.id IS NULL 
  AND t.created_at >= '2026-05-06'::date;
