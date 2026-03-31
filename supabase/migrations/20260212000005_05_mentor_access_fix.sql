-- 1. ALLOW MENTORS TO CREATE THEIR OWN AUTHORITY RECORD
-- The previous policies only allowed SELECT. We need INSERT/UPDATE for onboarding.
DROP POLICY IF EXISTS "Mentors can manage own authority record" ON mentors;
CREATE POLICY "Mentors can manage own authority record" ON mentors
  FOR ALL USING (auth.uid() = id);

-- 2. ENSURE PROFILES ARE MANAGEABLE BY THE OWNER
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- 3. ENSURE MENTOR FOCUS AREAS ARE MANAGEABLE
DROP POLICY IF EXISTS "Mentors can manage own focus areas" ON mentor_focus_areas;
CREATE POLICY "Mentors can manage own focus areas" ON mentor_focus_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mentors WHERE id = mentor_focus_areas.mentor_id AND id = auth.uid()
    )
  );

-- 4. FINAL CHECK: IF RLS IS STILL CAUSING ISSUES IN THE DEMO, RUN THIS:
-- ALTER TABLE mentors DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
