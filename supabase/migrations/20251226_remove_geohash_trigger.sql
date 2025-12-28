-- Remove geohash trigger and function
-- Date: 2025-12-26
-- Applied via Supabase MCP
-- 
-- Reason: We removed geohash_6 column and real-time subscriptions,
-- but forgot to remove the trigger that populates it.
-- This was causing post creation to fail with:
-- "record 'new' has no field 'geohash_6'"

-- Drop the trigger
DROP TRIGGER IF EXISTS posts_set_geohash ON posts;

-- Drop the function
DROP FUNCTION IF EXISTS update_post_geohash();


