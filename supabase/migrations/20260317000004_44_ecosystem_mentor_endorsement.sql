-- ==========================================
-- MIGRATION 5: MENTOR ENDORSEMENT SYSTEM
-- ==========================================
-- This script adds the ability for Signal Mentors to endorse their Coaches,
-- granting them fast-track verification on the WFF marketplace.

-- 1. ADD ENDORSEMENT LINK
ALTER TABLE public.wff_creators
ADD COLUMN IF NOT EXISTS endorsed_by_mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL;

-- 2. CREATE ENDORSEMENT FUNCTION
-- A secure function that allows a mentor to endorse a coach
CREATE OR REPLACE FUNCTION public.endorse_wff_creator(coach_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the person calling this function is actually a mentor
  IF NOT EXISTS (
    SELECT 1 FROM public.mentors WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only mentors can endorse creators.';
  END IF;

  -- Upsert the creator record: if they don't exist in WFF creators yet, add them.
  -- If they do, update their verification status and endorsement link.
  INSERT INTO public.wff_creators (id, is_verified, endorsed_by_mentor_id)
  VALUES (coach_id, true, auth.uid())
  ON CONFLICT (id) DO UPDATE SET
    is_verified = true,
    endorsed_by_mentor_id = auth.uid();
END;
$$;
