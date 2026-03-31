-- Migration: 29_stripe_integration
-- Description: Adds payment processing fields to mentors and enrollments to support Stripe integration.

-- 1. Update mentors with Stripe identity
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- 2. Update enrollments with payment tracking
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- 3. Add index for faster lookup during webhooks
CREATE INDEX IF NOT EXISTS idx_mentors_stripe_account ON public.mentors(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_subscription ON public.enrollments(stripe_subscription_id);
