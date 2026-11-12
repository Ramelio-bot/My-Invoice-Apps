-- ============================================================
-- 20261112_strict_trial_and_free_limits.sql
-- Idempotent migration enforcing:
--   1. Automatic downgrade to 'free' when 14-day trial_ends_at or paid pro_expires_at expires
--   2. Strict one-time trial guard on activate_pro_trial()
--   3. Unified server-side BEFORE INSERT quota triggers across all 7 tables:
--      documents (invoice=10, kw=10, hutang/piutang=10, sph=5, download=10),
--      kasir_transactions (50/mo), receipts (5/mo), purchase_orders (5/mo),
--      cashbook manual (20/mo), clients (10 total), kasir_products (20 active)
-- ============================================================

BEGIN;

-- Immediately clean up any existing profiles whose trial or subscription has already expired
UPDATE public.profiles
SET plan = 'free'
WHERE COALESCE(role, 'user') <> 'admin'
  AND plan IN ('pro', 'ultimate')
  AND (
      (trial_ends_at IS NOT NULL AND trial_ends_at <= NOW() AND (pro_expires_at IS NULL OR pro_expires_at <= NOW()))
      OR
      (pro_expires_at IS NOT NULL AND pro_expires_at <= NOW() AND (trial_ends_at IS NULL OR trial_ends_at <= NOW()))
  );

-- 1. RPC to sync expired trial or expired paid subscription back to 'free'
CREATE OR REPLACE FUNCTION public.sync_expired_plan_status()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.profiles
    SET plan = 'free'
    WHERE id = auth.uid()
      AND COALESCE(role, 'user') <> 'admin'
      AND plan IN ('pro', 'ultimate')
      AND (
          (trial_ends_at IS NOT NULL AND trial_ends_at <= NOW() AND (pro_expires_at IS NULL OR pro_expires_at <= NOW()))
          OR
          (pro_expires_at IS NOT NULL AND pro_expires_at <= NOW() AND (trial_ends_at IS NULL OR trial_ends_at <= NOW()))
      );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_expired_plan_status() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_expired_plan_status() FROM public, anon;

-- 2. Harden activate_pro_trial() so trial can never be activated more than once
CREATE OR REPLACE FUNCTION public.activate_pro_trial()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND plan = 'free'
          AND trial_ends_at IS NULL
          AND pro_expires_at IS NULL
          AND last_payment_trx_id IS NULL
    ) THEN
        UPDATE public.profiles
        SET
            plan = 'pro',
            trial_ends_at = NOW() + INTERVAL '14 days'
        WHERE id = auth.uid();
    ELSE
        RAISE EXCEPTION 'Trial already used or invalid plan status';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_pro_trial() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_pro_trial() FROM public, anon;

