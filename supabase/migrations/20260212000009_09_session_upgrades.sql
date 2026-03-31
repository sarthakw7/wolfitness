-- Upgrade sessions table with asset fields
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS key_takeaways JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned' NOT NULL;

-- Table for student reflections on specific sessions
CREATE TABLE IF NOT EXISTS session_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, coach_id)
);

-- Enable RLS
ALTER TABLE session_reflections ENABLE ROW LEVEL SECURITY;

-- Students can manage their own reflections
CREATE POLICY "Students can manage own reflections" ON session_reflections
  FOR ALL USING (auth.uid() = coach_id);

-- Mentors can view reflections for their own sessions
CREATE POLICY "Mentors can view session reflections" ON session_reflections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE id = session_reflections.session_id 
      AND mentor_id = auth.uid()
    )
  );
