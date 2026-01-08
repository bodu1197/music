-- ============================================
-- Fix RLS Performance Issues
-- 1. auth_rls_initplan: wrap auth.uid() with (select ...)
-- 2. multiple_permissive_policies: consolidate policies
-- 3. duplicate_index: drop duplicate indexes
-- ============================================

-- ============================================
-- DROP duplicate indexes
-- ============================================
DROP INDEX IF EXISTS idx_api_cache_expiry;
DROP INDEX IF EXISTS idx_cache_expiry;

-- ============================================
-- DROP ALL existing policies and recreate with optimized auth calls
-- ============================================

-- 1. users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE
  USING (id = (select auth.uid()));

-- 2. artists - consolidate into single policy
DROP POLICY IF EXISTS "Anyone can view artists" ON public.artists;
DROP POLICY IF EXISTS "Service role can manage artists" ON public.artists;

CREATE POLICY "Public read artists"
  ON public.artists FOR SELECT
  USING (true);

CREATE POLICY "Service role manages artists"
  ON public.artists FOR ALL
  USING ((select auth.role()) = 'service_role');

-- 3. cache - consolidate into single policy
DROP POLICY IF EXISTS "Anyone can read cache" ON public.cache;
DROP POLICY IF EXISTS "Service role can manage cache" ON public.cache;

CREATE POLICY "Public read cache"
  ON public.cache FOR SELECT
  USING (true);

CREATE POLICY "Service role manages cache"
  ON public.cache FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role updates cache"
  ON public.cache FOR UPDATE
  USING ((select auth.role()) = 'service_role');

CREATE POLICY "Service role deletes cache"
  ON public.cache FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- 4. posts
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Anyone can view public posts"
  ON public.posts FOR SELECT
  USING (visibility = 'public' OR user_id = (select auth.uid()));

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 5. interactions
DROP POLICY IF EXISTS "Anyone can view interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can create own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON public.interactions;

CREATE POLICY "Anyone can view interactions"
  ON public.interactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create own interactions"
  ON public.interactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own interactions"
  ON public.interactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 6. api_cache - consolidate into single policy
DROP POLICY IF EXISTS "Anyone can read api_cache" ON public.api_cache;
DROP POLICY IF EXISTS "Service role can manage api_cache" ON public.api_cache;

CREATE POLICY "Public read api_cache"
  ON public.api_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role manages api_cache"
  ON public.api_cache FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role updates api_cache"
  ON public.api_cache FOR UPDATE
  USING ((select auth.role()) = 'service_role');

CREATE POLICY "Service role deletes api_cache"
  ON public.api_cache FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- 7. follows
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;

CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can create own follows"
  ON public.follows FOR INSERT
  WITH CHECK ((select auth.uid()) = follower_id);

CREATE POLICY "Users can delete own follows"
  ON public.follows FOR DELETE
  USING ((select auth.uid()) = follower_id);

-- 8. playlists
DROP POLICY IF EXISTS "Anyone can view public playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can create own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON public.playlists;

CREATE POLICY "Anyone can view public playlists"
  ON public.playlists FOR SELECT
  USING (is_public = true OR user_id = (select auth.uid()));

CREATE POLICY "Users can create own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own playlists"
  ON public.playlists FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 9. shops
DROP POLICY IF EXISTS "Anyone can view shops" ON public.shops;
DROP POLICY IF EXISTS "Users can create own shop" ON public.shops;
DROP POLICY IF EXISTS "Users can update own shop" ON public.shops;
DROP POLICY IF EXISTS "Users can delete own shop" ON public.shops;

CREATE POLICY "Anyone can view active shops"
  ON public.shops FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create own shop"
  ON public.shops FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own shop"
  ON public.shops FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own shop"
  ON public.shops FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 10. products - consolidate policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Shop owners can manage products" ON public.products;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Shop owners can insert products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = products.shop_id
      AND shops.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Shop owners can update products"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = products.shop_id
      AND shops.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Shop owners can delete products"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = products.shop_id
      AND shops.user_id = (select auth.uid())
    )
  );

-- 11. orders - consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Shop owners can view shop orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Shop owners can update orders" ON public.orders;

CREATE POLICY "Users and shop owners can view orders"
  ON public.orders FOR SELECT
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = orders.shop_id
      AND shops.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Shop owners can update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = orders.shop_id
      AND shops.user_id = (select auth.uid())
    )
  );

-- 12. permanent_playlists - consolidate policies
DROP POLICY IF EXISTS "Anyone can view permanent_playlists" ON public.permanent_playlists;
DROP POLICY IF EXISTS "Service role can manage permanent_playlists" ON public.permanent_playlists;

CREATE POLICY "Public read permanent_playlists"
  ON public.permanent_playlists FOR SELECT
  USING (true);

CREATE POLICY "Service role manages permanent_playlists"
  ON public.permanent_playlists FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role updates permanent_playlists"
  ON public.permanent_playlists FOR UPDATE
  USING ((select auth.role()) = 'service_role');

CREATE POLICY "Service role deletes permanent_playlists"
  ON public.permanent_playlists FOR DELETE
  USING ((select auth.role()) = 'service_role');
