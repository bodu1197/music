-- ============================================
-- Fix Library Tables for Anonymous Users
-- ============================================
-- Allow users without login to store library data using device_id

-- Add device_id column to library_folders
ALTER TABLE library_folders 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add device_id column to library_tracks
ALTER TABLE library_tracks 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Make user_id optional (nullable)
ALTER TABLE library_folders 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE library_tracks 
ALTER COLUMN user_id DROP NOT NULL;

-- Create indexes for device_id
CREATE INDEX IF NOT EXISTS idx_library_folders_device ON library_folders(device_id);
CREATE INDEX IF NOT EXISTS idx_library_tracks_device ON library_tracks(device_id);

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own folders" ON library_folders;
DROP POLICY IF EXISTS "Users can create own folders" ON library_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON library_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON library_folders;
DROP POLICY IF EXISTS "Users can view own tracks" ON library_tracks;
DROP POLICY IF EXISTS "Users can add own tracks" ON library_tracks;
DROP POLICY IF EXISTS "Users can delete own tracks" ON library_tracks;

-- New policies: Allow anonymous access (anon role can read/write)
-- library_folders
CREATE POLICY "Anyone can view folders"
  ON library_folders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create folders"
  ON library_folders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update folders"
  ON library_folders FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete non-default folders"
  ON library_folders FOR DELETE
  TO anon, authenticated
  USING (is_default = FALSE);

-- library_tracks
CREATE POLICY "Anyone can view tracks"
  ON library_tracks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can add tracks"
  ON library_tracks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete tracks"
  ON library_tracks FOR DELETE
  TO anon, authenticated
  USING (true);
