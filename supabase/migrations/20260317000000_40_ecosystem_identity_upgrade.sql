-- ==========================================
-- MIGRATION 1: ECOSYSTEM IDENTITY UPGRADE
-- ==========================================
-- This script upgrades the Signal authentication and profile system 
-- to support the broader "Ecosystem" (including Wolfitness consumers).

-- 1. ADD THE 'consumer' ROLE
-- We safely add 'consumer' to the existing user_role ENUM.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'consumer') THEN
    ALTER TYPE public.user_role ADD VALUE 'consumer';
  END IF;
END
$$;

-- 2. EXTEND THE PROFILES TABLE
-- We add all the fitness tracking and onboarding metrics required by Wolfitness.
-- Using IF NOT EXISTS ensures this script is idempotent (can be run multiple times safely).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC CHECK (height_cm > 0 OR height_cm IS NULL),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC CHECK (weight_kg > 0 OR weight_kg IS NULL),
  ADD COLUMN IF NOT EXISTS vibe_type TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS training_availability TEXT[],
  ADD COLUMN IF NOT EXISTS equipment_access TEXT[],
  ADD COLUMN IF NOT EXISTS injuries TEXT[],
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. AUTO-UPDATED_AT TRIGGER
-- Ensure updated_at changes automatically when a profile is edited.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. UPDATE THE USER CREATION HOOK
-- Update the trigger that fires when a user signs up via Supabase Auth.
-- It now defaults to 'consumer' instead of 'coach' and captures the username.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'consumer'::public.user_role),
    NEW.raw_user_meta_data->>'username'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    username = EXCLUDED.username;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
