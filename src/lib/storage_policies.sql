-- Supabase Storage RLS Policies for My Invoice
-- Run this in the Supabase SQL Editor to enable image uploads

-- 1. BUCKET: product-images
-- Allow public to view images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated User Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/delete their own images
CREATE POLICY "Authenticated User Update" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated User Delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);


-- 2. BUCKET: company-logos
-- Allow public to view logos
CREATE POLICY "Public Access Logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated User Upload Logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'company-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/delete their own logos
CREATE POLICY "Authenticated User Update Logos" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'company-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated User Delete Logos" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'company-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
