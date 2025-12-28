-- FIX: Add missing UPDATE/DELETE policies for Program Builder
-- Run this in your Supabase SQL Editor to fix the "Duplicate/Zombie Exercises" issue.

-- 1. Program Weeks
CREATE POLICY "Coaches can update weeks" ON public.program_weeks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Coaches can delete weeks" ON public.program_weeks FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Program Days
CREATE POLICY "Coaches can update days" ON public.program_days FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Coaches can delete days" ON public.program_days FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Program Exercises
CREATE POLICY "Coaches can update exercises" ON public.program_exercises FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Coaches can delete exercises" ON public.program_exercises FOR DELETE USING (auth.role() = 'authenticated');
