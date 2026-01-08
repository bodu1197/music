-- ============================================
-- Fix remaining multiple_permissive_policies for artists
-- Change "Service role manages artists" from FOR ALL to specific actions
-- ============================================

-- Drop the problematic ALL policy
DROP POLICY IF EXISTS "Service role manages artists" ON public.artists;

-- Create specific policies for INSERT, UPDATE, DELETE only (not SELECT)
CREATE POLICY "Service role inserts artists"
  ON public.artists FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role updates artists"
  ON public.artists FOR UPDATE
  USING ((select auth.role()) = 'service_role');

CREATE POLICY "Service role deletes artists"
  ON public.artists FOR DELETE
  USING ((select auth.role()) = 'service_role');
