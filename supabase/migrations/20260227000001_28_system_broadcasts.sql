-- Migration: 28_system_broadcasts
-- Description: Adds system_broadcasts table for platform-wide announcements.

CREATE TABLE IF NOT EXISTS public.system_broadcasts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT system_broadcasts_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.system_broadcasts ENABLE ROW LEVEL SECURITY;

-- Everyone can read active broadcasts
CREATE POLICY "Anyone can view active system broadcasts" ON public.system_broadcasts
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Admins can do everything
CREATE POLICY "Admins can manage system broadcasts" ON public.system_broadcasts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
