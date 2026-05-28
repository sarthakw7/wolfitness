ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'refunded';

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0 CHECK (refund_amount >= 0),
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS coach_amount INTEGER DEFAULT 0 CHECK (coach_amount >= 0),
ADD COLUMN IF NOT EXISTS application_fee_amount INTEGER DEFAULT 0 CHECK (application_fee_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_purchases_stripe_customer
    ON public.purchases(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_program_status
    ON public.purchases(program_id, status);
