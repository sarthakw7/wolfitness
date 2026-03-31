-- Migration: 38_cinematic_program_media
-- Description: Adds cover_image to programs and thumbnail_url to sessions.

-- 1. Programs Table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS cover_image text;

-- 2. Sessions (Videos) Table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS thumbnail_url text;
