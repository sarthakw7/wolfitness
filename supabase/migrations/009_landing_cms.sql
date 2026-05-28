-- Landing Page CMS
CREATE TABLE public.landing_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE, -- Unique identifier for the specific section (e.g. 'hero-main', 'campaign-integration')
    type TEXT NOT NULL, -- The component type (e.g. 'hero', 'photo_campaign', 'features')
    title TEXT,
    subtitle TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landing sections are viewable by everyone" 
ON public.landing_sections FOR SELECT USING (is_active = true);

CREATE POLICY "Landing sections are manageable by admins" 
ON public.landing_sections FOR ALL 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
