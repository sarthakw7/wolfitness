-- Migration: 34_manual_activation_utility
-- Description: A utility script to manually activate pending enrollments for local development testing.

-- This is a no-op by default, but provides the query for manual use
-- UPDATE public.enrollments SET status = 'active' WHERE status = 'pending';
SELECT 'Migration 34 placeholder loaded' as status;
