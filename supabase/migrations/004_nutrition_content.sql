CREATE TABLE public.nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    serving_size NUMERIC NOT NULL,
    serving_unit TEXT NOT NULL,
    calories INTEGER DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Client Macro Targets (Historical capability)
CREATE TABLE public.macro_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    daily_calorie_target INTEGER NOT NULL,
    daily_protein_target INTEGER NOT NULL,
    daily_carbs_target INTEGER NOT NULL,
    daily_fat_target INTEGER NOT NULL,
    active_from DATE DEFAULT CURRENT_DATE NOT NULL,
    active_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_nutrition_plans_updated_at BEFORE UPDATE ON public.nutrition_plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Comments
COMMENT ON TABLE public.nutrition_plans IS 'Dietary templates linked to coaches or specific fitness programs.';
COMMENT ON TABLE public.macro_targets IS 'User-specific daily nutritional goals with historical validity periods.';
