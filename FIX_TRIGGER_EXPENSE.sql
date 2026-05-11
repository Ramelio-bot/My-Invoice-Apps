-- =========================================================
-- FIX: TRIGGER KASIR EXPENSE TO CASHBOOK
-- =========================================================
-- Masalah: Ketidaksesuaian nama kolom antara tabel kasir_expenses (date) 
-- dan referensi di trigger (expense_date).
--
-- INSTRUKSI: Jalankan seluruh perintah SQL di bawah ini 
-- di Supabase SQL Editor.
-- =========================================================

CREATE OR REPLACE FUNCTION public.kasir_expense_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (user_id, type, category, description, amount, date)
    VALUES (
        NEW.user_id, 
        'expense', 
        COALESCE(NEW.category, 'Pengeluaran Kasir'), 
        COALESCE(NEW.description, 'Pengeluaran Kasir'), 
        NEW.amount, 
        COALESCE(NEW.date, CURRENT_DATE) -- Diubah dari expense_date ke date
    );
    RETURN NEW;
END;
$$;

-- Pastikan trigger diikat kembali (opsional jika sudah ada, tapi baik untuk memastikan)
DROP TRIGGER IF EXISTS trg_kasir_expense_to_cashbook ON public.kasir_expenses;
CREATE TRIGGER trg_kasir_expense_to_cashbook 
AFTER INSERT ON public.kasir_expenses 
FOR EACH ROW EXECUTE FUNCTION public.kasir_expense_to_cashbook();
