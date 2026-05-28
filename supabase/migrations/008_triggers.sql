-- Secure Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, username, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.wff_role, 'client'::public.wff_role)
  );
  
  -- If client, scaffold empty fitness profile automatically
  IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'client') = 'client' THEN
      INSERT INTO public.fitness_profiles (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
