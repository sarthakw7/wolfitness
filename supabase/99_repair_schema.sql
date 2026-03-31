-- SIGNAL DATABASE REPAIR SCRIPT
-- Use this if you see errors like "Could not find a relationship between mentors and profiles"

-- 1. Restore the link between Mentors and Profiles (Critical for the 'Join' query)
ALTER TABLE mentors 
DROP CONSTRAINT IF EXISTS mentors_id_fkey;

ALTER TABLE mentors 
ADD CONSTRAINT mentors_id_fkey 
FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Restore the link between Focus Areas and Mentors
ALTER TABLE mentor_focus_areas 
DROP CONSTRAINT IF EXISTS mentor_focus_areas_mentor_id_fkey;

ALTER TABLE mentor_focus_areas 
ADD CONSTRAINT mentor_focus_areas_mentor_id_fkey 
FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE;

-- 3. Restore the link between Enrollments and Mentors/Coaches
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_mentor_id_fkey;

ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_mentor_id_fkey 
FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE;

ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_coach_id_fkey;

ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_coach_id_fkey 
FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Final step: Refresh PostgREST cache (Supabase internal)
-- Sometimes Supabase needs to be told the schema changed. 
-- You can do this by clicking 'Reload Schema' in the Supabase API settings 
-- or just by running these commands which usually triggers a refresh.

SELECT 'Schema repair complete. Refresh your browser tab.' as status;
