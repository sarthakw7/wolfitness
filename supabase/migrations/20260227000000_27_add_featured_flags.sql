-- Migration: 27_add_featured_flags
-- Description: Adds is_featured flags to mentors and programs for platform orchestration.

-- Add is_featured to mentors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mentors' AND column_name='is_featured') THEN
        ALTER TABLE public.mentors ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_featured to programs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='is_featured') THEN
        ALTER TABLE public.programs ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update RLS for Admin management (assuming profiles.role = 'admin')
-- Note: Service role key used for most admin ops, but good to have policies.
CREATE POLICY "Admins can update all mentors" ON public.mentors
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update all programs" ON public.programs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
