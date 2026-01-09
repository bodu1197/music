-- ============================================
-- Auto-create user profile on signup
-- ============================================
-- When a user signs up via Supabase Auth (auth.users),
-- automatically create a profile in public.users

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    -- Generate username from email (before @)
    COALESCE(
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || SUBSTR(NEW.id::text, 1, 8)
    ),
    -- Display name from email or metadata
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    -- Avatar from OAuth provider if available
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Username already exists, append random suffix
    INSERT INTO public.users (id, email, username, display_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(MD5(RANDOM()::text), 1, 4),
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NULL
      )
    );
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also handle user deletion (cascade)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
