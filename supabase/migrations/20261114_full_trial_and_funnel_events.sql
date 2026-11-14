-- ============================================================================
-- Migration: Full-Access 14-Day Trial Documentation + Conversion Funnel Events
-- Date: 2026-11-14
-- ============================================================================

-- 1. First-party Conversion Funnel Telemetry Table
CREATE TABLE IF NOT EXISTS public.conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    plan TEXT,
    page_path TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at
    ON public.conversion_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversion_events_event_name
    ON public.conversion_events (event_name);

CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id
    ON public.conversion_events (user_id);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated clients to log funnel events safely
DROP POLICY IF EXISTS "conversion_events_insert_any" ON public.conversion_events;
CREATE POLICY "conversion_events_insert_any"
    ON public.conversion_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins may read aggregate funnel telemetry
DROP POLICY IF EXISTS "conversion_events_select_admin" ON public.conversion_events;
CREATE POLICY "conversion_events_select_admin"
    ON public.conversion_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 2. Allow admins to audit Mayar checkout funnel rows (pending vs settled)
DROP POLICY IF EXISTS "mayar_transactions_select_admin" ON public.mayar_transactions;
CREATE POLICY "mayar_transactions_select_admin"
    ON public.mayar_transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );
