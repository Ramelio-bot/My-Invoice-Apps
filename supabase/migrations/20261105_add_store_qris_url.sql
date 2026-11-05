-- Migration: Add store_qris_url column to profiles table
-- Supports QRIS barcode for Kasir POS and Invoice PDF document rendering

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_qris_url TEXT;

COMMENT ON COLUMN public.profiles.store_qris_url IS 'Public URL / Base64 image of the store QRIS barcode used for customer payments';
