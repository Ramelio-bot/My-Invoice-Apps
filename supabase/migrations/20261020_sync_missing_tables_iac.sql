-- ==============================================================================
-- MIGRATION: 20261020_sync_missing_tables_iac.sql
-- DESCRIPTION: Sync remaining 12 cloud-only tables to IaC repository with full RLS,
--              tenant isolation policies, and performance indexes.
-- ==============================================================================

-- 1. OUTLETS
CREATE TABLE IF NOT EXISTS public.outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'outlets' AND policyname = 'outlets_tenant_isolation'
    ) THEN
        CREATE POLICY "outlets_tenant_isolation" ON public.outlets
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_outlets_user_id ON public.outlets(user_id);

-- 2. KASIR_SHIFTS
CREATE TABLE IF NOT EXISTS public.kasir_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.kasir_employees(id) ON DELETE SET NULL,
    employee_name TEXT,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    initial_cash NUMERIC(15, 2) DEFAULT 0,
    total_cash_sales NUMERIC(15, 2) DEFAULT 0,
    total_cash_expenses NUMERIC(15, 2) DEFAULT 0,
    expected_cash NUMERIC(15, 2) DEFAULT 0,
    actual_cash NUMERIC(15, 2),
    cash_difference NUMERIC(15, 2),
    status TEXT DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kasir_shifts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'kasir_shifts' AND policyname = 'kasir_shifts_tenant_isolation'
    ) THEN
        CREATE POLICY "kasir_shifts_tenant_isolation" ON public.kasir_shifts
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kasir_shifts_user_id ON public.kasir_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_kasir_shifts_outlet_id ON public.kasir_shifts(outlet_id);

-- 3. KASIR_MEMBERS
CREATE TABLE IF NOT EXISTS public.kasir_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    points INTEGER DEFAULT 0,
    total_spent NUMERIC(15, 2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kasir_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'kasir_members' AND policyname = 'kasir_members_tenant_isolation'
    ) THEN
        CREATE POLICY "kasir_members_tenant_isolation" ON public.kasir_members
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kasir_members_user_id ON public.kasir_members(user_id);
CREATE INDEX IF NOT EXISTS idx_kasir_members_phone ON public.kasir_members(phone);

-- 4. KASIR_OPEN_BILLS
CREATE TABLE IF NOT EXISTS public.kasir_open_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    table_number TEXT,
    customer_name TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kasir_open_bills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'kasir_open_bills' AND policyname = 'kasir_open_bills_tenant_isolation'
    ) THEN
        CREATE POLICY "kasir_open_bills_tenant_isolation" ON public.kasir_open_bills
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kasir_open_bills_user_id ON public.kasir_open_bills(user_id);

-- 5. KASIR_POINTS_HISTORY
CREATE TABLE IF NOT EXISTS public.kasir_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.kasir_members(id) ON DELETE CASCADE,
    points_changed INTEGER NOT NULL,
    reason TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kasir_points_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'kasir_points_history' AND policyname = 'kasir_points_history_tenant_isolation'
    ) THEN
        CREATE POLICY "kasir_points_history_tenant_isolation" ON public.kasir_points_history
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kasir_points_history_member ON public.kasir_points_history(member_id);

-- 6. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_tenant_isolation'
    ) THEN
        CREATE POLICY "audit_logs_tenant_isolation" ON public.audit_logs
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 7. ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'activity_logs_tenant_isolation'
    ) THEN
        CREATE POLICY "activity_logs_tenant_isolation" ON public.activity_logs
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- 8. DOWNLOAD_LOGS
CREATE TABLE IF NOT EXISTS public.download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT,
    document_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'download_logs' AND policyname = 'download_logs_tenant_isolation'
    ) THEN
        CREATE POLICY "download_logs_tenant_isolation" ON public.download_logs
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON public.download_logs(user_id);

-- 9. DEBTS_RECEIVABLES
CREATE TABLE IF NOT EXISTS public.debts_receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    party_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.debts_receivables ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'debts_receivables' AND policyname = 'debts_receivables_tenant_isolation'
    ) THEN
        CREATE POLICY "debts_receivables_tenant_isolation" ON public.debts_receivables
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_debts_receivables_user_id ON public.debts_receivables(user_id);

-- 10. HPP_RECORDS
CREATE TABLE IF NOT EXISTS public.hpp_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    target_selling_price NUMERIC(15, 2) DEFAULT 0,
    total_hpp NUMERIC(15, 2) DEFAULT 0,
    profit_margin NUMERIC(5, 2) DEFAULT 0,
    ingredients JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hpp_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'hpp_records' AND policyname = 'hpp_records_tenant_isolation'
    ) THEN
        CREATE POLICY "hpp_records_tenant_isolation" ON public.hpp_records
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hpp_records_user_id ON public.hpp_records(user_id);

-- 11. PURCHASE_ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'purchase_order_items_isolation'
    ) THEN
        CREATE POLICY "purchase_order_items_isolation" ON public.purchase_order_items
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.purchase_orders po
                    WHERE po.id = purchase_order_items.purchase_order_id
                    AND po.user_id = auth.uid()
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON public.purchase_order_items(purchase_order_id);

-- 12. TELEGRAM_AUTH_CODES
CREATE TABLE IF NOT EXISTS public.telegram_auth_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    telegram_chat_id TEXT,
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.telegram_auth_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'telegram_auth_codes' AND policyname = 'telegram_auth_codes_tenant_isolation'
    ) THEN
        CREATE POLICY "telegram_auth_codes_tenant_isolation" ON public.telegram_auth_codes
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_user_id ON public.telegram_auth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_code ON public.telegram_auth_codes(code);

-- GRANTS FOR AUTHENTICATED AND SERVICE_ROLE
GRANT ALL ON TABLE public.outlets TO authenticated, service_role;
GRANT ALL ON TABLE public.kasir_shifts TO authenticated, service_role;
GRANT ALL ON TABLE public.kasir_members TO authenticated, service_role;
GRANT ALL ON TABLE public.kasir_open_bills TO authenticated, service_role;
GRANT ALL ON TABLE public.kasir_points_history TO authenticated, service_role;
GRANT ALL ON TABLE public.audit_logs TO authenticated, service_role;
GRANT ALL ON TABLE public.activity_logs TO authenticated, service_role;
GRANT ALL ON TABLE public.download_logs TO authenticated, service_role;
GRANT ALL ON TABLE public.debts_receivables TO authenticated, service_role;
GRANT ALL ON TABLE public.hpp_records TO authenticated, service_role;
GRANT ALL ON TABLE public.purchase_order_items TO authenticated, service_role;
GRANT ALL ON TABLE public.telegram_auth_codes TO authenticated, service_role;
