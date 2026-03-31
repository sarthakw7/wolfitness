-- Migration: 20_fix_realtime_identity
-- Description: Sets REPLICA IDENTITY to FULL to ensure all columns are sent via Realtime.

ALTER TABLE public.community_messages REPLICA IDENTITY FULL;

-- Double check publication
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
