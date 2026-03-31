-- Migration: 23_reset_realtime_publication
-- Description: Resets the realtime publication to ensure total sync for community and direct messages.

-- 1. Drop the old publication if it's stuck
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 2. Create a fresh publication for our specific tables
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.community_messages, 
    public.direct_messages, 
    public.profiles;

-- 3. Ensure full row data is sent
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
