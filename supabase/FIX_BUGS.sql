-- ============================================================
-- MY INVOICE — SQL AUDIT FIX
-- Jalankan di Supabase SQL Editor → New Query → Run
-- Tanggal: 2026-03-02
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BLOK 1: Pastikan cashbook insert otomatis (TRIGGER)
--         Setiap kasir_transactions → cashbook (income)
--         Setiap kasir_expenses → cashbook (expense)
-- ─────────────────────────────────────────────────────────────

-- Fungsi trigger: auto-insert ke cashbook saat transaksi kasir dibuat
CREATE OR REPLACE FUNCTION public.kasir_tx_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (
        user_id, type, category, description, amount, date
    ) VALUES (
        NEW.user_id,
        'income',
        'Penjualan Kasir',
        'Transaksi Kasir ' || COALESCE(NEW.receipt_number, NEW.id::text),
        NEW.total,
        COALESCE(NEW.created_at::date, CURRENT_DATE)
    );
    RETURN NEW;
END;
$$;

-- Hapus trigger lama kalau ada, buat yang baru
DROP TRIGGER IF EXISTS trg_kasir_tx_to_cashbook ON public.kasir_transactions;
CREATE TRIGGER trg_kasir_tx_to_cashbook
    AFTER INSERT ON public.kasir_transactions
    FOR EACH ROW EXECUTE FUNCTION public.kasir_tx_to_cashbook();


-- Fungsi trigger: auto-insert ke cashbook saat pengeluaran kasir dibuat
CREATE OR REPLACE FUNCTION public.kasir_expense_to_cashbook()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.cashbook (
        user_id, type, category, description, amount, date
    ) VALUES (
        NEW.user_id,
        'expense',
        COALESCE(NEW.category, 'Pengeluaran Kasir'),
        COALESCE(NEW.description, 'Pengeluaran Kasir'),
        NEW.amount,
        COALESCE(NEW.expense_date, CURRENT_DATE)
    );
    RETURN NEW;
END;
$$;

-- Hapus trigger lama kalau ada, buat yang baru
DROP TRIGGER IF EXISTS trg_kasir_expense_to_cashbook ON public.kasir_expenses;
CREATE TRIGGER trg_kasir_expense_to_cashbook
    AFTER INSERT ON public.kasir_expenses
    FOR EACH ROW EXECUTE FUNCTION public.kasir_expense_to_cashbook();


-- ─────────────────────────────────────────────────────────────
-- BLOK 2: Fix delete_user_account untuk hapus semua data kasir
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();
  
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Tabel dokumen utama
  DELETE FROM public.documents WHERE user_id = uid;
  DELETE FROM public.clients WHERE user_id = uid;
  DELETE FROM public.cashbook WHERE user_id = uid;
  DELETE FROM public.hpp_records WHERE user_id = uid;
  DELETE FROM public.download_logs WHERE user_id = uid;

  -- Data kasir — dihapus semua
  DELETE FROM public.kasir_transaction_items
    WHERE transaction_id IN (
      SELECT id FROM public.kasir_transactions WHERE user_id = uid
    );
  DELETE FROM public.kasir_transactions WHERE user_id = uid;
  DELETE FROM public.kasir_expenses WHERE user_id = uid;
  DELETE FROM public.kasir_stock_history
    WHERE product_id IN (
      SELECT id FROM public.kasir_products WHERE user_id = uid
    );
  DELETE FROM public.kasir_products WHERE user_id = uid;
  DELETE FROM public.kasir_employees WHERE user_id = uid;
  
  -- Hapus profile dan auth user
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- BLOK 3: Validasi — cek apakah trigger cashbook sudah aktif
-- ─────────────────────────────────────────────────────────────
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trg_kasir_tx_to_cashbook',
    'trg_kasir_expense_to_cashbook'
  );
