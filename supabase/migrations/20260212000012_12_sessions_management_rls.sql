-- Grant mentors authority to manage their own sessions
CREATE POLICY "Mentors can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete their own sessions" ON sessions
  FOR DELETE USING (auth.uid() = mentor_id);
