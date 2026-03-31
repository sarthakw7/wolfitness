-- Migration: 21_direct_messaging
-- Description: Sets up 1-on-1 private messaging between mentors and coaches.

-- 1. Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can only read messages where they are either the sender or the recipient
CREATE POLICY "Users can read their own direct messages"
    ON public.direct_messages
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can only send messages from themselves
CREATE POLICY "Users can send their own direct messages"
    ON public.direct_messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 4. Enable Realtime
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'direct_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;
END $$;
