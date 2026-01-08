-- ============================================
-- Library Tables for MY LIBRARY feature
-- ============================================

-- 1. Library Folders (사용자별 플레이리스트 폴더)
CREATE TABLE library_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#667eea',
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Library Tracks (폴더별 트랙 목록)
CREATE TABLE library_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES library_folders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  thumbnail TEXT,
  duration TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(folder_id, video_id)
);

-- Indexes for performance
CREATE INDEX idx_library_folders_user ON library_folders(user_id);
CREATE INDEX idx_library_tracks_folder ON library_tracks(folder_id);
CREATE INDEX idx_library_tracks_user ON library_tracks(user_id);
CREATE INDEX idx_library_tracks_video ON library_tracks(video_id);

-- Enable RLS
ALTER TABLE library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_folders
CREATE POLICY "Users can view own folders"
  ON library_folders FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own folders"
  ON library_folders FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own folders"
  ON library_folders FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own folders"
  ON library_folders FOR DELETE
  USING (user_id = (select auth.uid()) AND is_default = FALSE);

-- RLS Policies for library_tracks
CREATE POLICY "Users can view own tracks"
  ON library_tracks FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can add own tracks"
  ON library_tracks FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own tracks"
  ON library_tracks FOR DELETE
  USING (user_id = (select auth.uid()));
