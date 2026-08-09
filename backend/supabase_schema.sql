-- 1. Create PROFILES table (extending Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create TESTS table
CREATE TABLE tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT UNIQUE NOT NULL, -- Added UNIQUE to support idempotency/upsert
  category TEXT NOT NULL, -- e.g., 'JEE', 'NEET'
  duration_minutes INTEGER DEFAULT 180,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- Optional: if set, exam is locked until this datetime
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- MIGRATION NOTE: If the DB already exists, run this in the Supabase SQL Editor:
-- ALTER TABLE tests ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 3. Create QUESTIONS table
CREATE TABLE questions (
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
CREATE TABLE submissions (
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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- PROFILES: Users can view their own; Admins can view all.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- TESTS & QUESTIONS: Everyone can view; Only admins can modify.
CREATE POLICY "Everyone can view tests" ON tests FOR SELECT USING (true);
CREATE POLICY "Admins can manage tests" ON tests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Everyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SUBMISSIONS: Users can manage their own; Admins can view all.
CREATE POLICY "Users can manage own submissions" ON submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all submissions" ON submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. TRIGGER: Automatically create a profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
