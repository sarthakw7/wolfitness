-- Identity
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_stripe ON public.users(stripe_customer_id);

-- Program Discovery
CREATE INDEX idx_programs_creator ON public.programs(creator_id);
CREATE INDEX idx_programs_published ON public.programs(is_published) WHERE is_published = true;

-- Hierarchy Traversals
CREATE INDEX idx_program_weeks_program ON public.program_weeks(program_id);
CREATE INDEX idx_program_days_week ON public.program_days(week_id);
CREATE INDEX idx_program_exercises_day ON public.program_exercises(day_id);

-- Engagement
CREATE INDEX idx_enrollments_user_program ON public.enrollments(user_id, program_id);
CREATE INDEX idx_workout_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_log_sets_session ON public.workout_log_sets(session_id);

-- Date Lookups
CREATE INDEX idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, logged_at);
CREATE INDEX idx_daily_nutrition_user_date ON public.daily_nutrition_summaries(user_id, date);
