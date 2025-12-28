-- Migration: Drop legacy feed functions to prevent accidental usage
-- Date: 2025-12-28
-- Purpose: Remove old get_feed_optimized functions that may not have proper filtering

-- Drop legacy get_feed_optimized functions (both versions)
DROP FUNCTION IF EXISTS get_feed_optimized(double precision, double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_feed_optimized(double precision, double precision, double precision, text, text, integer, integer, timestamp with time zone, bigint);

-- Verify only get_feed_v2 remains
DO $$
DECLARE
  remaining_funcs text;
BEGIN
  SELECT string_agg(proname || '(' || pg_get_function_arguments(oid) || ')', ', ')
  INTO remaining_funcs
  FROM pg_proc
  WHERE proname LIKE '%feed%'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  RAISE NOTICE 'Remaining feed functions: %', COALESCE(remaining_funcs, 'None');
END $$;
