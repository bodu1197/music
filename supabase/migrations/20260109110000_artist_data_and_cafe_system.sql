-- ============================================
-- Artist Data & Cafe System
-- 가상회원(아티스트) 시스템 + 카페 기능
-- ============================================

-- 1. artist_data 테이블 (동적 데이터 - 앨범, 곡 등)
CREATE TABLE IF NOT EXISTS artist_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,

  -- 동적 프로필 정보
  thumbnail_url TEXT,
  banner_url TEXT,
  description TEXT,
  subscribers TEXT,

  -- 앨범/싱글/곡 목록 (JSONB로 저장)
  albums JSONB DEFAULT '[]',           -- [{browseId, title, year, thumbnail, type}]
  singles JSONB DEFAULT '[]',          -- [{browseId, title, year, thumbnail}]
  top_songs JSONB DEFAULT '[]',        -- [{videoId, title, plays, thumbnail}]
  related_artists JSONB DEFAULT '[]',  -- [{browseId, name, thumbnail}]

  -- 캐시 관리
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),

  -- 통계
  view_count INT DEFAULT 0,
  follower_count INT DEFAULT 0,
  post_count INT DEFAULT 0,

  -- 메타데이터
  source_country TEXT,                 -- 어느 국가 차트에서 발견됐는지
  is_prefarmed BOOLEAN DEFAULT FALSE,  -- 사전 파밍된 아티스트인지

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(artist_id)
);

-- 2. artists 테이블에 slug 컬럼 추가 (없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'artists' AND column_name = 'is_virtual') THEN
    ALTER TABLE artists ADD COLUMN is_virtual BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_artist_data_artist ON artist_data(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_data_view_count ON artist_data(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_artist_data_prefarmed ON artist_data(is_prefarmed);
CREATE INDEX IF NOT EXISTS idx_artists_channel_id ON artists(channel_id);
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);

-- 4. RLS 활성화
ALTER TABLE artist_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- 5. artists 테이블 RLS 정책
-- 누구나 아티스트 조회 가능
DROP POLICY IF EXISTS "Public read artists" ON artists;
CREATE POLICY "Public read artists" ON artists
  FOR SELECT TO public
  USING (true);

-- 인증된 사용자만 아티스트 등록 가능
DROP POLICY IF EXISTS "Auth users can insert artists" ON artists;
CREATE POLICY "Auth users can insert artists" ON artists
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 인증된 사용자만 아티스트 업데이트 가능
DROP POLICY IF EXISTS "Auth users can update artists" ON artists;
CREATE POLICY "Auth users can update artists" ON artists
  FOR UPDATE TO authenticated
  USING (true);

-- 6. artist_data 테이블 RLS 정책
-- 누구나 조회 가능
DROP POLICY IF EXISTS "Public read artist_data" ON artist_data;
CREATE POLICY "Public read artist_data" ON artist_data
  FOR SELECT TO public
  USING (true);

-- 인증된 사용자만 등록/수정 가능
DROP POLICY IF EXISTS "Auth users can insert artist_data" ON artist_data;
CREATE POLICY "Auth users can insert artist_data" ON artist_data
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can update artist_data" ON artist_data;
CREATE POLICY "Auth users can update artist_data" ON artist_data
  FOR UPDATE TO authenticated
  USING (true);

-- 7. follows 테이블 확인 및 RLS (카페 가입용)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own follows" ON follows;
CREATE POLICY "Users can view own follows" ON follows
  FOR SELECT TO authenticated
  USING (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own follows" ON follows;
CREATE POLICY "Users can insert own follows" ON follows
  FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- 8. posts 테이블 RLS (카페 게시물용)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 공개 게시물은 누구나 조회 가능
DROP POLICY IF EXISTS "Public read posts" ON posts;
CREATE POLICY "Public read posts" ON posts
  FOR SELECT TO public
  USING (visibility = 'public' OR user_id = auth.uid());

-- 인증된 사용자만 게시물 작성 가능
DROP POLICY IF EXISTS "Auth users can insert posts" ON posts;
CREATE POLICY "Auth users can insert posts" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 본인 게시물만 수정 가능
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 본인 게시물만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 9. 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_artist_view(p_artist_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE artist_data
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE artist_id = p_artist_id;
END;
$$;

-- 10. 팔로워 수 동기화 트리거
CREATE OR REPLACE FUNCTION sync_artist_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_uuid UUID;
BEGIN
  -- following_id를 UUID로 변환 시도
  BEGIN
    IF TG_OP = 'INSERT' THEN
      v_artist_uuid := NEW.following_id::UUID;
    ELSE
      v_artist_uuid := OLD.following_id::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  -- artist_data 팔로워 수 업데이트
  UPDATE artist_data
  SET follower_count = (
    SELECT COUNT(*) FROM follows
    WHERE following_type = 'artist'
    AND following_id = v_artist_uuid::TEXT
  ),
  updated_at = NOW()
  WHERE artist_id = v_artist_uuid;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_insert ON follows;
CREATE TRIGGER on_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW
  WHEN (NEW.following_type = 'artist')
  EXECUTE FUNCTION sync_artist_follower_count();

DROP TRIGGER IF EXISTS on_follow_delete ON follows;
CREATE TRIGGER on_follow_delete
  AFTER DELETE ON follows
  FOR EACH ROW
  WHEN (OLD.following_type = 'artist')
  EXECUTE FUNCTION sync_artist_follower_count();

-- 11. 게시물 수 동기화 트리거
CREATE OR REPLACE FUNCTION sync_artist_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.artist_id IS NOT NULL THEN
    UPDATE artist_data
    SET post_count = post_count + 1,
        updated_at = NOW()
    WHERE artist_id = NEW.artist_id;
  ELSIF TG_OP = 'DELETE' AND OLD.artist_id IS NOT NULL THEN
    UPDATE artist_data
    SET post_count = GREATEST(0, post_count - 1),
        updated_at = NOW()
    WHERE artist_id = OLD.artist_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_post_change ON posts;
CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_artist_post_count();
