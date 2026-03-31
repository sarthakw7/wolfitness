-- 1. ENSURE PROFILES ARE VIEWABLE BY ANON USERS
-- (Needed so non-logged-in users can see mentor names on profiles)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 2. ENSURE MENTORS ARE VIEWABLE BY ANON USERS
DROP POLICY IF EXISTS "Published mentors are viewable by everyone" ON mentors;
CREATE POLICY "Published mentors are viewable by everyone" ON mentors
  FOR SELECT USING (is_published = true);

-- 3. ENSURE FOCUS AREAS ARE VIEWABLE BY ANON USERS
DROP POLICY IF EXISTS "Focus areas are viewable by everyone" ON mentor_focus_areas;
CREATE POLICY "Focus areas are viewable by everyone" ON mentor_focus_areas
  FOR SELECT USING (true);
