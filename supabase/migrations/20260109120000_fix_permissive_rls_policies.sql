-- ============================================
-- Fix Permissive RLS Policies
-- artists와 artist_data 테이블의 INSERT/UPDATE 정책 수정
-- 이 테이블들은 service_role (API)에서만 수정 가능하도록 변경
-- ============================================

-- Drop existing permissive policies for artists table
DROP POLICY IF EXISTS "Auth users can insert artists" ON public.artists;
DROP POLICY IF EXISTS "Auth users can update artists" ON public.artists;

-- Drop existing permissive policies for artist_data table
DROP POLICY IF EXISTS "Auth users can insert artist_data" ON public.artist_data;
DROP POLICY IF EXISTS "Auth users can update artist_data" ON public.artist_data;

-- ============================================
-- artists 테이블: 시스템 전용 INSERT/UPDATE
-- service_role은 RLS를 우회하므로 별도 정책 불필요
-- 일반 사용자는 읽기만 가능
-- ============================================

-- Note: SELECT policy "Anyone can view artists" should already exist
-- If not, create it:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'artists'
        AND policyname = 'Anyone can view artists'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can view artists" ON public.artists FOR SELECT USING (true)';
    END IF;
END
$$;

-- ============================================
-- artist_data 테이블: 시스템 전용 INSERT/UPDATE
-- service_role은 RLS를 우회하므로 별도 정책 불필요
-- 일반 사용자는 읽기만 가능
-- ============================================

-- Note: SELECT policy "Anyone can view artist_data" should already exist
-- If not, create it:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'artist_data'
        AND policyname = 'Anyone can view artist_data'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can view artist_data" ON public.artist_data FOR SELECT USING (true)';
    END IF;
END
$$;

-- ============================================
-- 설명:
-- - artists, artist_data 테이블은 YouTube Music API 캐시 역할
-- - INSERT/UPDATE는 farming API (service_role)에서만 수행
-- - service_role은 RLS를 자동으로 우회하므로 정책 불필요
-- - 일반 사용자(anon, authenticated)는 SELECT만 가능
-- ============================================
