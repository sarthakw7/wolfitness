-- ==========================================
-- MIGRATION 6: WFF CREATOR STRIPE CONNECT
-- ==========================================
-- This script adds Stripe Connect capabilities to the WFF marketplace,
-- allowing coaches to connect their bank accounts to receive payouts.

ALTER TABLE public.wff_creators
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
