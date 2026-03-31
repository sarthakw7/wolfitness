-- Migration: 30_fix_auth_trigger
-- Description: ULTRA-SAFE version of the user creation trigger. 
-- Avoids role-casting and variable declarations to prevent search_path or enum mismatch crashes.

-- 1. CLEAN SLATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. ROBUST FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- We omit 'role' to let the table's DEFAULT ('coach') handle it automatically.
  -- This avoids the 'user_role' type-casting crash entirely.
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name', 
      'Signal User'
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url', 
      new.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-ATTACH TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
