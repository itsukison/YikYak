-- Migration: Add unblock user RPC function
-- Date: 2025-12-31
-- Description: Adds function to unblock a user

CREATE OR REPLACE FUNCTION public.unblock_user(
  blocked_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete the block record
  DELETE FROM public.blocks
  WHERE blocker_id = auth.uid()
    AND blocked_id = blocked_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.unblock_user(uuid) TO authenticated;

COMMENT ON FUNCTION public.unblock_user IS 'Allows a user to unblock another user';
