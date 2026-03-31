-- Create custom types
CREATE TYPE user_role AS ENUM ('coach', 'mentor', 'admin');
CREATE TYPE session_format AS ENUM ('1:1', 'group', 'recorded');
CREATE TYPE enrollment_status AS ENUM ('active', 'pending', 'completed');

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'coach' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create coach assessments table
CREATE TABLE coach_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  why_coach TEXT,
  struggles TEXT,
  level TEXT,
  goal_12m TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create mentors table
CREATE TABLE mentors (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  philosophy_line TEXT,
  story TEXT,
  price_tier TEXT,
  commitment_level TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mentor focus areas
CREATE TABLE mentor_focus_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  area TEXT NOT NULL
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  format session_format NOT NULL,
  scheduled_at TIMESTAMPTZ,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status DEFAULT 'pending' NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, mentor_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Policies

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Coach Assessments
CREATE POLICY "Users can view own assessment" ON coach_assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessment" ON coach_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mentors
CREATE POLICY "Published mentors are viewable by everyone" ON mentors
  FOR SELECT USING (is_published = true OR auth.uid() = id);

-- Sessions
CREATE POLICY "Sessions are viewable by mentor or enrolled coaches" ON sessions
  FOR SELECT USING (
    auth.uid() = mentor_id OR 
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE mentor_id = sessions.mentor_id 
      AND coach_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
