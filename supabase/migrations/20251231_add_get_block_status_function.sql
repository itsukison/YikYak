-- Migration: Add get_block_status RPC function
-- Date: 2025-12-31
-- Description: Adds function to check if current user has blocked a target user

CREATE OR REPLACE FUNCTION public.get_block_status(
  target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  block_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.blocks
    WHERE blocker_id = auth.uid()
      AND blocked_id = target_user_id
  ) INTO block_exists;

  RETURN block_exists;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_block_status(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_block_status IS 'Returns true if current user has blocked the target user';
