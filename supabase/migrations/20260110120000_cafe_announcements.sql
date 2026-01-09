-- ============================================
-- Cafe Announcements (공지사항)
-- AI 환영 메시지를 한 번만 생성해서 저장
-- ============================================

-- 1. cafe_announcements 테이블 생성
CREATE TABLE IF NOT EXISTS cafe_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,

  -- 공지사항 내용
  content TEXT NOT NULL,
  type TEXT DEFAULT 'welcome',  -- welcome, notice, event
  is_pinned BOOLEAN DEFAULT TRUE,

  -- AI 생성 여부
  is_ai_generated BOOLEAN DEFAULT FALSE,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(artist_id, type)  -- 아티스트당 타입별 하나만
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cafe_announcements_artist ON cafe_announcements(artist_id);
CREATE INDEX IF NOT EXISTS idx_cafe_announcements_pinned ON cafe_announcements(is_pinned) WHERE is_pinned = TRUE;

-- 3. RLS 활성화
ALTER TABLE cafe_announcements ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
-- 누구나 조회 가능
DROP POLICY IF EXISTS "Public read cafe_announcements" ON cafe_announcements;
CREATE POLICY "Public read cafe_announcements" ON cafe_announcements
  FOR SELECT TO public
  USING (true);

-- 인증된 사용자만 등록/수정 가능 (서비스에서 호출)
DROP POLICY IF EXISTS "Auth users can insert cafe_announcements" ON cafe_announcements;
CREATE POLICY "Auth users can insert cafe_announcements" ON cafe_announcements
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can update cafe_announcements" ON cafe_announcements;
CREATE POLICY "Auth users can update cafe_announcements" ON cafe_announcements
  FOR UPDATE TO authenticated
  USING (true);
