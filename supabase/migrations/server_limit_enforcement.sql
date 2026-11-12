-- ============================================================
-- SERVER-SIDE LIMIT ENFORCEMENT & EXPIRED TRIAL/SUBSCRIPTION GUARD
-- Synchronizes server-side quota enforcement with UI PlanContext:
--   FREE Limits:
--     * Invoices: 10 / month
--     * Kwitansi: 10 / month
--     * Hutang / Piutang: 10 / month
--     * Quotation (SPH): 5 / month
--     * Purchase Orders (PO): 5 / month
--     * Tanda Terima: 5 / month
--     * PDF Downloads: 10 / month
--     * POS Cashier Transactions: 50 / month
--     * Manual Cashbook Entries: 20 / month
--     * Clients: 10 total
--     * Active Products: 20 total
--   PRO & ULTIMATE: Unlimited (as long as trial_ends_at / pro_expires_at is active)
-- ============================================================

BEGIN;

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
          -- Case A: Trial expired and no active paid subscription
          (trial_ends_at IS NOT NULL AND trial_ends_at <= NOW() AND (pro_expires_at IS NULL OR pro_expires_at <= NOW()))
          OR
          -- Case B: Paid subscription expired and no active trial
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
    -- If executed by service_role / backend webhook without auth.uid(), allow
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Fetch profile plan, role, and expiration timestamps
    SELECT LOWER(COALESCE(plan, 'free')), LOWER(COALESCE(role, 'user')), trial_ends_at, pro_expires_at
    INTO v_user_plan, v_user_role, v_trial_ends_at, v_pro_expires_at
    FROM public.profiles
    WHERE id = auth.uid();

    -- Admin bypass
    IF v_user_role = 'admin' THEN
        RETURN NEW;
    END IF;

    -- Evaluate effective plan and auto-downgrade expired trials / subscriptions
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

    -- Active PRO or ULTIMATE users have unlimited quotas
    IF v_effective_plan IN ('pro', 'ultimate') THEN
        RETURN NEW;
    END IF;

    -- Start of current UTC month
    v_start_of_month := date_trunc('month', NOW() AT TIME ZONE 'UTC');

    -- A. DOCUMENTS (Invoice, Kwitansi, Hutang/Piutang, SPH, Downloads)
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

    -- B. KASIR TRANSACTIONS (50 / month)
    ELSIF TG_TABLE_NAME = 'kasir_transactions' THEN
        v_limit := 50;
        SELECT COUNT(*) INTO v_current_count FROM public.kasir_transactions
        WHERE user_id = auth.uid() AND status = 'paid' AND created_at >= v_start_of_month;

        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Transaksi Kasir bulanan (50) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    -- C. RECEIPTS / TANDA TERIMA (5 / month)
    ELSIF TG_TABLE_NAME = 'receipts' THEN
        v_limit := 5;
        SELECT COUNT(*) INTO v_current_count FROM public.receipts
        WHERE user_id = auth.uid() AND created_at >= v_start_of_month;

        SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
        WHERE user_id = auth.uid() AND LOWER(module) = 'tandaterima' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

        IF (v_current_count + v_deleted_count) >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Tanda Terima bulanan (5) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    -- D. PURCHASE ORDERS (5 / month)
    ELSIF TG_TABLE_NAME = 'purchase_orders' THEN
        v_limit := 5;
        SELECT COUNT(*) INTO v_current_count FROM public.purchase_orders
        WHERE user_id = auth.uid() AND created_at >= v_start_of_month;

        SELECT COUNT(*) INTO v_deleted_count FROM public.audit_logs
        WHERE user_id = auth.uid() AND LOWER(module) = 'purchaseorder' AND LOWER(action) LIKE '%delete%' AND created_at >= v_start_of_month;

        IF (v_current_count + v_deleted_count) >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Purchase Order bulanan (5) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    -- E. CASHBOOK MANUAL ENTRIES (20 / month)
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

    -- F. CLIENTS (10 total)
    ELSIF TG_TABLE_NAME = 'clients' THEN
        v_limit := 10;
        SELECT COUNT(*) INTO v_current_count FROM public.clients
        WHERE user_id = auth.uid();

        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Klien (10) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    -- G. ACTIVE PRODUCTS (20 total)
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

-- ─────────────────────────────────────────────────────────────
-- ATTACH TRIGGERS TO ALL 7 QUOTA-GUARDED TABLES
-- ─────────────────────────────────────────────────────────────

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
