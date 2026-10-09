-- =========================================================================
-- Multi-Tenant Architecture Migration: Institutions & Subdomains
-- Run this script in the Supabase SQL Editor
-- =========================================================================

-- 1. Create INSTITUTIONS table
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,                  -- e.g., 'SV', 'DPS', 'IK' (UPPERCASE)
  subdomain TEXT UNIQUE NOT NULL,             -- e.g., 'saivikash', 'dps' (LOWERCASE)
  name TEXT NOT NULL,                         -- e.g., 'Sai Vikash Educational Institutions'
  logo_url TEXT,                              -- Storage link or asset path
  brand_theme JSONB DEFAULT '{
    "primary": "#1282a2",
    "secondary": "#034078",
    "accent": "#00f0ff",
    "darkBulbTop": "#1282a2",
    "darkBulbBottom": "#034078"
  }'::jsonb,
  contact_email TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Case-insensitive / rapid indexes
CREATE INDEX IF NOT EXISTS idx_institutions_code ON public.institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_subdomain ON public.institutions(subdomain);

-- 2. Add institution_id to PROFILES (Students)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles(institution_id);

-- 3. Add institution_id and is_super_admin to ADMIN_PROFILES (Faculty & Admins)
ALTER TABLE public.admin_profiles 
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_admin_profiles_institution_id ON public.admin_profiles(institution_id);

-- 4. Add institution_id & is_global to TESTS (Examinations)
ALTER TABLE public.tests 
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tests_institution_id ON public.tests(institution_id);
CREATE INDEX IF NOT EXISTS idx_tests_is_global ON public.tests(is_global);

-- 5. Add institution_id to SUBMISSIONS (Exam attempts)
ALTER TABLE public.submissions 
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_submissions_institution_id ON public.submissions(institution_id);

-- =========================================================================
-- SEED INITIAL INSTITUTIONS & MIGRATE CURRENT USERS
-- =========================================================================

-- Seed Central IkshaTests and Sai Vikash
INSERT INTO public.institutions (code, subdomain, name, logo_url, brand_theme, contact_email)
VALUES 
  (
    'IK', 
    'app', 
    'IkshaTests Platform', 
    '/assets/Final_Logo.png',
    '{"primary": "#1282a2", "secondary": "#034078", "accent": "#00f0ff"}'::jsonb,
    'ikshatests@zohomail.in'
  ),
  (
    'SV', 
    'saivikash', 
    'Sai Vikash Educational Institutions', 
    '/assets/sai-vikash-logo.png',
    '{"primary": "#1282a2", "secondary": "#034078", "accent": "#00b4d8"}'::jsonb,
    'admin@saivikash.org'
  )
ON CONFLICT (code) DO UPDATE 
SET 
  subdomain = EXCLUDED.subdomain,
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  brand_theme = EXCLUDED.brand_theme;

-- Set platform owner as super_admin
UPDATE public.admin_profiles
SET is_super_admin = true
WHERE lower(email) = 'karthiksaianala@gmail.com' OR user_id = 'DBA';

-- Link existing Sai Vikash students and admins to Sai Vikash institution
DO $$
DECLARE
  sv_id UUID;
BEGIN
  SELECT id INTO sv_id FROM public.institutions WHERE code = 'SV' LIMIT 1;
  IF sv_id IS NOT NULL THEN
    -- Update profiles with user_id starting with SV or students
    UPDATE public.profiles
    SET institution_id = sv_id
    WHERE institution_id IS NULL AND (user_id ILIKE 'SV%' OR roll_number ILIKE 'SV%');

    -- Update admin profiles with user_id starting with SV or DBA2
    UPDATE public.admin_profiles
    SET institution_id = sv_id
    WHERE institution_id IS NULL AND user_id ILIKE 'SV%';
  END IF;
END $$;

-- Enable Row Level Security on institutions
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Allow public read of active institutions (needed for subdomain branding & login)
DROP POLICY IF EXISTS "Public can view active institutions" ON public.institutions;
CREATE POLICY "Public can view active institutions" 
ON public.institutions FOR SELECT 
USING (status = 'active');

-- Admins / Super Admins can update their institution
DROP POLICY IF EXISTS "Super admins can manage institutions" ON public.institutions;
CREATE POLICY "Super admins can manage institutions" 
ON public.institutions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE id = auth.uid() AND is_super_admin = true
  )
);
