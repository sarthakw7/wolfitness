-- Global Exercise Library (Source of Truth)
CREATE TABLE public.exercises_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    primary_muscle TEXT,
    secondary_muscles TEXT[],
    pattern public.movement_pattern,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Program Headers
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0 NOT NULL,
    is_subscription BOOLEAN DEFAULT false,
    duration_weeks INTEGER,
    difficulty public.difficulty_level,
    vibe_type TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    version_number INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES public.programs(id) ON DELETE SET NULL, -- Soft template lineage
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.program_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(program_id, week_number)
);

CREATE TABLE public.program_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(week_id, day_number)
);

CREATE TABLE public.program_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
    exercise_library_id UUID NOT NULL REFERENCES public.exercises_library(id) ON DELETE RESTRICT,
    target_sets INTEGER,
    target_reps TEXT,
    target_rpe NUMERIC,
    rest_seconds INTEGER,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Triggers
CREATE TRIGGER set_exercises_library_updated_at BEFORE UPDATE ON public.exercises_library FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Comments
COMMENT ON TABLE public.exercises_library IS 'Centralized library of movements and biomechanical data.';
COMMENT ON TABLE public.programs IS 'High-level containers for workout and coaching content.';
