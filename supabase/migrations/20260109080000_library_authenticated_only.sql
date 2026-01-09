-- ============================================
-- Library RLS: Authenticated Users Only
-- ============================================
-- Remove anonymous access, enforce user_id based policies

-- Drop all existing library policies
DROP POLICY IF EXISTS "Allow reading library folders" ON library_folders;
DROP POLICY IF EXISTS "Allow creating library folders" ON library_folders;
DROP POLICY IF EXISTS "Allow updating own library folders" ON library_folders;
DROP POLICY IF EXISTS "Allow deleting own library folders" ON library_folders;

DROP POLICY IF EXISTS "Allow reading library tracks" ON library_tracks;
DROP POLICY IF EXISTS "Allow creating library tracks" ON library_tracks;
DROP POLICY IF EXISTS "Allow deleting own library tracks" ON library_tracks;

-- ===========================================
-- Strict RLS Policies for library_folders (Authenticated Only)
-- ===========================================

-- Users can only view their own folders
CREATE POLICY "Users can view own folders"
  ON library_folders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can only create folders for themselves
CREATE POLICY "Users can create own folders"
  ON library_folders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own folders
CREATE POLICY "Users can update own folders"
  ON library_folders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can only delete their own non-default folders
CREATE POLICY "Users can delete own folders"
  ON library_folders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_default = FALSE);

-- ===========================================
-- Strict RLS Policies for library_tracks (Authenticated Only)
-- ===========================================

-- Users can only view their own tracks
CREATE POLICY "Users can view own tracks"
  ON library_tracks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can only add tracks for themselves
CREATE POLICY "Users can add own tracks"
  ON library_tracks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own tracks
CREATE POLICY "Users can delete own tracks"
  ON library_tracks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ===========================================
-- Ensure user_id is required (NOT NULL)
-- ===========================================
-- Note: This might fail if there's existing data without user_id
-- In that case, clean up data first or make it nullable

-- Add indexes for user_id lookups
CREATE INDEX IF NOT EXISTS idx_library_folders_user_id ON library_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_library_tracks_user_id ON library_tracks(user_id);
