-- Migration: Verify and add RLS policies for blocks table
-- Date: 2025-12-31
-- Description: Ensures proper RLS policies exist for blocks table

-- Enable RLS if not already enabled
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own blocks (who they blocked)
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocks;
CREATE POLICY "Users can view their own blocks"
  ON public.blocks
  FOR SELECT
  TO authenticated
  USING (blocker_id = auth.uid());

-- Policy: Users can insert their own blocks (via RPC only)
DROP POLICY IF EXISTS "Users can insert blocks" ON public.blocks;
CREATE POLICY "Users can insert blocks"
  ON public.blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = auth.uid());

-- Policy: Users can delete their own blocks (via RPC only)
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocks;
CREATE POLICY "Users can delete their own blocks"
  ON public.blocks
  FOR DELETE
  TO authenticated
  USING (blocker_id = auth.uid());

COMMENT ON TABLE public.blocks IS 'Stores user block relationships with RLS enabled';
