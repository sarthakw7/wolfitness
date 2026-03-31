-- BYPASS CONSTRAINTS FOR DEMO MOCK DATA
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE mentors DROP CONSTRAINT IF EXISTS mentors_id_fkey;

-- CLEANUP OLD DATA
DELETE FROM mentor_focus_areas WHERE mentor_id IN ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333');
DELETE FROM mentors WHERE id IN ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333');
DELETE FROM profiles WHERE id IN ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333');

-- INSERT PROFILES
INSERT INTO profiles (id, email, full_name, role) VALUES 
('a1111111-1111-1111-1111-111111111111', 'alex@signal.com', 'Alex Hormozi', 'mentor'),
('b2222222-2222-2222-2222-222222222222', 'naval@signal.com', 'Naval Ravikant', 'mentor'),
('c3333333-3333-3333-3333-333333333333', 'sara@signal.com', 'Sara Blakely', 'mentor');

-- INSERT MENTOR AUTHORITY DATA
INSERT INTO mentors (id, philosophy_line, story, price_tier, commitment_level, is_published) VALUES 
('a1111111-1111-1111-1111-111111111111', 'Volume precedes skill.', 'Scaled Gym Launch to $100M+ by focusing on the fundamentals of offer creation and sheer volume of outreach.', 'Elite', 'High', true),
('b2222222-2222-2222-2222-222222222222', 'Specific knowledge is found by pursuing your curiosity.', 'Founder of AngelList. Focuses on wealth creation through leverage, judgment, and accountability.', 'Premium', 'Low', true),
('c3333333-3333-3333-3333-333333333333', 'Failure is not the outcome, failure is not trying.', 'Founder of Spanx. Built a billion-dollar empire from a single pair of pantyhose.', 'Elite', 'Medium', true);

-- INSERT FOCUS AREAS
INSERT INTO mentor_focus_areas (mentor_id, area) VALUES 
('a1111111-1111-1111-1111-111111111111', 'Scaling'),
('a1111111-1111-1111-1111-111111111111', 'Sales'),
('b2222222-2222-2222-2222-222222222222', 'Mindset'),
('b2222222-2222-2222-2222-222222222222', 'Wealth'),
('c3333333-3333-3333-3333-333333333333', 'Product');
