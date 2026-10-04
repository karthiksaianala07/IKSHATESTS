-- 1. Create PROFILES table (Students extending Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_id TEXT UNIQUE, -- Custom login ID / Roll Number (e.g., 'IK2026-101', '128003120')
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  roll_number TEXT,
  class_cohort TEXT DEFAULT 'Class 12', -- 'Class 11', 'Class 12', 'Repeater / Dropper'
  target_exam TEXT DEFAULT 'JEE', -- 'JEE', 'NEET', 'BOTH'
  phone_number TEXT,
  batch_name TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1B. Create DEDICATED ADMIN_PROFILES table (Administrators, Teachers, Faculty)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT UNIQUE, -- Custom admin login ID (e.g., 'DBA', 'FACULTY-01')
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  designation TEXT DEFAULT 'Administrator / Faculty', -- e.g., 'Director', 'Physics Faculty', 'Examiner'
  department TEXT DEFAULT 'Academics',
  permissions JSONB DEFAULT '{"manage_exams": true, "manage_students": true, "view_analytics": true}'::jsonb,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON public.admin_profiles(email);

-- =========================================================================
-- MIGRATION SCRIPT (Copy and run in Supabase SQL Editor if upgrading existing DB)
-- =========================================================================
-- 1. Re-point tests.created_by to auth.users(id) so tests aren't locked to student profiles:
-- ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_created_by_fkey;
-- ALTER TABLE public.tests 
--   ADD CONSTRAINT tests_created_by_fkey 
--   FOREIGN KEY (created_by) 
--   REFERENCES auth.users(id) 
--   ON DELETE SET NULL;

-- 2. Create admin_profiles table:
-- CREATE TABLE IF NOT EXISTS public.admin_profiles (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   email TEXT NOT NULL UNIQUE,
--   full_name TEXT NOT NULL,
--   designation TEXT DEFAULT 'Administrator / Faculty',
--   department TEXT DEFAULT 'Academics',
--   permissions JSONB DEFAULT '{"manage_exams": true, "manage_students": true, "view_analytics": true}'::jsonb,
--   phone_number TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 3. Enable RLS on admin_profiles:
-- ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admins can view all admin profiles" ON public.admin_profiles FOR SELECT USING (public.is_admin());
-- CREATE POLICY "Admins can update own admin profile" ON public.admin_profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Migrate existing admin users from profiles into admin_profiles:
-- INSERT INTO public.admin_profiles (id, email, full_name, designation)
-- SELECT id, email, COALESCE(full_name, 'Platform Administrator'), 'Administrator / Faculty'
-- FROM public.profiles
-- WHERE role = 'admin' OR lower(email) = 'karthiksaianala@gmail.com'
-- ON CONFLICT (id) DO NOTHING;

-- 5. Remove admin records from student profiles table to complete clean separation:
-- DELETE FROM public.profiles WHERE role = 'admin' OR lower(email) = 'karthiksaianala@gmail.com';

-- 3. Create QUESTIONS table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  subject TEXT NOT NULL, -- e.g., 'Physics', 'Chemistry'
  chapter TEXT, -- NCERT Chapter sub-classification
  type TEXT CHECK (type IN ('MCQ', 'NUMERICAL')),
  text TEXT NOT NULL, -- Supports LaTeX
  image_url TEXT, -- Public URL for images stored in Supabase Storage
  sub_text TEXT, -- Optional question text below image (Supports LaTeX)
  options JSONB, -- For MCQs: ['Option A', 'Option B', ...]
  correct_answer TEXT NOT NULL, -- Index for MCQ or string for Numerical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create SUBMISSIONS table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_count INTEGER,
  wrong_count INTEGER,
  skipped_count INTEGER,
  answers JSONB, -- The student's response payload
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 6. HELPER FUNCTION & RLS POLICIES

-- Helper to check admin status without triggering RLS infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES (Students): Users can view and update their own profile; Admins can view all.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (public.is_admin());

-- ADMIN_PROFILES: Only authenticated admins can view and update admin records
CREATE POLICY "Admins can view all admin profiles" ON public.admin_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update own admin profile" ON public.admin_profiles FOR UPDATE USING (auth.uid() = id);

-- TESTS & QUESTIONS: Everyone can view; Only admins can modify.
CREATE POLICY "Everyone can view tests" ON tests FOR SELECT USING (true);
CREATE POLICY "Admins can manage tests" ON tests FOR ALL USING (public.is_admin());

CREATE POLICY "Everyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (public.is_admin());

-- SUBMISSIONS: Users can manage their own; Admins can view all.
CREATE POLICY "Users can manage own submissions" ON submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all submissions" ON submissions FOR SELECT USING (public.is_admin());

-- 7. TRIGGER: Automatically create profile on Signup (Routes to admin_profiles or profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  is_admin_user := (
    COALESCE(new.raw_user_meta_data->>'role', '') = 'admin' OR 
    lower(new.email) = 'karthiksaianala@gmail.com'
  );

  IF is_admin_user THEN
    INSERT INTO public.admin_profiles (
      id,
      email,
      full_name,
      designation,
      department
    )
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Administrator'),
      COALESCE(new.raw_user_meta_data->>'designation', 'Administrator / Faculty'),
      COALESCE(new.raw_user_meta_data->>'department', 'Academics')
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email;
  ELSE
    INSERT INTO public.profiles (
      id, 
      user_id,
      email, 
      full_name, 
      role,
      roll_number,
      class_cohort,
      target_exam,
      phone_number,
      batch_name
    )
    VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'user_id', split_part(new.email, '@', 1)),
      new.email, 
      COALESCE(new.raw_user_meta_data->>'full_name', 'Student Candidate'), 
      'student',
      COALESCE(new.raw_user_meta_data->>'roll_number', new.raw_user_meta_data->>'user_id'),
      COALESCE(new.raw_user_meta_data->>'class_cohort', 'Class 12'),
      COALESCE(new.raw_user_meta_data->>'target_exam', 'JEE'),
      new.raw_user_meta_data->>'phone_number',
      COALESCE(new.raw_user_meta_data->>'batch_name', 'General')
    )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      full_name = EXCLUDED.full_name,
      class_cohort = EXCLUDED.class_cohort,
      target_exam = EXCLUDED.target_exam;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
