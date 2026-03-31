-- 1. BYPASS CONSTRAINTS FOR DEMO MOCK DATA
-- This allows inserting mentors without them existing in the hidden auth.users table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE mentors DROP CONSTRAINT IF EXISTS mentors_id_fkey;

-- 2. ADD MISSING RLS POLICIES FOR DISCOVERY
-- Allow everyone to see focus areas (Required for the mentor join query to work)
DROP POLICY IF EXISTS "Focus areas are viewable by everyone" ON mentor_focus_areas;
CREATE POLICY "Focus areas are viewable by everyone" ON mentor_focus_areas
  FOR SELECT USING (true);

-- Ensure published mentors are viewable by everyone (Broadened for demo)
DROP POLICY IF EXISTS "Published mentors are viewable by everyone" ON mentors;
CREATE POLICY "Published mentors are viewable by everyone" ON mentors
  FOR SELECT USING (is_published = true OR auth.uid() = id);

-- 3. ADD ENROLLMENT POLICIES
-- Allow coaches to see their own enrollments and mentors to see their students
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = mentor_id);

-- Allow coaches to create enrollments (Align with mentor)
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON enrollments;
CREATE POLICY "Users can insert their own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = coach_id);
