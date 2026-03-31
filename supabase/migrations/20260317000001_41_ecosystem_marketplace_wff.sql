-- ==========================================
-- MIGRATION 2: WFF MARKETPLACE & PRODUCTS
-- ==========================================
-- This script adds the core Wolfitness marketplace tables to the 
-- Signal database, keeping them cleanly namespaced with "wff_".

-- 1. VIBE ASSESSMENTS (Consumer Onboarding)
CREATE TABLE IF NOT EXISTS public.wff_vibe_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- JSONB for flexible question/answer structures
  answers JSONB NOT NULL, 
  calculated_vibe TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Vibe Assessments
ALTER TABLE public.wff_vibe_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own vibe" ON public.wff_vibe_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own vibe" ON public.wff_vibe_assessments FOR SELECT USING (auth.uid() = user_id);

-- 2. WFF CREATORS (Track 1 Traditional Route)
-- Note: Signal Mentors do not need to be in this table to sell. 
-- This is specifically for native WFF trainers who applied directly.
CREATE TABLE IF NOT EXISTS public.wff_creators (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialization TEXT[],
  years_experience TEXT,
  certifications TEXT,
  social_instagram TEXT,
  website TEXT,
  headline TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for WFF Creators
ALTER TABLE public.wff_creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view WFF Creators" ON public.wff_creators FOR SELECT USING (true);
CREATE POLICY "Creators can update own profile" ON public.wff_creators FOR UPDATE USING (auth.uid() = id);

-- 3. WFF PROGRAMS (The Core Product)
-- This table holds the actual fitness programs sold on the marketplace.
CREATE TABLE IF NOT EXISTS public.wff_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- creator_id links to the base profile. This is crucial because 
  -- BOTH a 'mentor' (Signal) and a 'coach' (WFF Creator) can own a program.
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, 
  
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_weeks INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  vibe_type TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- THE FRANCHISE SYSTEM LINKS
  -- If this program is a clone, it points back to the Master Template
  parent_template_id UUID REFERENCES public.wff_programs(id) ON DELETE SET NULL,
  -- And it points back to the original Mentor who created the template
  origin_mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,

  -- Is this program a Master Template that others are allowed to clone?
  is_master_template BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at for programs
CREATE TRIGGER set_wff_programs_updated_at
  BEFORE UPDATE ON public.wff_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS for WFF Programs
ALTER TABLE public.wff_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published programs" ON public.wff_programs FOR SELECT USING (is_published = true);
-- Creators can manage their own programs
CREATE POLICY "Creators can manage own programs" ON public.wff_programs FOR ALL USING (auth.uid() = creator_id);
