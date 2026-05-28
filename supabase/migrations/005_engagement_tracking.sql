-- Enrollments
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    status public.enrollment_status DEFAULT 'active'::public.enrollment_status,
    stripe_subscription_id TEXT,
    enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, program_id)
);

-- Scalable Workout Logging (Header/Line Item Architecture)
CREATE TABLE public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    day_id UUID REFERENCES public.program_days(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE public.workout_log_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_library_id UUID NOT NULL REFERENCES public.exercises_library(id),
    set_number INTEGER NOT NULL,
    reps_completed INTEGER,
    weight_kg NUMERIC,
    rpe_actual NUMERIC,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Nutrition Logging
CREATE TABLE public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    meal_category TEXT,
    calories INTEGER DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    barcode_upc TEXT,
    logged_at DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Daily Aggregation
CREATE TABLE public.daily_nutrition_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein NUMERIC DEFAULT 0,
    total_carbs NUMERIC DEFAULT 0,
    total_fat NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date)
);

CREATE TRIGGER set_daily_nutrition_summaries_updated_at BEFORE UPDATE ON public.daily_nutrition_summaries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Comments
COMMENT ON TABLE public.workout_sessions IS 'Session headers for tracked workout executions.';
COMMENT ON TABLE public.workout_log_sets IS 'Granular performance data for individual sets within a session.';
COMMENT ON TABLE public.daily_nutrition_summaries IS 'Daily macro aggregations to optimize client-side progress visualization.';
