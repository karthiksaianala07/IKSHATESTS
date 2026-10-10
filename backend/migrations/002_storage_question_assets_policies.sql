-- =========================================================================
-- Migration: Supabase Storage RLS Policies for 'question-assets' bucket
-- Run this script in the Supabase SQL Editor to enable direct client uploads
-- =========================================================================

-- 1. Ensure the 'question-assets' bucket exists and is marked public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-assets', 
  'question-assets', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760;

-- 2. Enable RLS on storage.objects (standard in Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read Access (anyone can view question images/diagrams)
DROP POLICY IF EXISTS "Public can view question-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to question-assets" ON storage.objects;
CREATE POLICY "Public can view question-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-assets');

-- 4. Policy: Allow uploads (INSERT) to question-assets
DROP POLICY IF EXISTS "Allow authenticated uploads to question-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to question-assets" ON storage.objects;
CREATE POLICY "Allow uploads to question-assets"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'question-assets');

-- 5. Policy: Allow updates (UPDATE) to question-assets
DROP POLICY IF EXISTS "Allow updates to question-assets" ON storage.objects;
CREATE POLICY "Allow updates to question-assets"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'question-assets')
WITH CHECK (bucket_id = 'question-assets');

-- 6. Policy: Allow deletes (DELETE) from question-assets
DROP POLICY IF EXISTS "Allow deletes from question-assets" ON storage.objects;
CREATE POLICY "Allow deletes from question-assets"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'question-assets');
