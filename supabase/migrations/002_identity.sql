-- Core Identity (mirrors auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    role public.wff_role DEFAULT 'client'::public.wff_role NOT NULL,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Public Coach Profiles
CREATE TABLE public.coaches (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    specializations TEXT[] DEFAULT '{}',
    years_experience INTEGER,
    certifications TEXT[],
    social_links JSONB DEFAULT '{}'::jsonb,
    headline TEXT,
    is_verified BOOLEAN DEFAULT false,
    stripe_account_id TEXT UNIQUE,
    stripe_onboarding_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Volatile Physical Traits (Clients Only)
CREATE TABLE public.fitness_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    height_cm NUMERIC CHECK (height_cm > 0),
    weight_kg NUMERIC CHECK (weight_kg > 0),
    vibe_type TEXT,
    primary_goal TEXT,
    experience_level TEXT,
    training_availability TEXT[],
    equipment_access TEXT[],
    injuries TEXT[],
    dietary_preference TEXT,
    allergies TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Onboarding Context
CREATE TABLE public.onboarding_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    raw_answers JSONB NOT NULL,
    calculated_vibe TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Triggers for Updated At
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_coaches_updated_at BEFORE UPDATE ON public.coaches FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_fitness_profiles_updated_at BEFORE UPDATE ON public.fitness_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Comments
COMMENT ON TABLE public.users IS 'Core Wolfitness user identity, synced with auth.users.';
COMMENT ON TABLE public.coaches IS 'Coach profiles for creators managing programs.';
COMMENT ON TABLE public.fitness_profiles IS 'Detailed physical and preference data for clients.';
