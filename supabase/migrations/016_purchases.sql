CREATE TYPE public.purchase_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');

CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    stripe_checkout_session_id TEXT,
    payment_intent_id TEXT,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'usd',
    status public.purchase_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_purchases_checkout_session_unique
    ON public.purchases(stripe_checkout_session_id)
    WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX idx_purchases_payment_intent_unique
    ON public.purchases(payment_intent_id)
    WHERE payment_intent_id IS NOT NULL;

CREATE INDEX idx_purchases_user_program_created
    ON public.purchases(user_id, program_id, created_at DESC);

CREATE INDEX idx_purchases_status_created
    ON public.purchases(status, created_at DESC);

CREATE TRIGGER set_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.purchases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases" ON public.purchases
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending purchases" ON public.purchases
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