-- 3. Unified Trigger Function for All 7 Quota-Limited Tables
CREATE OR REPLACE FUNCTION public.enforce_user_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_user_plan TEXT;
    v_user_role TEXT;
    v_trial_ends_at TIMESTAMPTZ;
    v_pro_expires_at TIMESTAMPTZ;
    v_effective_plan TEXT;
    v_current_count INTEGER;
    v_deleted_count INTEGER := 0;
    v_start_of_month TIMESTAMPTZ;
    v_limit INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT LOWER(COALESCE(plan, 'free')), LOWER(COALESCE(role, 'user')), trial_ends_at, pro_expires_at
    INTO v_user_plan, v_user_role, v_trial_ends_at, v_pro_expires_at
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_user_role = 'admin' THEN
        RETURN NEW;
    END IF;

    IF v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW() THEN
        v_effective_plan := CASE WHEN v_user_plan = 'ultimate' AND (v_pro_expires_at IS NULL OR v_pro_expires_at > NOW()) THEN 'ultimate' ELSE 'pro' END;
    ELSIF v_pro_expires_at IS NOT NULL AND v_pro_expires_at <= NOW() THEN
        v_effective_plan := 'free';
        IF v_user_plan <> 'free' THEN
            UPDATE public.profiles SET plan = 'free' WHERE id = auth.uid();
        END IF;
    ELSIF v_trial_ends_at IS NOT NULL AND v_trial_ends_at <= NOW() AND v_pro_expires_at IS NULL THEN
        v_effective_plan := 'free';
        IF v_user_plan <> 'free' THEN
            UPDATE public.profiles SET plan = 'free' WHERE id = auth.uid();
        END IF;
    ELSE
        v_effective_plan := COALESCE(v_user_plan, 'free');
    END IF;

    IF v_effective_plan IN ('pro', 'ultimate') THEN
        RETURN NEW;
    END IF;

    v_start_of_month := date_trunc('month', NOW() AT TIME ZONE 'UTC');

    IF TG_TABLE_NAME = 'documents' THEN
        IF NEW.type IN ('invoice', 'inv') THEN
            v_limit := 10;
            SELECT COUNT(*) INTO v_current_count FROM public.documents
            WHERE user_id = auth.uid() AND type IN ('invoice', 'inv') AND created_at >= v_start_of_month;

            SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
            WHERE user_id = auth.uid() AND LOWER(module) = 'invoice' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

            IF (v_current_count + v_deleted_count) >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Invoice bulanan (10) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;

        ELSIF NEW.type IN ('kw', 'kwitansi') THEN
            v_limit := 10;
            SELECT COUNT(*) INTO v_current_count FROM public.documents
            WHERE user_id = auth.uid() AND type IN ('kw', 'kwitansi') AND created_at >= v_start_of_month;

            SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
            WHERE user_id = auth.uid() AND LOWER(module) = 'kwitansi' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

            IF (v_current_count + v_deleted_count) >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Kwitansi bulanan (10) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;

        ELSIF NEW.type IN ('hutang', 'piutang') THEN
            v_limit := 10;
            SELECT COUNT(*) INTO v_current_count FROM public.documents
            WHERE user_id = auth.uid() AND type IN ('hutang', 'piutang') AND created_at >= v_start_of_month;

            SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
            WHERE user_id = auth.uid() AND LOWER(module) = 'hutangpiutang' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

            IF (v_current_count + v_deleted_count) >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Hutang/Piutang bulanan (10) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;

        ELSIF NEW.type = 'sph' THEN
            v_limit := 5;
            SELECT COUNT(*) INTO v_current_count FROM public.documents
            WHERE user_id = auth.uid() AND type = 'sph' AND created_at >= v_start_of_month;

            SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
            WHERE user_id = auth.uid() AND LOWER(module) = 'quotation' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

            IF (v_current_count + v_deleted_count) >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Penawaran/Quotation bulanan (5) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;

        ELSIF NEW.type = 'download' THEN
            v_limit := 10;
            SELECT COUNT(*) INTO v_current_count FROM public.documents
            WHERE user_id = auth.uid() AND type = 'download' AND created_at >= v_start_of_month;

            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Download PDF bulanan (10) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;
        END IF;

    ELSIF TG_TABLE_NAME = 'kasir_transactions' THEN
        v_limit := 50;
        SELECT COUNT(*) INTO v_current_count FROM public.kasir_transactions
        WHERE user_id = auth.uid() AND status = 'paid' AND created_at >= v_start_of_month;

        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Transaksi Kasir bulanan (50) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    ELSIF TG_TABLE_NAME = 'receipts' THEN
        v_limit := 5;
        SELECT COUNT(*) INTO v_current_count FROM public.receipts
        WHERE user_id = auth.uid() AND created_at >= v_start_of_month;

        SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
        WHERE user_id = auth.uid() AND LOWER(module) = 'tandaterima' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

        IF (v_current_count + v_deleted_count) >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Tanda Terima bulanan (5) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    ELSIF TG_TABLE_NAME = 'purchase_orders' THEN
        v_limit := 5;
        SELECT COUNT(*) INTO v_current_count FROM public.purchase_orders
        WHERE user_id = auth.uid() AND created_at >= v_start_of_month;

        SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
        WHERE user_id = auth.uid() AND LOWER(module) = 'purchaseorder' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

        IF (v_current_count + v_deleted_count) >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Purchase Order bulanan (5) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    ELSIF TG_TABLE_NAME = 'cashbook' THEN
        v_limit := 20;
        IF NOT COALESCE(NEW.is_automated, false)
           AND NEW.reference_type IS NULL
           AND NEW.document_id IS NULL
           AND COALESCE(NEW.category, '') NOT IN (
               'Penjualan Kasir', 'Pengeluaran Kasir', 'Operasional Kasir', 'Cashier Expenses',
               'Kwitansi', 'Invoice Lunas', 'Lunas', 'Paid',
               'Pembayaran Piutang', 'Pembayaran Hutang', 'Pelunasan Piutang', 'Pelunasan Hutang'
           )
        THEN
            SELECT COUNT(*) INTO v_current_count FROM public.cashbook
            WHERE user_id = auth.uid()
              AND NOT COALESCE(is_automated, false)
              AND reference_type IS NULL
              AND document_id IS NULL
              AND COALESCE(category, '') NOT IN (
                  'Penjualan Kasir', 'Pengeluaran Kasir', 'Operasional Kasir', 'Cashier Expenses',
                  'Kwitansi', 'Invoice Lunas', 'Lunas', 'Paid',
                  'Pembayaran Piutang', 'Pembayaran Hutang', 'Pelunasan Piutang', 'Pelunasan Hutang'
              )
              AND created_at >= v_start_of_month;

            SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
            WHERE user_id = auth.uid() AND LOWER(module) = 'catatanbisnis' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

            IF (v_current_count + v_deleted_count) >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Catatan Bisnis bulanan (20) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;
        END IF;

    ELSIF TG_TABLE_NAME = 'clients' THEN
        v_limit := 10;
        SELECT COUNT(*) INTO v_current_count FROM public.clients
        WHERE user_id = auth.uid();

        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Klien (10) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    ELSIF TG_TABLE_NAME = 'kasir_products' THEN
        v_limit := 20;
        SELECT COUNT(*) INTO v_current_count FROM public.kasir_products
        WHERE user_id = auth.uid() AND COALESCE(is_active, true) = true;

        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Produk Kasir (20) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_documents_limit ON public.documents;
