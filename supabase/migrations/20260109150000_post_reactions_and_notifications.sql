-- ============================================
-- Post Reactions & Notifications System
-- ============================================

-- 1. 게시물 반응 테이블 (좋아요/싫어요)
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)  -- 한 사용자당 하나의 반응만
);

-- 2. 게시물 신고 테이블
CREATE TABLE IF NOT EXISTS public.post_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(post_id, reporter_id)  -- 한 사용자당 하나의 신고만
);

-- 3. 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,  -- 알림 받는 사람
    type TEXT NOT NULL CHECK (type IN ('like', 'dislike', 'comment', 'reply', 'mention', 'follow', 'new_post')),
    title TEXT NOT NULL,
    message TEXT,

    -- 관련 엔티티 (어떤 게시물/댓글에 대한 알림인지)
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID,  -- 나중에 comments 테이블 FK 추가 가능

    -- 알림 발생시킨 사용자
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name TEXT,

    -- 상태
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_post ON public.post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 5. RLS 활성화
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. post_reactions RLS 정책
CREATE POLICY "Anyone can view reactions" ON public.post_reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can add own reaction" ON public.post_reactions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own reaction" ON public.post_reactions
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own reaction" ON public.post_reactions
    FOR DELETE TO authenticated
    USING (user_id = (select auth.uid()));

-- 7. post_reports RLS 정책
CREATE POLICY "Users can view own reports" ON public.post_reports
    FOR SELECT TO authenticated
    USING (reporter_id = (select auth.uid()));

CREATE POLICY "Users can create report" ON public.post_reports
    FOR INSERT TO authenticated
    WITH CHECK (reporter_id = (select auth.uid()));

-- 8. notifications RLS 정책
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()));

-- 9. 좋아요/싫어요 시 알림 생성 트리거
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_post_owner_id UUID;
    v_actor_name TEXT;
    v_post_content TEXT;
BEGIN
    -- 게시물 작성자 조회
    SELECT user_id, LEFT(content, 50) INTO v_post_owner_id, v_post_content
    FROM posts WHERE id = NEW.post_id;

    -- 자기 글에 반응하면 알림 안 보냄
    IF v_post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- 반응한 사용자 이름 조회
    SELECT COALESCE(display_name, username, 'Someone') INTO v_actor_name
    FROM users WHERE id = NEW.user_id;

    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, message, post_id, actor_id, actor_name)
    VALUES (
        v_post_owner_id,
        NEW.reaction_type,
        CASE NEW.reaction_type
            WHEN 'like' THEN v_actor_name || '님이 회원님의 글을 좋아합니다'
            WHEN 'dislike' THEN v_actor_name || '님이 회원님의 글에 반응했습니다'
        END,
        v_post_content || '...',
        NEW.post_id,
        NEW.user_id,
        v_actor_name
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_reaction ON public.post_reactions;
CREATE TRIGGER on_post_reaction
    AFTER INSERT ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION notify_on_reaction();

-- 10. posts 테이블에 반응 카운트 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'dislikes_count') THEN
        ALTER TABLE posts ADD COLUMN dislikes_count INT DEFAULT 0;
    END IF;
END $$;

-- 11. 반응 카운트 동기화 트리거
CREATE OR REPLACE FUNCTION sync_reaction_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction_type = 'like' THEN
            UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction_type = 'like' THEN
            UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        ELSE
            UPDATE posts SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.reaction_type != NEW.reaction_type THEN
        -- 반응 타입 변경 시
        IF OLD.reaction_type = 'like' THEN
            UPDATE posts SET likes_count = GREATEST(0, likes_count - 1), dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET likes_count = likes_count + 1, dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = NEW.post_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_reaction_change ON public.post_reactions;
CREATE TRIGGER on_reaction_change
    AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION sync_reaction_counts();

-- 12. Realtime 활성화 (Supabase)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
