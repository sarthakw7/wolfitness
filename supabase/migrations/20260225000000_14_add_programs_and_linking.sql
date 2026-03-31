-- Migration: 14_add_programs_and_linking
-- Description: Adds programs table and links sessions/enrollments to programs.

-- 1. Create Enums for Program Management
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_status') THEN
        CREATE TYPE public.program_status AS ENUM ('draft', 'published', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_price_type') THEN
        CREATE TYPE public.program_price_type AS ENUM ('flat_fee', 'subscription');
    END IF;
END $$;

-- 2. Create the Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  duration_text text NOT NULL, -- e.g., '6 Months', '1 Hour', 'Ongoing'
  price_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  price_type public.program_price_type NOT NULL DEFAULT 'flat_fee',
  status public.program_status NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.mentors(id) ON DELETE CASCADE
);

-- 3. Add program_id to Sessions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='program_id') THEN
        ALTER TABLE public.sessions ADD COLUMN program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Add program_id to Enrollments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='program_id') THEN
        ALTER TABLE public.enrollments ADD COLUMN program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Enable RLS on programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Public/Coaches can see published programs
CREATE POLICY "Anyone can view published programs" ON public.programs
  FOR SELECT USING (status = 'published');

-- Mentors can manage their own programs
CREATE POLICY "Mentors can manage their own programs" ON public.programs
  FOR ALL USING (auth.uid() = mentor_id);
