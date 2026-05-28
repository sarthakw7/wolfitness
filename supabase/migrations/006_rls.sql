-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;

-- 1. USERS & PROFILES
CREATE POLICY "Users can view and edit own identity" ON public.users 
FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view basic user identity" ON public.users 
FOR SELECT USING (true);

CREATE POLICY "Users control their own fitness profile" ON public.fitness_profiles 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view verified coaches" ON public.coaches 
FOR SELECT USING (is_verified = true);

CREATE POLICY "Coaches control own profile" ON public.coaches 
FOR ALL USING (auth.uid() = id);

-- 2. CONTENT (PROGRAMS & NUTRITION)
CREATE POLICY "Public can view published programs" ON public.programs 
FOR SELECT USING (is_published = true);

CREATE POLICY "Coaches can manage own programs" ON public.programs 
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Public can view published nutrition plans" ON public.nutrition_plans 
FOR SELECT USING (is_published = true);

CREATE POLICY "Coaches can manage own nutrition plans" ON public.nutrition_plans 
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view library" ON public.exercises_library FOR SELECT USING (true);

-- 3. ENGAGEMENT & TRACKING
CREATE POLICY "Users manage own enrollments" ON public.enrollments 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view enrollments for their programs" ON public.enrollments 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.programs WHERE id = enrollments.program_id AND creator_id = auth.uid())
);

CREATE POLICY "Users manage own workout sessions" ON public.workout_sessions 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own log sets" ON public.workout_log_sets 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workout_sessions WHERE id = workout_log_sets.session_id AND user_id = auth.uid())
);

CREATE POLICY "Users manage own nutrition logs" ON public.nutrition_logs 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own macro targets" ON public.macro_targets
FOR ALL USING (auth.uid() = user_id);
