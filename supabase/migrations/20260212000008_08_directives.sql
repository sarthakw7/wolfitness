-- Table for mentor-assigned directives (tasks)
CREATE TABLE IF NOT EXISTS directives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, completed, reviewed
  mentor_feedback TEXT,
  student_reflection TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE directives ENABLE ROW LEVEL SECURITY;

-- Mentors can manage directives they created
CREATE POLICY "Mentors can manage own directives" ON directives
  FOR ALL USING (auth.uid() = mentor_id);

-- Coaches can view their own directives
CREATE POLICY "Coaches can view own directives" ON directives
  FOR SELECT USING (auth.uid() = coach_id);

-- Coaches can update their own directives (to mark as completed/add reflection)
CREATE POLICY "Coaches can update own directives" ON directives
  FOR UPDATE USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);
