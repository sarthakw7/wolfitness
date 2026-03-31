-- Migration: 22_pinned_signals
-- Description: Adds pinning capability to community messages.

-- 1. Add is_pinned column
ALTER TABLE public.community_messages ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- 2. RLS Policies for Pinning
-- Only the mentor of the program OR an admin can pin/unpin
CREATE POLICY "Mentors can pin messages in their rooms"
    ON public.community_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.programs p
            WHERE p.id = community_messages.program_id AND p.mentor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (true);
