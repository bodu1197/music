-- ============================================
-- Fix Library FK Constraint Issue
-- ============================================
-- Remove FK to public.users, use auth.uid() directly
-- Supabase Auth users are in auth.users, not public.users

-- Drop existing FK constraints
ALTER TABLE library_folders 
DROP CONSTRAINT IF EXISTS library_folders_user_id_fkey;

ALTER TABLE library_tracks 
DROP CONSTRAINT IF EXISTS library_tracks_user_id_fkey;

-- Make user_id NOT NULL (but without FK to public.users)
-- user_id will be validated by RLS policies using auth.uid()
ALTER TABLE library_folders 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE library_tracks 
ALTER COLUMN user_id SET NOT NULL;

-- Ensure RLS is enabled
ALTER TABLE library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_tracks ENABLE ROW LEVEL SECURITY;

-- Recreate clean RLS policies (drop old ones first)
DROP POLICY IF EXISTS "Users can view own folders" ON library_folders;
DROP POLICY IF EXISTS "Users can create own folders" ON library_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON library_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON library_folders;

DROP POLICY IF EXISTS "Users can view own tracks" ON library_tracks;
DROP POLICY IF EXISTS "Users can add own tracks" ON library_tracks;
DROP POLICY IF EXISTS "Users can delete own tracks" ON library_tracks;

-- library_folders policies
CREATE POLICY "Users can view own folders"
  ON library_folders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own folders"
  ON library_folders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own folders"
  ON library_folders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own folders"
  ON library_folders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_default = FALSE);

-- library_tracks policies
CREATE POLICY "Users can view own tracks"
  ON library_tracks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add own tracks"
  ON library_tracks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tracks"
  ON library_tracks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
