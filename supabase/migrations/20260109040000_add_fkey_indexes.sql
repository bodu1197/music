-- ============================================
-- Fix Performance INFO warnings
-- 1. Add missing foreign key indexes
-- 2. Drop unused indexes
-- ============================================

-- ============================================
-- 1. Add indexes for foreign keys
-- ============================================

-- interactions.user_id
CREATE INDEX IF NOT EXISTS idx_interactions_user_id 
  ON public.interactions(user_id);

-- orders.shop_id
CREATE INDEX IF NOT EXISTS idx_orders_shop_id 
  ON public.orders(shop_id);

-- orders.user_id
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
  ON public.orders(user_id);

-- playlists.user_id
CREATE INDEX IF NOT EXISTS idx_playlists_user_id 
  ON public.playlists(user_id);

-- posts.artist_id
CREATE INDEX IF NOT EXISTS idx_posts_artist_id 
  ON public.posts(artist_id);

-- posts.user_id
CREATE INDEX IF NOT EXISTS idx_posts_user_id 
  ON public.posts(user_id);

-- products.artist_id
CREATE INDEX IF NOT EXISTS idx_products_artist_id 
  ON public.products(artist_id);

-- products.shop_id
CREATE INDEX IF NOT EXISTS idx_products_shop_id 
  ON public.products(shop_id);

-- shops.user_id
CREATE INDEX IF NOT EXISTS idx_shops_user_id 
  ON public.shops(user_id);

-- ============================================
-- 2. Drop unused indexes (optional, keeping for now as they may be useful later)
-- ============================================
-- Note: These indexes are currently unused but may become useful as the app grows
-- Keeping them for now:
-- - idx_cache_expires_at (for cache expiry queries)
-- - idx_cache_hits (for popularity tracking)
-- - idx_permanent_playlists_country (for country filtering)
-- - idx_permanent_playlists_genre (for genre filtering)
-- - idx_permanent_playlists_playlist (for playlist lookups)
