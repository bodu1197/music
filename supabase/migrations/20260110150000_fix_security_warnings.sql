-- ============================================
-- Fix Supabase Security Warnings
-- 1. Move pg_trgm to extensions schema
-- 2. Fix overly permissive RLS policies
-- ============================================

-- 1. Create extensions schema and move pg_trgm
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate pg_trgm in extensions schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate the trigram index (was dropped with CASCADE)
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON artists USING gin (name extensions.gin_trgm_ops);

-- Update search function to use extensions schema
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
SET search_path = public, extensions
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
    extensions.similarity(a.name, p_query) AS similarity_score
  FROM artists a
  WHERE
    a.name ILIKE '%' || p_query || '%'
    OR extensions.similarity(a.name, p_query) > 0.1
  ORDER BY
    extensions.similarity(a.name, p_query) DESC,
    a.last_search_refreshed_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- 2. Fix cafe_announcements RLS policies
-- Only service_role (server) should INSERT/UPDATE announcements
DROP POLICY IF EXISTS "Auth users can insert cafe_announcements" ON cafe_announcements;
DROP POLICY IF EXISTS "Auth users can update cafe_announcements" ON cafe_announcements;

-- No INSERT/UPDATE policies needed - service_role bypasses RLS
-- Public SELECT is fine (already exists)

-- 3. Fix search_refresh_log RLS policies
-- Only service_role (server) should INSERT/UPDATE search logs
DROP POLICY IF EXISTS "Auth users can insert search_refresh_log" ON search_refresh_log;
DROP POLICY IF EXISTS "Auth users can update search_refresh_log" ON search_refresh_log;

-- No INSERT/UPDATE policies needed - service_role bypasses RLS
-- Public SELECT is fine for cache status checking
