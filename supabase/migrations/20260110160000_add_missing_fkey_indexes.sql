-- ============================================
-- Add Missing Foreign Key Indexes
-- Fix Supabase INFO warnings for unindexed FKs
-- ============================================

-- 1. notifications.actor_id (references users)
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id
  ON public.notifications(actor_id);

-- 2. notifications.post_id (references posts)
CREATE INDEX IF NOT EXISTS idx_notifications_post_id
  ON public.notifications(post_id);

-- 3. post_reports.reporter_id (references users)
CREATE INDEX IF NOT EXISTS idx_post_reports_reporter_id
  ON public.post_reports(reporter_id);

-- ============================================
-- Note on unused indexes:
-- The INFO warnings also mention ~35 unused indexes.
-- These are being kept as they may be needed for:
-- - Future query patterns
-- - App growth and scaling
-- - Feature additions
--
-- Review and drop unused indexes when:
-- - The index has been unused for 30+ days
-- - No planned features will use it
-- - Storage optimization is needed
-- ============================================
