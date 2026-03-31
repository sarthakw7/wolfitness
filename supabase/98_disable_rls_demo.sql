-- USE THIS ONLY FOR DEMO PURPOSES
-- This disables Row Level Security so all data is visible without policy errors.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentors DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_focus_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;

-- Grant permissions to make sure the app can read/write freely
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'RLS Disabled for Demo. Data is now fully visible.' as status;
