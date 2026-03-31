-- Table for mentors to send signals to their students
CREATE TABLE IF NOT EXISTS mentor_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  quote TEXT NOT NULL,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow mentors to manage their own signals
ALTER TABLE mentor_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can manage own signals" ON mentor_signals
  FOR ALL USING (auth.uid() = mentor_id);

-- Allow enrolled coaches to view their mentor's signals
CREATE POLICY "Coaches can view aligned mentor signals" ON mentor_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE mentor_id = mentor_signals.mentor_id 
      AND coach_id = auth.uid() 
      AND status = 'active'
    )
  );
