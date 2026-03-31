-- Migration: 35_system_settings_and_customers
-- Description: Adds a global settings table for platform orchestration and links users to Stripe customer identities.

-- 1. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Initialize Global Platform Fee (10%)
INSERT INTO public.system_settings (key, value)
VALUES ('platform_fee_percent', '10')
ON CONFLICT (key) DO NOTHING;

-- 2. Link Profiles to Stripe Customers
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- 3. RLS for System Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view settings" ON public.system_settings
  FOR SELECT USING (true);
