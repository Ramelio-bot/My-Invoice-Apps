-- Fix DOSA 400: Database Schema Mismatch
-- Menambahkan kolom user_id yang terlewat dan mengubah tipe data subtotal menjadi BIGINT/numeric
-- agar terhindar dari error overflow dan memastikan matching dengan data yang dikirim frontend Kasir.jsx

-- 1. Tambahkan kolom user_id (jika belum ada)
ALTER TABLE public.kasir_transaction_items
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ubah tipe data subtotal menjadi BIGINT (agar tidak overflow jika jumlahnya besar)
ALTER TABLE public.kasir_transaction_items
ALTER COLUMN subtotal TYPE BIGINT;
