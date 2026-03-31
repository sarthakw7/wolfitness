-- Migration: 19_fix_enrollment_constraints
-- Description: Allows a coach to enroll in multiple programs from the same mentor.

-- 1. Remove the old restrictive constraint
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_coach_id_mentor_id_key;

-- 2. Add a new unique constraint that includes program_id
-- This allows: One general alignment (NULL program_id) AND multiple specific program enrollments.
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_coach_mentor_program_idx 
ON public.enrollments (coach_id, mentor_id, (COALESCE(program_id, '00000000-0000-0000-0000-000000000000'::uuid)));

-- 3. Also add a standard unique constraint for cases where program_id is present
ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_unique_selection 
UNIQUE (coach_id, program_id);
