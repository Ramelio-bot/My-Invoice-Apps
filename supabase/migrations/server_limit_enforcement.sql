-- ============================================================
-- 🛡️ SERVER-SIDE LIMIT ENFORCEMENT (MONTHLY QUOTAS)
-- Menyelaraskan batas bulanan paket Free sesuai dengan UI PlanContext
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_user_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_user_plan TEXT;
    v_current_count INTEGER;
    v_start_of_month TIMESTAMP;
    v_limit INTEGER;
BEGIN
    -- 1. Ambil status plan aktif milik user
    SELECT plan INTO v_user_plan FROM public.profiles WHERE id = auth.uid();
    
    -- Jika user tidak free (Pro/Ultimate) atau auth.uid() tidak ada (system backend insert), biarkan lolos
    IF v_user_plan IS NULL OR v_user_plan != 'free' THEN
        RETURN NEW;
    END IF;

    -- 2. Tentukan batas awal bulan berjalan (UTC)
    v_start_of_month := date_trunc('month', NOW() AT TIME ZONE 'UTC');

    -- 3. Logika untuk tabel DOCUMENTS
    IF TG_TABLE_NAME = 'documents' THEN
        IF NEW.type = 'invoice' THEN
            v_limit := 30;
            SELECT COUNT(*) INTO v_current_count FROM public.documents 
            WHERE user_id = auth.uid() AND type = 'invoice' AND created_at >= v_start_of_month;
            
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Invoice bulanan (30) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;

        ELSIF NEW.type = 'kw' THEN
            v_limit := 30;
            SELECT COUNT(*) INTO v_current_count FROM public.documents 
            WHERE user_id = auth.uid() AND type = 'kw' AND created_at >= v_start_of_month;
            
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Kwitansi bulanan (30) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;

        ELSIF NEW.type IN ('hutang', 'piutang') THEN
            v_limit := 30;
            SELECT COUNT(*) INTO v_current_count FROM public.documents 
            WHERE user_id = auth.uid() AND type IN ('hutang', 'piutang') AND created_at >= v_start_of_month;
            
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Hutang/Piutang bulanan (30) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;

        ELSIF NEW.type = 'sph' THEN
            v_limit := 20;
            SELECT COUNT(*) INTO v_current_count FROM public.documents 
            WHERE user_id = auth.uid() AND type = 'sph' AND created_at >= v_start_of_month;
            
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Quotation/Penawaran bulanan (20) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;
            
        ELSIF NEW.type = 'download' THEN
            v_limit := 5;
            SELECT COUNT(*) INTO v_current_count FROM public.documents 
            WHERE user_id = auth.uid() AND type = 'download' AND created_at >= v_start_of_month;
            
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Download bulanan (5) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;
        END IF;

    -- 4. Logika untuk tabel KASIR TRANSACTIONS
    ELSIF TG_TABLE_NAME = 'kasir_transactions' THEN
        v_limit := 200;
        SELECT COUNT(*) INTO v_current_count FROM public.kasir_transactions 
        WHERE user_id = auth.uid() AND status = 'paid' AND created_at >= v_start_of_month;
        
        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Transaksi Kasir bulanan (200) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;
        
    -- 5. Logika untuk tabel RECEIPTS (Tanda Terima)
    ELSIF TG_TABLE_NAME = 'receipts' THEN
        v_limit := 20;
        SELECT COUNT(*) INTO v_current_count FROM public.receipts 
        WHERE user_id = auth.uid() AND created_at >= v_start_of_month;
        
        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Tanda Terima bulanan (20) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;
        
    -- 6. Logika untuk tabel PURCHASE ORDERS
    ELSIF TG_TABLE_NAME = 'purchase_orders' THEN
        v_limit := 20;
        SELECT COUNT(*) INTO v_current_count FROM public.purchase_orders 
        WHERE user_id = auth.uid() AND created_at >= v_start_of_month;
        
        IF v_current_count >= v_limit THEN
            RAISE EXCEPTION 'Batas kuota Purchase Order bulanan (20) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
        END IF;

    -- 7. Logika untuk tabel CASHBOOK
    ELSIF TG_TABLE_NAME = 'cashbook' THEN
        v_limit := 30;
        -- Hanya batasi transaksi manual (abaikan transaksi otomatis dari kwitansi/invoice/dsb)
        IF NEW.category NOT IN ('Kwitansi', 'Invoice Lunas', 'Lunas', 'Pembayaran Piutang', 'Pembayaran Hutang') THEN
            SELECT COUNT(*) INTO v_current_count FROM public.cashbook 
            WHERE user_id = auth.uid() 
              AND category NOT IN ('Kwitansi', 'Invoice Lunas', 'Lunas', 'Pembayaran Piutang', 'Pembayaran Hutang')
              AND created_at >= v_start_of_month;
              
            IF v_current_count >= v_limit THEN
                RAISE EXCEPTION 'Batas kuota Catatan Bisnis bulanan (30) untuk paket Free telah tercapai. Silakan upgrade ke Pro/Ultimate.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- PASANG TRIGGER PADA SEMUA TABEL TERKAIT
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

-- COMMITED: limit enforcement aktif
COMMIT;
