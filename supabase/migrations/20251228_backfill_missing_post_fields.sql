-- Migration: Backfill missing status and location fields
-- Date: 2025-12-28
-- Description: Fixes posts that are missing status='active' and location geography,
--              which causes them to be filtered out by get_feed_v2 queries.

-- ============================================
-- STEP 1: Backfill missing status field
-- ============================================
UPDATE posts
SET status = 'active'
WHERE status IS NULL;

-- ============================================
-- STEP 2: Backfill missing location geography field
-- ============================================
UPDATE posts
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

-- ============================================
-- STEP 3: Add database constraints to prevent future issues
-- ============================================

-- Make status non-nullable with default 'active'
ALTER TABLE posts
ALTER COLUMN status SET DEFAULT 'active';

-- Only set NOT NULL after backfilling existing records
ALTER TABLE posts
ALTER COLUMN status SET NOT NULL;

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
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES (commented out, for manual testing)
-- ============================================

-- Check if all posts now have status and location
-- SELECT
--   COUNT(*) as total_posts,
--   COUNT(CASE WHEN status IS NULL THEN 1 END) as missing_status,
--   COUNT(CASE WHEN location IS NULL THEN 1 END) as missing_location,
--   COUNT(CASE WHEN status = 'active' THEN 1 END) as active_posts
-- FROM posts;
