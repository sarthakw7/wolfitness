-- Migration: 25_chat_management (FIXED)
-- Description: Adds deletion and room clearing capabilities to the chat system.

-- 1. RLS Policies for Individual Deletion
-- Users can delete their own messages.
-- Mentors can delete ANY message in their program rooms.
-- Admins can delete any message.
DROP POLICY IF EXISTS "Users can delete own messages" ON public.community_messages;

CREATE POLICY "Users can delete own messages"
    ON public.community_messages
    FOR DELETE
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.programs p
            WHERE p.id = community_messages.program_id AND p.mentor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Note: DELETE is automatically included in the 'supabase_realtime' publication 
-- established in migration 24.
