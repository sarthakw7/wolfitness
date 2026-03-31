-- Migration: 39_security_lockdown
-- Description: Enables RLS and sets up secure policies for all unrestricted tables.

-- 1. Enable RLS on all target tables
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_broadcasts ENABLE ROW LEVEL SECURITY;

-- 2. CREATE ADMIN MASTER BYPASS (Non-recursive)
-- This allows admins to bypass all individual policies for testing and management.
-- We use auth.jwt() to avoid hitting the profiles table and causing recursion.

CREATE OR REPLACE FUNCTION public.check_is_admin() 
RETURNS boolean AS $$
  SELECT (auth.jwt() ->> 'role') = 'admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. SPECIFIC POLICIES

-- PROGRAMS
DROP POLICY IF EXISTS "Public can view published programs" ON public.programs;
CREATE POLICY "Public can view published programs" ON public.programs
  FOR SELECT USING (status = 'published' OR public.check_is_admin());

DROP POLICY IF EXISTS "Mentors can manage their own programs" ON public.programs;
CREATE POLICY "Mentors can manage their own programs" ON public.programs
  FOR ALL USING (auth.uid() = mentor_id OR public.check_is_admin());

-- SESSIONS
DROP POLICY IF EXISTS "Sessions are viewable by enrolled coaches" ON public.sessions;
DROP POLICY IF EXISTS "Enrolled coaches can view sessions" ON public.sessions;
CREATE POLICY "Enrolled coaches can view sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments 
      WHERE enrollments.program_id = sessions.program_id 
      AND enrollments.coach_id = auth.uid()
      AND enrollments.status = 'active'
    ) OR public.check_is_admin()
  );

DROP POLICY IF EXISTS "Mentors can manage their own sessions" ON public.sessions;
CREATE POLICY "Mentors can manage their own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = mentor_id OR public.check_is_admin());

-- DIRECT MESSAGES
DROP POLICY IF EXISTS "Users can only see their own DMs" ON public.direct_messages;
CREATE POLICY "Users can only see their own DMs" ON public.direct_messages
  FOR SELECT USING (auth.uid() IN (sender_id, recipient_id) OR public.check_is_admin());

DROP POLICY IF EXISTS "Users can send DMs" ON public.direct_messages;
CREATE POLICY "Users can send DMs" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- DIRECTIVES
DROP POLICY IF EXISTS "Directives are viewable by coach or mentor" ON public.directives;
DROP POLICY IF EXISTS "Involved parties can view directives" ON public.directives;
CREATE POLICY "Involved parties can view directives" ON public.directives
  FOR SELECT USING (auth.uid() IN (coach_id, mentor_id) OR public.check_is_admin());

DROP POLICY IF EXISTS "Mentors can manage directives" ON public.directives;
CREATE POLICY "Mentors can manage directives" ON public.directives
  FOR ALL USING (auth.uid() = mentor_id OR public.check_is_admin());

-- COMMUNITY MESSAGES
DROP POLICY IF EXISTS "Community messages are viewable by everyone" ON public.community_messages;
DROP POLICY IF EXISTS "Public messages are viewable by all" ON public.community_messages;
CREATE POLICY "Public messages are viewable by all" ON public.community_messages
  FOR SELECT USING (program_id IS NULL OR public.check_is_admin());

DROP POLICY IF EXISTS "Program members can view program messages" ON public.community_messages;
CREATE POLICY "Program members can view program messages" ON public.community_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments 
      WHERE enrollments.program_id = community_messages.program_id 
      AND enrollments.coach_id = auth.uid()
    )
  );

-- SYSTEM BROADCASTS
DROP POLICY IF EXISTS "Anyone can view active broadcasts" ON public.system_broadcasts;
CREATE POLICY "Anyone can view active broadcasts" ON public.system_broadcasts
  FOR SELECT USING (is_active = true OR public.check_is_admin());

DROP POLICY IF EXISTS "Only admins can manage broadcasts" ON public.system_broadcasts;
CREATE POLICY "Only admins can manage broadcasts" ON public.system_broadcasts
  FOR ALL USING (public.check_is_admin());

-- SESSION REFLECTIONS
DROP POLICY IF EXISTS "Coaches can manage their own reflections" ON public.session_reflections;
CREATE POLICY "Coaches can manage their own reflections" ON public.session_reflections
  FOR ALL USING (auth.uid() = coach_id OR public.check_is_admin());

DROP POLICY IF EXISTS "Mentors can view reflections for their sessions" ON public.session_reflections;
CREATE POLICY "Mentors can view reflections for their sessions" ON public.session_reflections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_reflections.session_id 
      AND sessions.mentor_id = auth.uid()
    )
  );
