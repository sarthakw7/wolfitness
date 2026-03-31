-- Migration: 15_enhance_sessions_structure
-- Description: Adds session_type, sort_order, and release_day to sessions.

-- 1. Create Enum for Session Types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type') THEN
        CREATE TYPE public.session_type AS ENUM ('video', 'intel', 'mission', 'live');
    END IF;
END $$;

-- 2. Add columns to Sessions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='session_type') THEN
        ALTER TABLE public.sessions ADD COLUMN session_type public.session_type DEFAULT 'video';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='sort_order') THEN
        ALTER TABLE public.sessions ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='release_day') THEN
        ALTER TABLE public.sessions ADD COLUMN release_day integer DEFAULT 0;
    END IF;
END $$;
