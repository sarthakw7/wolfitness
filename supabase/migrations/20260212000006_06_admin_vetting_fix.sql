-- 1. ALLOW ADMINS TO MANAGE ALL MENTOR RECORDS
-- Mentors can manage their own (uid = id), but Admins need to manage ALL.
DROP POLICY IF EXISTS "Admins can manage all mentors" ON mentors;
CREATE POLICY "Admins can manage all mentors" ON mentors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 2. ENSURE ADMINS CAN MANAGE FOCUS AREAS TOO
DROP POLICY IF EXISTS "Admins can manage all focus areas" ON mentor_focus_areas;
CREATE POLICY "Admins can manage all focus areas" ON mentor_focus_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
