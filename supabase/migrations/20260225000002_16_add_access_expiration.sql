-- Migration: 16_add_access_expiration
-- Description: Adds access duration to programs and expiration dates to enrollments.

-- 1. Add access duration to Programs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='access_duration_days') THEN
        ALTER TABLE public.programs ADD COLUMN access_duration_days integer DEFAULT 0; -- 0 means forever
    END IF;
END $$;

-- 2. Add expiration date to Enrollments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='expires_at') THEN
        ALTER TABLE public.enrollments ADD COLUMN expires_at timestamp with time zone;
    END IF;
END $$;
