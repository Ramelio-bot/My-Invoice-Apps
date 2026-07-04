CREATE OR REPLACE FUNCTION public.fn_execute_business_simulation()
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_outlet_a UUID;
    v_outlet_b UUID;
    v_client_id UUID;
BEGIN
    -- 1. Ambil UUID user yang sedang login secara aman dari session server
    v_user_id := auth.uid();
    
    -- Jaga-jaga jika dipanggil oleh anon/unauthenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '🚨 UNAUTHORIZED: Anda harus login untuk menjalankan simulasi.';
    END IF;

    -- 2. Validasi ketat: Pastikan caller memiliki role admin di tabel profiles
    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
    IF v_user_role IS NULL OR v_user_role != 'admin' THEN
        RAISE EXCEPTION '🚨 FORBIDDEN: Akses ditolak. Hanya akun berstatus Admin yang dapat mengeksekusi simulasi ini!';
    END IF;

    -- 3. CLEANING OLD SIMULATION MOCK DATA (Hanya untuk user yang terautentikasi ini)
    DELETE FROM public.kasir_transactions WHERE user_id = v_user_id;
    DELETE FROM public.invoices WHERE user_id = v_user_id;
    DELETE FROM public.purchase_orders WHERE user_id = v_user_id;
    DELETE FROM public.kasir_products WHERE user_id = v_user_id;
    DELETE FROM public.outlets WHERE user_id = v_user_id;

    -- 4. CREATE MULTI-OUTLET MOCK DATA
    INSERT INTO public.outlets (user_id, name, type) VALUES (v_user_id, 'DigiCable Co. (Cabang A)', 'Elektrikal') RETURNING id INTO v_outlet_a;
    INSERT INTO public.outlets (user_id, name, type) VALUES (v_user_id, 'Maju Material (Cabang B)', 'Bangunan') RETURNING id INTO v_outlet_b;

    -- 5. SEED PRODUCTS WITH STOCKS
    INSERT INTO public.kasir_products (user_id, outlet_id, name, sku, price, stock) VALUES
    (v_user_id, v_outlet_a, 'Kabel NYM 2x1.5m', 'KBL-NYM-01', 15000, 500),
    (v_user_id, v_outlet_a, 'Stopkontak 4 Lubang', 'STP-4LB-02', 35000, 150),
    (v_user_id, v_outlet_b, 'Semen Padang 50kg', 'SMN-PDG-01', 65000, 1000),
    (v_user_id, v_outlet_b, 'Besi Beton 10mm', 'BSI-BTN-02', 85000, 300);

    -- 6. SEED CLIENTS, PO, INVOICE & ACCOUNTS RECEIVABLE (PIUTANG)
    INSERT INTO public.clients (user_id, name, email, phone) VALUES (v_user_id, 'PT Kontraktor Utama Salatiga', 'project@kontraktor.com', '08123456789') RETURNING id INTO v_client_id;
    INSERT INTO public.purchase_orders (user_id, client_id, po_number, total_amount, status) VALUES (v_user_id, v_client_id, 'PO-2026-001', 7500000, 'Approved');
    INSERT INTO public.invoices (user_id, client_id, invoice_number, total_amount, status, due_date) VALUES (v_user_id, v_client_id, 'INV-2026-001', 7500000, 'Unpaid', NOW() + INTERVAL '14 days');
    INSERT INTO public.accounts_receivable (user_id, client_id, amount, description, status) VALUES (v_user_id, v_client_id, 7500000, 'Piutang Project Material Cabang B', 'Unpaid');

    -- 7. SEED BUSINESS NOTES
    INSERT INTO public.business_notes (user_id, title, category, amount, type) VALUES (v_user_id, 'Suntikan Modal Awal Simulasi', 'Modal', 50000000, 'Income');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
