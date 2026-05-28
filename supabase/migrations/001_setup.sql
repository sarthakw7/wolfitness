-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Enums
CREATE TYPE public.wff_role AS ENUM ('admin', 'coach', 'client');
CREATE TYPE public.difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.enrollment_status AS ENUM ('active', 'pending', 'completed', 'cancelled');
CREATE TYPE public.movement_pattern AS ENUM ('push', 'pull', 'hinge', 'squat', 'core', 'isolation', 'cardio');

-- Standard Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
