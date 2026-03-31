-- ==========================================
-- MIGRATION 3: WFF PROGRAM BUILDER
-- ==========================================
-- This script creates the hierarchical structure for building fitness programs
-- (Weeks -> Days -> Exercises) in the WFF marketplace.

-- 1. PROGRAM WEEKS
CREATE TABLE IF NOT EXISTS public.wff_program_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.wff_programs(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(program_id, week_number)
);

-- 2. PROGRAM DAYS
CREATE TABLE IF NOT EXISTS public.wff_program_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES public.wff_program_weeks(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL, -- e.g., Day 1, Day 2
  title TEXT, -- e.g., "Heavy Push Day"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(week_id, day_number)
);

-- 3. PROGRAM EXERCISES
CREATE TABLE IF NOT EXISTS public.wff_program_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID REFERENCES public.wff_program_days(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT, -- Stored as text to support ranges like "8-12"
  rpe TEXT,
  rest_seconds INTEGER,
  notes TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES FOR BUILDER
ALTER TABLE public.wff_program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wff_program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wff_program_exercises ENABLE ROW LEVEL SECURITY;

-- Public can view the structure of programs
CREATE POLICY "Public can view weeks" ON public.wff_program_weeks FOR SELECT USING (true);
CREATE POLICY "Public can view days" ON public.wff_program_days FOR SELECT USING (true);
CREATE POLICY "Public can view exercises" ON public.wff_program_exercises FOR SELECT USING (true);

-- Authenticated creators can manage their program structure
-- (In a strict production environment, this would use a function to check program ownership)
CREATE POLICY "Creators manage weeks" ON public.wff_program_weeks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Creators manage days" ON public.wff_program_days FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Creators manage exercises" ON public.wff_program_exercises FOR ALL USING (auth.role() = 'authenticated');
