-- 1. Create Enum for User Roles
CREATE TYPE user_role AS ENUM ('consumer', 'coach', 'admin');

-- 2. Create the Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  role user_role DEFAULT 'consumer',
  avatar_url TEXT,
  bio TEXT,
  
  -- Metrics
  height_cm NUMERIC,
  weight_kg NUMERIC,
  
  -- Assessment Fields (Added from updates)
  vibe_type TEXT,
  gender TEXT,
  date_of_birth DATE,
  goal TEXT,
  experience_level TEXT,
  training_availability TEXT[], -- e.g. ['Mon', 'Wed', 'Fri'] or just number of days
  equipment_access TEXT[],
  injuries TEXT[],
  
  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_height CHECK (height_cm > 0 OR height_cm IS NULL),
  CONSTRAINT positive_weight CHECK (weight_kg > 0 OR weight_kg IS NULL)
);

-- 3. Create Indexes for Performance
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 4. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
-- Public Read: Anyone can read basic profile info
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Self Insert: Users can create their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Self Update: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 6. Auto-update Timestamp Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 7. Automate Profile Creation on Signup (Updated version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 8. Vibe Assessments Table
CREATE TABLE public.vibe_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- We use JSONB so we can change questions later without breaking the DB
  answers JSONB NOT NULL, 
  
  -- The result of the assessment
  calculated_vibe TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Vibe Assessments
ALTER TABLE public.vibe_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own assessment"
ON public.vibe_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own assessment"
ON public.vibe_assessments FOR SELECT
USING (auth.uid() = user_id);

-- 9. Coaches Table
CREATE TABLE public.coaches (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialization TEXT[], -- Array of strings
  years_experience TEXT,
  certifications TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  website TEXT,
  headline TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Coaches
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can update own profile" ON public.coaches FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public can view coaches" ON public.coaches FOR SELECT USING (true);

-- 10. Programs Table (Marketplace Products)
CREATE TABLE public.programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_weeks INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  vibe_type TEXT, -- For matching with user vibe
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Public can view published programs
CREATE POLICY "Public can view published programs" 
ON public.programs FOR SELECT 
USING (is_published = true);

-- Coaches can view/edit their own programs (published or not)
CREATE POLICY "Coaches can manage own programs" 
ON public.programs FOR ALL 
USING (auth.uid() = coach_id);

-- 11. Enrollments Table (User purchases)
CREATE TABLE public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, program_id) -- Prevent duplicate enrollments
);

-- RLS Policies for Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" 
ON public.enrollments FOR SELECT 
USING (auth.uid() = user_id);

-- Users can enroll themselves (simplified for now, usually backend handles this after payment)
CREATE POLICY "Users can enroll themselves" 
ON public.enrollments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 12. Program Builder Schema (Weeks, Days, Exercises)

-- Table: Program Weeks
CREATE TABLE public.program_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  title TEXT, -- e.g. "Accumulation Phase"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(program_id, week_number)
);

-- Table: Program Days
CREATE TABLE public.program_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES public.program_weeks(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL, -- 1-7
  title TEXT, -- e.g. "Leg Day"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(week_id, day_number)
);

-- Table: Program Exercises
CREATE TABLE public.program_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID REFERENCES public.program_days(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL, -- e.g. "Back Squat"
  sets INTEGER,
  reps TEXT, -- "10" or "8-12"
  rpe TEXT, -- "8"
  rest_seconds INTEGER,
  notes TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Builder

ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can manage everything linked to their programs
-- (This requires a join, which is complex in RLS, so for v1 we often simplify or use functions.
-- For now, we will use a simplified check or assume the API handles authz for writing)

-- Simple Read Policy: Public/Enrolled can read
CREATE POLICY "Public can view weeks" ON public.program_weeks FOR SELECT USING (true);
CREATE POLICY "Public can view days" ON public.program_days FOR SELECT USING (true);
CREATE POLICY "Public can view exercises" ON public.program_exercises FOR SELECT USING (true);

-- Simple Write Policy: Allow authenticated users (Coaches) to write. 
-- IN PRODUCTION: You must add a CHECK that auth.uid() owns the parent program.
CREATE POLICY "Coaches can insert weeks" ON public.program_weeks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Coaches can insert days" ON public.program_days FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Coaches can insert exercises" ON public.program_exercises FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 13. User Workout Logs (Tracking Progress)
CREATE TABLE public.user_workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  day_id UUID REFERENCES public.program_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.program_exercises(id) ON DELETE CASCADE NOT NULL,
  
  set_number INTEGER NOT NULL,
  reps_completed INTEGER,
  weight_kg NUMERIC,
  rpe_actual NUMERIC,
  
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate logs for the same set in the same session (simplified)
  -- In a real app, we might handle multiple sessions per day, but this is good for v1.
  UNIQUE(user_id, day_id, exercise_id, set_number) 
);

-- RLS Policies for Logs
ALTER TABLE public.user_workout_logs ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own logs
CREATE POLICY "Users can manage own logs" 
ON public.user_workout_logs FOR ALL 
USING (auth.uid() = user_id);
