-- =========================================================
-- FIX: TRIGGER KASIR TO CASHBOOK (SALES & EXPENSES)
-- =========================================================
-- Masalah: 
-- 1. Ketidaksinkronan nama kolom date di expenses.
-- 2. Hilangnya outlet_id saat sinkronisasi ke cashbook.
--
-- INSTRUKSI: Jalankan seluruh perintah SQL di bawah ini 
-- di Supabase SQL Editor.
-- =========================================================

-- 1. FIX TRIGGER PENJUALAN (SALES)
CREATE OR REPLACE FUNCTION public.kasir_tx_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (user_id, type, category, description, amount, date, outlet_id)
    VALUES (
        NEW.user_id, 
        'income', 
        'Penjualan Kasir', 
        'Transaksi Kasir ' || COALESCE(NEW.receipt_number, NEW.id::text), 
        NEW.total, 
        COALESCE(NEW.created_at::date, CURRENT_DATE),
        NEW.outlet_id
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kasir_tx_to_cashbook ON public.kasir_transactions;
CREATE TRIGGER trg_kasir_tx_to_cashbook 
AFTER INSERT ON public.kasir_transactions 
FOR EACH ROW EXECUTE FUNCTION public.kasir_tx_to_cashbook();


-- 2. FIX TRIGGER PENGELUARAN (EXPENSE)
CREATE OR REPLACE FUNCTION public.kasir_expense_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (user_id, type, category, description, amount, date, outlet_id)
    VALUES (
        NEW.user_id, 
        'expense', 
        COALESCE(NEW.category, 'Pengeluaran Kasir'), 
        COALESCE(NEW.description, 'Pengeluaran Kasir'), 
        NEW.amount, 
        COALESCE(NEW.date, CURRENT_DATE),
        NEW.outlet_id
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kasir_expense_to_cashbook ON public.kasir_expenses;
CREATE TRIGGER trg_kasir_expense_to_cashbook 
AFTER INSERT ON public.kasir_expenses 
FOR EACH ROW EXECUTE FUNCTION public.kasir_expense_to_cashbook();
