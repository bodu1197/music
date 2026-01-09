-- ============================================
-- Cafe Feature Database Tables
-- ============================================
-- cafe_memberships: 사용자가 가입한 카페 추적
-- cafe_posts: 카페 게시글
-- cafe_comments: 게시글 댓글
-- cafe_ai_posts: AI 아티스트 게시글

-- ============================================
-- 1. Cafe Memberships (카페 가입)
-- ============================================
CREATE TABLE cafe_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    
    -- Membership info
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    role TEXT DEFAULT 'member', -- 'member', 'admin', 'moderator'
    is_active BOOLEAN DEFAULT true,
    
    -- Unique constraint: 한 유저가 같은 카페에 중복 가입 불가
    UNIQUE(user_id, artist_id)
);

-- Indexes
CREATE INDEX idx_cafe_memberships_user ON cafe_memberships(user_id);
CREATE INDEX idx_cafe_memberships_artist ON cafe_memberships(artist_id);

-- RLS
ALTER TABLE cafe_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view all memberships (to see member count)
CREATE POLICY "Anyone can view memberships"
    ON cafe_memberships FOR SELECT
    USING (true);

-- Users can manage their own memberships
CREATE POLICY "Users manage own memberships"
    ON cafe_memberships FOR ALL
    USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 2. Cafe Posts (게시글)
-- ============================================
CREATE TABLE cafe_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    media_urls TEXT[],
    
    -- AI post flag
    is_ai BOOLEAN DEFAULT false,
    ai_post_type TEXT, -- 'greeting', 'update', 'thanks', 'random'
    
    -- Stats
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cafe_posts_artist ON cafe_posts(artist_id);
CREATE INDEX idx_cafe_posts_user ON cafe_posts(user_id);
CREATE INDEX idx_cafe_posts_created ON cafe_posts(created_at DESC);

-- RLS
ALTER TABLE cafe_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts
CREATE POLICY "Anyone can view posts"
    ON cafe_posts FOR SELECT
    USING (true);

-- Cafe members can create posts
CREATE POLICY "Members create posts"
    ON cafe_posts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cafe_memberships 
            WHERE user_id = (SELECT auth.uid()) 
            AND artist_id = cafe_posts.artist_id
            AND is_active = true
        )
        OR is_ai = true
    );

-- Users can update/delete their own posts
CREATE POLICY "Users manage own posts"
    ON cafe_posts FOR UPDATE
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users delete own posts"
    ON cafe_posts FOR DELETE
    USING ((SELECT auth.uid()) = user_id);

-- Service role can manage AI posts
CREATE POLICY "Service role manages AI posts"
    ON cafe_posts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 3. Cafe Comments (댓글)
-- ============================================
CREATE TABLE cafe_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES cafe_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    
    -- AI comment flag
    is_ai BOOLEAN DEFAULT false,
    
    -- Parent comment for replies
    parent_id UUID REFERENCES cafe_comments(id) ON DELETE CASCADE,
    
    -- Stats
    likes_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cafe_comments_post ON cafe_comments(post_id);
CREATE INDEX idx_cafe_comments_user ON cafe_comments(user_id);
CREATE INDEX idx_cafe_comments_parent ON cafe_comments(parent_id);

-- RLS
ALTER TABLE cafe_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
    ON cafe_comments FOR SELECT
    USING (true);

-- Cafe members can create comments
CREATE POLICY "Members create comments"
    ON cafe_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cafe_memberships m
            JOIN cafe_posts p ON p.artist_id = m.artist_id
            WHERE m.user_id = (SELECT auth.uid())
            AND p.id = cafe_comments.post_id
            AND m.is_active = true
        )
    );

-- Users can manage their own comments
CREATE POLICY "Users manage own comments"
    ON cafe_comments FOR UPDATE
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users delete own comments"
    ON cafe_comments FOR DELETE
    USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 4. Cafe Post Likes (좋아요)
-- ============================================
CREATE TABLE cafe_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES cafe_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_cafe_post_likes_post ON cafe_post_likes(post_id);
CREATE INDEX idx_cafe_post_likes_user ON cafe_post_likes(user_id);

ALTER TABLE cafe_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
    ON cafe_post_likes FOR SELECT
    USING (true);

CREATE POLICY "Users manage own likes"
    ON cafe_post_likes FOR ALL
    USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 5. Trigger: Update likes/comments count
-- ============================================
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE cafe_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE cafe_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cafe_post_likes_trigger
AFTER INSERT OR DELETE ON cafe_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE cafe_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE cafe_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cafe_post_comments_trigger
AFTER INSERT OR DELETE ON cafe_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
