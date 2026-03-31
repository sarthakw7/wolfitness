-- Migration: 32_fix_mentor_rls
-- Description: Updates RLS policies for the mentors table to allow mentors to insert their own initial record.

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Mentors can manage own authority record" ON public.mentors;

-- 2. Create a more comprehensive policy
CREATE POLICY "Mentors can manage own authority record" ON public.mentors
  FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Ensure admins can still see everything (for vetting)
CREATE POLICY "Admins can view all mentors" ON public.mentors
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));