CREATE TRIGGER trg_enforce_documents_limit BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.enforce_user_plan_limits();

DROP TRIGGER IF EXISTS trg_enforce_kasir_limit ON public.kasir_transactions;
CREATE TRIGGER trg_enforce_kasir_limit BEFORE INSERT ON public.kasir_transactions FOR EACH ROW EXECUTE FUNCTION public.enforce_user_plan_limits();

DROP TRIGGER IF EXISTS trg_enforce_receipts_limit ON public.receipts;
CREATE TRIGGER trg_enforce_receipts_limit BEFORE INSERT ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.enforce_user_plan_limits();

DROP TRIGGER IF EXISTS trg_enforce_po_limit ON public.purchase_orders;
CREATE TRIGGER trg_enforce_po_limit BEFORE INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.enforce_user_plan_limits();

DROP TRIGGER IF EXISTS trg_enforce_cashbook_limit ON public.cashbook;
CREATE TRIGGER trg_enforce_cashbook_limit BEFORE INSERT ON public.cashbook FOR EACH ROW EXECUTE FUNCTION public.enforce_user_plan_limits();

DROP TRIGGER IF EXISTS trg_enforce_clients_limit ON public.clients;
CREATE TRIGGER trg_enforce_clients_limit BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION public.enforce_user_plan_limits();

DROP TRIGGER IF EXISTS trg_enforce_products_limit ON public.kasir_products;
CREATE TRIGGER trg_enforce_products_limit BEFORE INSERT ON public.kasir_products FOR EACH ROW EXECUTE FUNCTION public.enforce_user_plan_limits();

COMMIT;
