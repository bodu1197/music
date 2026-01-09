-- ============================================
-- Backfill missing user profiles
-- ============================================
-- For users who signed up before the auto-create trigger was added,
-- create their public.users record now.

-- Insert missing users from auth.users into public.users
INSERT INTO public.users (id, email, username, display_name, avatar_url, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(
    SPLIT_PART(au.email, '@', 1),
    'user_' || SUBSTR(au.id::text, 1, 8)
  ) || '_' || SUBSTR(au.id::text, 1, 4) as username,  -- Add suffix to avoid conflicts
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as display_name,
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture',
    NULL
  ) as avatar_url,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Also ensure follows table FK is correct
-- The follows.follower_id should reference public.users.id
-- But we need to make sure the constraint exists properly

-- Report how many users were backfilled
DO $$
DECLARE
  count_backfilled INT;
BEGIN
  SELECT COUNT(*) INTO count_backfilled
  FROM public.users pu
  JOIN auth.users au ON pu.id = au.id
  WHERE pu.created_at >= NOW() - INTERVAL '1 minute';

  RAISE NOTICE 'Backfilled % user profiles', count_backfilled;
END;
$$;
