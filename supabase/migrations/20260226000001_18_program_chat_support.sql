-- Migration: 18_program_chat_support
-- Description: Adds private program-specific chat rooms by linking messages to programs.

-- 1. Add program_id to community_messages
ALTER TABLE public.community_messages ADD COLUMN program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE;

-- 2. Update RLS Policies for Privacy
-- We delete the old "Global" policies and replace them with "Access-Based" policies.
DROP POLICY IF EXISTS "Authenticated users can read community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Authenticated users can insert community messages" ON public.community_messages;

-- READ POLICY
-- 1. Global (program_id IS NULL) -> All authenticated users.
-- 2. Program-specific -> Only the Mentor OR enrolled Coaches.
CREATE POLICY "Users can read messages they have access to"
    ON public.community_messages
    FOR SELECT
    USING (
        program_id IS NULL OR 
        (EXISTS (
            SELECT 1 FROM public.programs p
            WHERE p.id = program_id AND p.mentor_id = auth.uid()
        )) OR
        (EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.program_id = community_messages.program_id 
            AND e.coach_id = auth.uid() 
            AND e.status = 'active'
        ))
    );

-- INSERT POLICY
CREATE POLICY "Users can send messages to rooms they have access to"
    ON public.community_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND (
            program_id IS NULL OR 
            (EXISTS (
                SELECT 1 FROM public.programs p
                WHERE p.id = program_id AND p.mentor_id = auth.uid()
            )) OR
            (EXISTS (
                SELECT 1 FROM public.enrollments e
                WHERE e.program_id = community_messages.program_id 
                AND e.coach_id = auth.uid() 
                AND e.status = 'active'
            ))
        )
    );
