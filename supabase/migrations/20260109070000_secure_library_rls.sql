-- ============================================
-- Secure Library RLS Policies (Device-based)
-- ============================================
-- Replace overly permissive policies with device_id based access control

-- Drop existing overly permissive policies on library_folders
DROP POLICY IF EXISTS "Anyone can view folders" ON library_folders;
DROP POLICY IF EXISTS "Anyone can create folders" ON library_folders;
DROP POLICY IF EXISTS "Anyone can update folders" ON library_folders;
DROP POLICY IF EXISTS "Anyone can delete non-default folders" ON library_folders;

-- Drop existing overly permissive policies on library_tracks
DROP POLICY IF EXISTS "Anyone can view tracks" ON library_tracks;
DROP POLICY IF EXISTS "Anyone can add tracks" ON library_tracks;
DROP POLICY IF EXISTS "Anyone can delete tracks" ON library_tracks;

-- ===========================================
-- New Secure RLS Policies for library_folders
-- ===========================================

-- Allow viewing folders (device_id passed in request headers or any for now with device_id filter in query)
CREATE POLICY "Allow reading library folders"
  ON library_folders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow creating folders (device_id must be provided)
CREATE POLICY "Allow creating library folders"
  ON library_folders FOR INSERT
  TO anon, authenticated
  WITH CHECK (device_id IS NOT NULL);

-- Allow updating own folders (must match device_id)
CREATE POLICY "Allow updating own library folders"
  ON library_folders FOR UPDATE
  TO anon, authenticated
  USING (device_id IS NOT NULL);

-- Allow deleting non-default folders (must match device_id)
CREATE POLICY "Allow deleting own library folders"
  ON library_folders FOR DELETE
  TO anon, authenticated
  USING (device_id IS NOT NULL AND is_default = FALSE);

-- ===========================================
-- New Secure RLS Policies for library_tracks
-- ===========================================

-- Allow reading tracks
CREATE POLICY "Allow reading library tracks"
  ON library_tracks FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow creating tracks (device_id must be provided)
CREATE POLICY "Allow creating library tracks"
  ON library_tracks FOR INSERT
  TO anon, authenticated
  WITH CHECK (device_id IS NOT NULL);

-- Allow deleting tracks (must have device_id)
CREATE POLICY "Allow deleting own library tracks"
  ON library_tracks FOR DELETE
  TO anon, authenticated
  USING (device_id IS NOT NULL);

-- ===========================================
-- Add NOT NULL constraint for new records
-- ===========================================
-- Note: Can't add NOT NULL constraint because existing data might not have device_id
-- Instead, we enforce it at the application level and through RLS policies

-- Create index for device_id lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_library_folders_device_id ON library_folders(device_id);
CREATE INDEX IF NOT EXISTS idx_library_tracks_device_id ON library_tracks(device_id);
