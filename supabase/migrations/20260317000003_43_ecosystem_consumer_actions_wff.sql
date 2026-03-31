-- ==========================================
-- MIGRATION 4: WFF CONSUMER ACTIONS
-- ==========================================
-- This script handles consumer interaction: buying programs (enrollments),
-- logging workouts, and a global exercise library.

-- 1. ENROLLMENTS (Purchases & Access)
CREATE TABLE IF NOT EXISTS public.wff_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.wff_programs(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent buying the exact same program twice
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.wff_enrollments ENABLE ROW LEVEL SECURITY;
-- Users can only see what they bought
CREATE POLICY "Users can view own enrollments" ON public.wff_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enrollments" ON public.wff_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 2. WORKOUT LOGS
-- Where the actual fitness tracking happens.
CREATE TABLE IF NOT EXISTS public.wff_user_workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.wff_programs(id) ON DELETE CASCADE NOT NULL,
  day_id UUID REFERENCES public.wff_program_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.wff_program_exercises(id) ON DELETE CASCADE NOT NULL,
  
  set_number INTEGER NOT NULL,
  reps_completed INTEGER,
  weight_kg NUMERIC,
  rpe_actual NUMERIC,
  
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- A user can only have one log for a specific set of a specific exercise on a specific day
  UNIQUE(user_id, day_id, exercise_id, set_number)
);

ALTER TABLE public.wff_user_workout_logs ENABLE ROW LEVEL SECURITY;
-- Users have full control over their own training data
CREATE POLICY "Users manage own logs" ON public.wff_user_workout_logs FOR ALL USING (auth.uid() = user_id);


-- 3. GLOBAL EXERCISE LIBRARY
-- A standardized list of exercises so metrics can be compared globally across the platform.
CREATE TABLE IF NOT EXISTS public.wff_global_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wff_global_exercises ENABLE ROW LEVEL SECURITY;
-- Anyone can see the global exercises, only admins can add them (via service role)
CREATE POLICY "Everyone views global exercises" ON public.wff_global_exercises FOR SELECT USING (true);

-- SEED DATA: Basic movements to start the platform
INSERT INTO public.wff_global_exercises (name, muscle_group) VALUES
('Barbell Back Squat', 'Legs'),
('Barbell Bench Press', 'Chest'),
('Deadlift', 'Back'),
('Overhead Press', 'Shoulders'),
('Pull Up', 'Back'),
('Dumbbell Row', 'Back'),
('Lunges', 'Legs'),
('Plank', 'Core')
ON CONFLICT (name) DO NOTHING;
