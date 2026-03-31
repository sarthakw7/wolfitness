-- ==========================================
-- MIGRATION 48: WFF SECURITY & SCHEMA REPAIR
-- ==========================================

-- 1. FIX WFF_CREATORS RLS (The "Ghost" Error Fix)
-- New coaches need permission to INSERT their initial profile.
-- We use 'FOR ALL' to combine INSERT, SELECT, UPDATE, and DELETE permissions for the owner.
DROP POLICY IF EXISTS "Creators can update own profile" ON public.wff_creators;
DROP POLICY IF EXISTS "Creators can manage own profile" ON public.wff_creators;

CREATE POLICY "Creators can manage own profile" 
ON public.wff_creators FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. HARDEN PROGRAM BUILDER RLS
-- Previously these were "authenticated", which allowed anyone to edit any program.
-- We now restrict it so only the owner of the program can edit its weeks, days, and exercises.

-- Helper function to check program ownership (Prevents duplicating logic)
CREATE OR REPLACE FUNCTION public.is_program_owner(target_program_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.wff_programs
    WHERE id = target_program_id 
    AND creator_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix Weeks
DROP POLICY IF EXISTS "Creators manage weeks" ON public.wff_program_weeks;
CREATE POLICY "Owners manage weeks" ON public.wff_program_weeks 
FOR ALL USING (public.is_program_owner(program_id));

-- Fix Days
DROP POLICY IF EXISTS "Creators manage days" ON public.wff_program_days;
CREATE POLICY "Owners manage days" ON public.wff_program_days 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.wff_program_weeks
    WHERE id = week_id AND public.is_program_owner(program_id)
  )
);

-- Fix Exercises
DROP POLICY IF EXISTS "Creators manage exercises" ON public.wff_program_exercises;
CREATE POLICY "Owners manage exercises" ON public.wff_program_exercises 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.wff_program_days d
    JOIN public.wff_program_weeks w ON d.week_id = w.id
    WHERE d.id = day_id AND public.is_program_owner(w.program_id)
  )
);

-- 3. SCHEMA ALIGNMENT
COMMENT ON TABLE public.wff_creators IS 'WFF Creator profiles linked to Signal Ecosystem identities.';
