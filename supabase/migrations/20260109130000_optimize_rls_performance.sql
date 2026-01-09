-- ============================================
-- RLS Performance Optimization
-- 1. auth.uid() -> (select auth.uid()) 변경 (initplan 최적화)
-- 2. 중복 정책 제거
-- 3. 중복 인덱스 제거
-- ============================================

-- ============================================
-- 1. library_folders: RLS 정책 최적화
-- ============================================
DROP POLICY IF EXISTS "Users can view own folders" ON public.library_folders;
DROP POLICY IF EXISTS "Users can create own folders" ON public.library_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON public.library_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON public.library_folders;

CREATE POLICY "Users can view own folders" ON public.library_folders
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own folders" ON public.library_folders
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own folders" ON public.library_folders
    FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own folders" ON public.library_folders
    FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================
-- 2. library_tracks: RLS 정책 최적화
-- ============================================
DROP POLICY IF EXISTS "Users can view own tracks" ON public.library_tracks;
DROP POLICY IF EXISTS "Users can add own tracks" ON public.library_tracks;
DROP POLICY IF EXISTS "Users can delete own tracks" ON public.library_tracks;

CREATE POLICY "Users can view own tracks" ON public.library_tracks
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can add own tracks" ON public.library_tracks
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own tracks" ON public.library_tracks
    FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================
-- 3. follows: RLS 정책 최적화 + 중복 제거
-- ============================================
DROP POLICY IF EXISTS "Users can view own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can create own follows" ON public.follows;
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;

CREATE POLICY "Users can view own follows" ON public.follows
    FOR SELECT USING (follower_id = (select auth.uid()));

CREATE POLICY "Users can insert own follows" ON public.follows
    FOR INSERT WITH CHECK (follower_id = (select auth.uid()));

CREATE POLICY "Users can delete own follows" ON public.follows
    FOR DELETE USING (follower_id = (select auth.uid()));

-- ============================================
-- 4. posts: RLS 정책 최적화 + 중복 제거
-- ============================================
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Auth users can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- 공개 게시물은 누구나 볼 수 있음 (auth 함수 없이)
CREATE POLICY "Public read posts" ON public.posts
    FOR SELECT USING (visibility = 'public');

-- 인증된 사용자만 INSERT (자신의 user_id로만)
CREATE POLICY "Auth users can insert posts" ON public.posts
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

-- 자신의 게시물만 수정 가능
CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (user_id = (select auth.uid()));

-- 자신의 게시물만 삭제 가능
CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================
-- 5. artists: 중복 SELECT 정책 제거
-- ============================================
DROP POLICY IF EXISTS "Public read artists" ON public.artists;
-- "Anyone can view artists" 정책만 유지

-- ============================================
-- 6. artist_data: 중복 SELECT 정책 제거
-- ============================================
DROP POLICY IF EXISTS "Public read artist_data" ON public.artist_data;
-- "Anyone can view artist_data" 정책만 유지

-- ============================================
-- 7. cafe_memberships: 중복 SELECT 정책 제거
-- ============================================
DROP POLICY IF EXISTS "Users manage own memberships" ON public.cafe_memberships;
-- "Anyone can view memberships" 정책만 유지하고 INSERT/UPDATE/DELETE 추가

-- cafe_memberships 관리 정책 (authenticated만)
CREATE POLICY "Users can join cafe" ON public.cafe_memberships
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can leave cafe" ON public.cafe_memberships
    FOR DELETE TO authenticated
    USING (user_id = (select auth.uid()));

-- ============================================
-- 8. cafe_post_likes: 중복 SELECT 정책 제거
-- ============================================
DROP POLICY IF EXISTS "Users manage own likes" ON public.cafe_post_likes;
-- "Anyone can view likes" 정책만 유지하고 INSERT/DELETE 추가

CREATE POLICY "Users can like posts" ON public.cafe_post_likes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can unlike posts" ON public.cafe_post_likes
    FOR DELETE TO authenticated
    USING (user_id = (select auth.uid()));

-- ============================================
-- 9. 중복 인덱스 제거
-- ============================================
DROP INDEX IF EXISTS idx_library_folders_device;
DROP INDEX IF EXISTS idx_library_folders_user;
DROP INDEX IF EXISTS idx_library_tracks_device;
DROP INDEX IF EXISTS idx_library_tracks_user;
-- *_id 버전 인덱스만 유지

-- ============================================
-- 완료
-- ============================================
