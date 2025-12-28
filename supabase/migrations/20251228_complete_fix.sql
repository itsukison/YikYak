-- Complete Fix: Enable PostGIS and Update create_post function
-- Date: 2025-12-28
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Enable PostGIS Extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS is enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS extension failed to enable';
  END IF;
  RAISE NOTICE 'PostGIS is enabled successfully';
END $$;

-- ============================================
-- STEP 2: Backfill Existing Posts
-- ============================================

-- Backfill missing status field
UPDATE posts
SET status = 'active'
WHERE status IS NULL;

-- Backfill missing location geography field
UPDATE posts
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

-- Make status non-nullable with default 'active'
ALTER TABLE posts
ALTER COLUMN status SET DEFAULT 'active';

-- Only set NOT NULL after backfilling
DO $$
BEGIN
  -- Check if any NULL status remain
  IF NOT EXISTS (SELECT 1 FROM posts WHERE status IS NULL) THEN
    ALTER TABLE posts ALTER COLUMN status SET NOT NULL;
    RAISE NOTICE 'Status column set to NOT NULL';
  ELSE
    RAISE NOTICE 'Some posts still have NULL status, skipping NOT NULL constraint';
  END IF;
END $$;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_status_check'
  ) THEN
    ALTER TABLE posts
    ADD CONSTRAINT posts_status_check
    CHECK (status IN ('active', 'deleted', 'flagged'));
    RAISE NOTICE 'Status check constraint added';
  END IF;
END $$;

-- ============================================
-- STEP 3: Update create_post Function
-- ============================================

CREATE OR REPLACE FUNCTION public.create_post(
  p_content text,
  p_latitude double precision,
  p_longitude double precision,
  p_location_name text,
  p_repost_of bigint DEFAULT NULL::bigint,
  p_is_anonymous boolean DEFAULT FALSE
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_post_id bigint;
  v_result json;
BEGIN
  -- 1. Check Rate Limit (e.g., 5 posts per 10 minutes)
  PERFORM check_rate_limit(auth.uid(), 'post', 5, 10);

  -- 2. Insert Post with status and location fields
  INSERT INTO posts (
    user_id,
    content,
    latitude,
    longitude,
    location_name,
    repost_of,
    is_anonymous,
    status,
    location
  )
  VALUES (
    auth.uid(),
    p_content,
    p_latitude,
    p_longitude,
    p_location_name,
    p_repost_of,
    p_is_anonymous,
    'active',
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
  )
  RETURNING id INTO v_post_id;

  -- 3. Return the created post with sender info
  SELECT row_to_json(t) INTO v_result
  FROM (
    SELECT
      p.*,
      json_build_object(
        'id', u.id,
        'nickname', u.nickname,
        'is_anonymous', u.is_anonymous
      ) as sender
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = v_post_id
  ) t;

  RETURN v_result;
END;
$function$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check PostGIS version
SELECT PostGIS_version() as postgis_version;

-- Check posts table structure
SELECT
  COUNT(*) as total_posts,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as missing_status,
  COUNT(CASE WHEN location IS NULL THEN 1 END) as missing_location,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_posts
FROM posts;

-- Verify create_post function exists
SELECT
  p.proname as function_name,
  'Function updated successfully' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'create_post';

-- Final success message
SELECT '✅ All fixes applied successfully!' as result;
