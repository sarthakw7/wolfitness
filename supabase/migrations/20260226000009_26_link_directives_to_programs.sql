-- Migration: 26_link_directives_to_programs
-- Description: Adds program_id to the directives table to allow task categorization by path.

ALTER TABLE public.directives ADD COLUMN program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL;

-- Ensure RLS allows the fetch (already covered by existing policies, but good to be aware)
