-- ============================================
-- Enable RLS for all public tables
-- Fix Security Advisor: rls_disabled_in_public
-- ============================================

-- 1. users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- 2. artists (public read, admin write)
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artists"
  ON public.artists FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage artists"
  ON public.artists FOR ALL
  USING (auth.role() = 'service_role');

-- 3. cache (service role only)
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage cache"
  ON public.cache FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read cache"
  ON public.cache FOR SELECT
  USING (true);

-- 4. posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public posts"
  ON public.posts FOR SELECT
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- 5. interactions
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interactions"
  ON public.interactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create own interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON public.interactions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. api_cache (service role only)
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage api_cache"
  ON public.api_cache FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read api_cache"
  ON public.api_cache FOR SELECT
  USING (true);

-- 7. follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 8. playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public playlists"
  ON public.playlists FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

-- 9. shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shops"
  ON public.shops FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create own shop"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shop"
  ON public.shops FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shop"
  ON public.shops FOR DELETE
  USING (auth.uid() = user_id);

-- 10. products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Shop owners can manage products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = products.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- 11. orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Shop owners can view shop orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = orders.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shop owners can update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = orders.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- 12. permanent_playlists (service role + public read)
ALTER TABLE public.permanent_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permanent_playlists"
  ON public.permanent_playlists FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage permanent_playlists"
  ON public.permanent_playlists FOR ALL
  USING (auth.role() = 'service_role');
