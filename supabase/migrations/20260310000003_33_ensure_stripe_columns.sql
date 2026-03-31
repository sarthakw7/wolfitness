-- Migration: 33_ensure_stripe_columns
-- Description: Fixes the 'column mentors.stripe_account_id does not exist' error by manually ensuring all Stripe-related columns, indexes, and RLS policies are present.

-- 1. Ensure Mentors table has Stripe integration columns
ALTER TABLE IF EXISTS public.mentors 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- 2. Ensure Enrollments table has payment tracking columns
ALTER TABLE IF EXISTS public.enrollments
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- 3. Add Performance Indexes
CREATE INDEX IF NOT EXISTS idx_mentors_stripe_account ON public.mentors(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_subscription ON public.enrollments(stripe_subscription_id);

-- 4. Fix RLS for Mentor Record Creation
-- This allows the app to automatically create a mentor record if one is missing during Stripe onboarding.
DROP POLICY IF EXISTS "Mentors can manage own authority record" ON public.mentors;
CREATE POLICY "Mentors can manage own authority record" ON public.mentors
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. Ensure Admins can view all mentors for vetting
DROP POLICY IF EXISTS "Admins can view all mentors" ON public.mentors;
CREATE POLICY "Admins can view all mentors" ON public.mentors
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));
