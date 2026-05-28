-- Stabilization Migration: Fix identity schema
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.fitness_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Update comments
COMMENT ON COLUMN public.users.bio IS 'User biography or coach description.';
COMMENT ON COLUMN public.fitness_profiles.gender IS 'Self-identified biological sex for calorie calculations.';
COMMENT ON COLUMN public.fitness_profiles.date_of_birth IS 'User date of birth for age-based biometric analysis.';
