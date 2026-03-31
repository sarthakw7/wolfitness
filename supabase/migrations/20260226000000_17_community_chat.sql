-- Migration: 17_community_chat
-- Description: Sets up the global "Lounge" chat table with Realtime support.

-- 1. Create community_messages table
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Anyone logged in can read messages (The Lounge is public to all members)
CREATE POLICY "Authenticated users can read community messages"
    ON public.community_messages
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Anyone logged in can send messages (linked to their own UID)
CREATE POLICY "Authenticated users can insert community messages"
    ON public.community_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Enable Realtime for this table
-- This allows the frontend to "subscribe" to new messages instantly.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'community_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
    END IF;
END $$;
