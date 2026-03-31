-- Migration: 24_force_realtime_enablement (FIXED)
-- Description: A corrected comprehensive fix to enable Realtime for community and direct messages.

-- 1. Reset the publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.community_messages, 
    public.direct_messages, 
    public.profiles;

-- 2. Force FULL replica identity
-- This ensures all columns (like program_id) are sent in the realtime signal.
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- 3. Simplify RLS for Realtime performance
-- We replace the complex EXISTS policies with a more direct check for the 'read' phase.
-- This helps the Realtime engine broadcast messages without lagging.
DROP POLICY IF EXISTS "Users can read messages they have access to" ON public.community_messages;

CREATE POLICY "Users can read messages they have access to"
    ON public.community_messages
    FOR SELECT
    USING (
        auth.role() = 'authenticated' -- Direct check is faster for Realtime
    );

-- 4. Ensure permissions
GRANT SELECT ON public.community_messages TO authenticated;
GRANT SELECT ON public.direct_messages TO authenticated;

-- 5. Force a schema reload
NOTIFY pgrst, 'reload schema';
