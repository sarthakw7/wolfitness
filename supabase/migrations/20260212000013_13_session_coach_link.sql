-- Add coach_id to sessions for 1:1 targeting
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Update the viewing policy to respect 1:1 privacy
DROP POLICY IF EXISTS "Sessions are viewable by mentor or enrolled coaches" ON sessions;

CREATE POLICY "Sessions are viewable by mentor or authorized coaches" ON sessions
  FOR SELECT USING (
    auth.uid() = mentor_id OR 
    (
      -- If it's a 1:1, only the specific coach can see it
      (coach_id IS NOT NULL AND auth.uid() = coach_id) OR
      -- If it's group/recorded, all active enrolled coaches see it
      (coach_id IS NULL AND EXISTS (
        SELECT 1 FROM enrollments 
        WHERE mentor_id = sessions.mentor_id 
        AND coach_id = auth.uid() 
        AND status = 'active'
      ))
    )
  );
