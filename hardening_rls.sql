-- 1. Perbarui Policy untuk tabel documents
DROP POLICY IF EXISTS "Users access own documents" ON public.documents;
CREATE POLICY "Users access own outlet documents" ON public.documents 
FOR ALL USING (
    auth.uid() = user_id 
    AND (outlet_id IS NULL OR outlet_id = (auth.jwt()->>'assigned_outlet')::uuid)
);

-- 2. Perbarui Policy untuk tabel cashbook
DROP POLICY IF EXISTS "Users access own cashbook" ON public.cashbook;
CREATE POLICY "Users access own outlet cashbook" ON public.cashbook 
FOR ALL USING (
    auth.uid() = user_id 
    AND (outlet_id IS NULL OR outlet_id = (auth.jwt()->>'assigned_outlet')::uuid)
);

-- 3. Perbarui Policy untuk tabel kasir_transactions
DROP POLICY IF EXISTS "Users access own transactions" ON public.kasir_transactions;
CREATE POLICY "Users access own outlet transactions" ON public.kasir_transactions 
FOR ALL USING (
    auth.uid() = user_id 
    AND (outlet_id = (auth.jwt()->>'assigned_outlet')::uuid)
);
