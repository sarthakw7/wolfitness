-- Migration 46: WFF Landing Page CMS
-- This table allows admins to manage the home page content dynamically.

CREATE TABLE IF NOT EXISTS public.wff_landing_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'hero', 'photo_campaign', 'video_campaign', 'features'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  media_url TEXT, -- Link to photo or video in Supabase Storage
  poster_url TEXT, -- Optional thumbnail for videos
  cta_text TEXT,
  cta_href TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  hide_content BOOLEAN DEFAULT FALSE, -- To allow cinematic full-screen visuals
  anchor_tag TEXT, -- For navigation links (e.g., #protocol)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX idx_wff_landing_order ON public.wff_landing_sections(order_index);

-- Enable RLS
ALTER TABLE public.wff_landing_sections ENABLE ROW LEVEL SECURITY;

-- Public can view active sections
CREATE POLICY "Public can view active sections" 
ON public.wff_landing_sections FOR SELECT 
USING (is_active = true);

-- Admins manage all sections
CREATE POLICY "Admins manage sections" 
ON public.wff_landing_sections FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER set_wff_landing_updated_at
  BEFORE UPDATE ON public.wff_landing_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
