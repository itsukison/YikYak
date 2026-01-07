-- ============================================================
-- Rate Limiting Implementation
-- Created: 2026-01-04
-- Purpose: Prevent spam and abuse through rate limiting on user actions
-- ============================================================

-- Create rate_limits table to track user actions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint to ensure only valid action types
  CONSTRAINT rate_limits_action_type_check
    CHECK (action_type IN ('post', 'comment', 'vote', 'message', 'report', 'follow'))
);

-- Create index for fast lookups
-- Most queries will filter by user_id, action_type, and created_at
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_time
  ON public.rate_limits(user_id, action_type, created_at DESC);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role and SECURITY DEFINER functions can manage rate limits
-- Regular users should not be able to view or manipulate rate limit records
CREATE POLICY "rate_limits_service_role_only" ON public.rate_limits
  FOR ALL TO authenticated
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR current_user = 'postgres'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR current_user = 'postgres'
  );

-- ============================================================
-- Auto-cleanup function for old rate limit records
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limit records older than 1 hour
  -- This keeps the table size manageable
  DELETE FROM rate_limits
  WHERE created_at < now() - interval '1 hour';

  -- Log cleanup for monitoring
  RAISE NOTICE 'Cleaned up old rate limit records';
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO service_role;

-- ============================================================
-- Rate limiting check function
-- ============================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_action_type text,
  p_max_actions int,
  p_window_minutes int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_window_start timestamptz;
BEGIN
  -- Calculate the start of the time window
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;

  -- Count recent actions within the time window
  SELECT COUNT(*) INTO v_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > v_window_start;

  -- Check if limit exceeded
  IF v_count >= p_max_actions THEN
    -- Raise exception with user-friendly message
    RAISE EXCEPTION 'Rate limit exceeded: You can only perform % % action(s) per % minute(s). Please slow down.',
      p_max_actions,
      p_action_type,
      p_window_minutes
      USING ERRCODE = '42501'; -- insufficient_privilege error code
  END IF;

  -- Record this action
  INSERT INTO rate_limits (user_id, action_type, created_at)
  VALUES (p_user_id, p_action_type, now());

  -- Log for monitoring (optional)
  -- RAISE NOTICE 'Rate limit check passed: user=%, action=%, count=%/%',
  --   p_user_id, p_action_type, v_count + 1, p_max_actions;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit(uuid, text, int, int) TO authenticated;

-- ============================================================
-- Recommended Rate Limits (adjust based on your needs)
-- ============================================================

-- Posts: 5 posts per 10 minutes
-- Comments: 10 comments per 10 minutes
-- Votes: 30 votes per 1 minute (allows fast voting but prevents spam bots)
-- Messages: 30 messages per 1 minute
-- Reports: 5 reports per 60 minutes
-- Follows: 20 follows per 10 minutes

-- Usage in RPC functions:
-- PERFORM check_rate_limit(auth.uid(), 'post', 5, 10);
-- PERFORM check_rate_limit(auth.uid(), 'comment', 10, 10);
-- PERFORM check_rate_limit(auth.uid(), 'vote', 30, 1);
-- PERFORM check_rate_limit(auth.uid(), 'message', 30, 1);

-- ============================================================
-- Scheduled Cleanup (Optional - requires pg_cron extension)
-- ============================================================

-- If pg_cron is installed, you can schedule automatic cleanup:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule(
--   'cleanup-rate-limits',
--   '0 * * * *',  -- Every hour
--   'SELECT cleanup_old_rate_limits()'
-- );

-- ============================================================
-- Manual Cleanup (if pg_cron not available)
-- ============================================================

-- Run this periodically via cron or manually:
-- SELECT cleanup_old_rate_limits();

-- ============================================================
-- Testing
-- ============================================================

-- Test the rate limiting function:
--
-- 1. Test normal usage (should succeed):
-- SELECT check_rate_limit(auth.uid(), 'post', 5, 10);
--
-- 2. Test exceeding limit (should fail after 5 calls):
-- SELECT check_rate_limit(auth.uid(), 'post', 5, 10);
-- SELECT check_rate_limit(auth.uid(), 'post', 5, 10);
-- SELECT check_rate_limit(auth.uid(), 'post', 5, 10);
-- SELECT check_rate_limit(auth.uid(), 'post', 5, 10);
-- SELECT check_rate_limit(auth.uid(), 'post', 5, 10);
-- SELECT check_rate_limit(auth.uid(), 'post', 5, 10); -- This should fail
--
-- 3. View rate limit records:
-- SELECT * FROM rate_limits WHERE user_id = auth.uid() ORDER BY created_at DESC;

-- ============================================================
-- Monitoring Queries
-- ============================================================

-- Check which users are hitting rate limits most often:
-- SELECT
--   user_id,
--   action_type,
--   COUNT(*) as action_count,
--   MAX(created_at) as last_action
-- FROM rate_limits
-- WHERE created_at > now() - interval '1 hour'
-- GROUP BY user_id, action_type
-- HAVING COUNT(*) > 20
-- ORDER BY action_count DESC;

-- Check rate limit table size:
-- SELECT
--   COUNT(*) as total_records,
--   pg_size_pretty(pg_total_relation_size('rate_limits')) as table_size
-- FROM rate_limits;

-- ============================================================
