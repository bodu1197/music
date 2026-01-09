-- ============================================
-- Artist Search Persistence System
-- 아티스트 검색 결과 영구 저장 + 백그라운드 갱신
-- ============================================

-- 1. artists 테이블에 검색 관련 컬럼 추가
DO $$
BEGIN
  -- 마지막 검색 갱신 시간
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'last_search_refreshed_at'
  ) THEN
    ALTER TABLE artists ADD COLUMN last_search_refreshed_at TIMESTAMPTZ;
  END IF;

  -- 검색으로 등록되었는지 여부 (artist_data 없이 기본 정보만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'is_search_indexed'
  ) THEN
    ALTER TABLE artists ADD COLUMN is_search_indexed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. 검색 쿼리 갱신 로그 테이블 (Throttling용)
CREATE TABLE IF NOT EXISTS search_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 검색어 정보
  query_hash TEXT UNIQUE NOT NULL,        -- MD5(검색어.toLowerCase())
  query TEXT NOT NULL,                    -- 원본 검색어

  -- 갱신 정보
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  result_count INT DEFAULT 0,
  refresh_count INT DEFAULT 1,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trigram 확장 (인덱스 생성 전에 먼저 활성화)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_artists_search_refreshed ON artists(last_search_refreshed_at);
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON artists USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_refresh_log_hash ON search_refresh_log(query_hash);
CREATE INDEX IF NOT EXISTS idx_search_refresh_log_refreshed ON search_refresh_log(last_refreshed_at);

-- 5. RLS 활성화 및 정책 (search_refresh_log)
ALTER TABLE search_refresh_log ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능 (캐시 상태 확인용)
DROP POLICY IF EXISTS "Public read search_refresh_log" ON search_refresh_log;
CREATE POLICY "Public read search_refresh_log" ON search_refresh_log
  FOR SELECT TO public
  USING (true);

-- 인증된 사용자만 갱신 가능
DROP POLICY IF EXISTS "Auth users can insert search_refresh_log" ON search_refresh_log;
CREATE POLICY "Auth users can insert search_refresh_log" ON search_refresh_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can update search_refresh_log" ON search_refresh_log;
CREATE POLICY "Auth users can update search_refresh_log" ON search_refresh_log
  FOR UPDATE TO authenticated
  USING (true);

-- 6. 아티스트 검색 함수 (Full-text search + Trigram)
CREATE OR REPLACE FUNCTION search_artists_by_name(
  p_query TEXT,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  channel_id TEXT,
  name TEXT,
  thumbnail_url TEXT,
  subscribers TEXT,
  last_search_refreshed_at TIMESTAMPTZ,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.channel_id,
    a.name,
    a.thumbnail_url,
    a.subscribers,
    a.last_search_refreshed_at,
    similarity(a.name, p_query) AS similarity_score
  FROM artists a
  WHERE
    a.name ILIKE '%' || p_query || '%'
    OR similarity(a.name, p_query) > 0.1
  ORDER BY
    similarity(a.name, p_query) DESC,
    a.last_search_refreshed_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- 7. 검색 갱신 필요 여부 확인 함수
CREATE OR REPLACE FUNCTION should_refresh_search(
  p_query_hash TEXT,
  p_throttle_minutes INT DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_refreshed TIMESTAMPTZ;
BEGIN
  SELECT last_refreshed_at INTO v_last_refreshed
  FROM search_refresh_log
  WHERE query_hash = p_query_hash;

  -- 기록 없으면 갱신 필요
  IF v_last_refreshed IS NULL THEN
    RETURN TRUE;
  END IF;

  -- throttle_minutes 이내면 갱신 불필요
  RETURN v_last_refreshed < NOW() - (p_throttle_minutes || ' minutes')::INTERVAL;
END;
$$;

-- 8. 검색 갱신 로그 업데이트 함수
CREATE OR REPLACE FUNCTION update_search_refresh_log(
  p_query_hash TEXT,
  p_query TEXT,
  p_result_count INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO search_refresh_log (query_hash, query, result_count, last_refreshed_at)
  VALUES (p_query_hash, p_query, p_result_count, NOW())
  ON CONFLICT (query_hash)
  DO UPDATE SET
    last_refreshed_at = NOW(),
    result_count = p_result_count,
    refresh_count = search_refresh_log.refresh_count + 1;
END;
$$;

-- 9. 아티스트 기본 정보 upsert 함수 (검색 결과 저장용)
CREATE OR REPLACE FUNCTION upsert_artist_from_search(
  p_channel_id TEXT,
  p_name TEXT,
  p_thumbnail_url TEXT DEFAULT NULL,
  p_subscribers TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_id UUID;
BEGIN
  -- 기존 아티스트 확인
  SELECT id INTO v_artist_id
  FROM artists
  WHERE channel_id = p_channel_id;

  IF v_artist_id IS NOT NULL THEN
    -- 기존 아티스트 업데이트 (검색 시간만)
    UPDATE artists
    SET
      last_search_refreshed_at = NOW(),
      -- 이름/썸네일은 검색에서 가져온 게 더 최신일 수 있음
      name = COALESCE(p_name, name),
      thumbnail_url = COALESCE(p_thumbnail_url, thumbnail_url),
      subscribers = COALESCE(p_subscribers, subscribers)
    WHERE id = v_artist_id;

    RETURN v_artist_id;
  END IF;

  -- 새 아티스트 등록 (기본 정보만, artist_data 없음)
  INSERT INTO artists (
    channel_id,
    name,
    thumbnail_url,
    subscribers,
    is_search_indexed,
    last_search_refreshed_at,
    is_virtual
  )
  VALUES (
    p_channel_id,
    p_name,
    p_thumbnail_url,
    p_subscribers,
    TRUE,
    NOW(),
    TRUE
  )
  RETURNING id INTO v_artist_id;

  RETURN v_artist_id;
END;
$$;

-- 10. 오래된 검색 로그 정리 함수 (선택적 - Cron으로 호출)
CREATE OR REPLACE FUNCTION cleanup_old_search_logs(
  p_days_old INT DEFAULT 30
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM search_refresh_log
  WHERE last_refreshed_at < NOW() - (p_days_old || ' days')::INTERVAL
  AND refresh_count < 3;  -- 3회 미만 검색된 쿼리만 삭제

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
