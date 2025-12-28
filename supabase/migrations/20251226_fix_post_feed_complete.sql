-- Migration: Fix post feed system completely
-- Date: 2025-12-26
-- Applied via Supabase MCP
-- 
-- Changes:
-- 1. Removed geohash_6 column (using location geography instead)
-- 2. Cleared all mock data
-- 3. Created handle_post_vote function with vote removal support
-- 4. Added vote count triggers
-- 5. Added performance indexes
-- 6. Added comment count triggers

-- ============================================
-- STEP 1: Clean up unnecessary columns
-- ============================================
ALTER TABLE posts DROP COLUMN IF EXISTS geohash_6;

-- ============================================
-- STEP 2: Ensure all posts have location geography
-- ============================================
UPDATE posts 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography 
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- STEP 3: Delete all mock data
-- ============================================
DELETE FROM votes_comments;
DELETE FROM comments;
DELETE FROM votes_posts;
DELETE FROM post_photos;
DELETE FROM reports WHERE reported_post_id IS NOT NULL;
DELETE FROM notifications WHERE post_id IS NOT NULL OR comment_id IS NOT NULL;
DELETE FROM posts;

ALTER SEQUENCE posts_id_seq RESTART WITH 1;
ALTER SEQUENCE comments_id_seq RESTART WITH 1;
ALTER SEQUENCE post_photos_id_seq RESTART WITH 1;

-- ============================================
-- STEP 4: Update handle_post_vote function
-- ============================================

-- Drop all versions of handle_post_vote
DROP FUNCTION IF EXISTS handle_post_vote(bigint, uuid, integer);
DROP FUNCTION IF EXISTS handle_post_vote(bigint, uuid, smallint);

-- Create new version that handles 0 value (remove vote)
CREATE OR REPLACE FUNCTION handle_post_vote(
  p_post_id BIGINT,
  p_user_id UUID,
  p_vote_value INTEGER  -- -1 (downvote), 0 (remove), 1 (upvote)
)
RETURNS void AS $$
BEGIN
  IF p_vote_value = 0 THEN
    -- Remove vote
    DELETE FROM votes_posts 
    WHERE user_id = p_user_id AND post_id = p_post_id;
  ELSE
    -- Upsert vote (-1 or 1)
    INSERT INTO votes_posts (user_id, post_id, vote_type)
    VALUES (p_user_id, p_post_id, p_vote_value::SMALLINT)
    ON CONFLICT (user_id, post_id)
    DO UPDATE SET vote_type = EXCLUDED.vote_type;
  END IF;
  
  -- Recalculate post score
  UPDATE posts
  SET score = COALESCE((
    SELECT SUM(vote_type)
    FROM votes_posts
    WHERE post_id = p_post_id
  ), 0)
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION handle_post_vote TO authenticated;

-- ============================================
-- STEP 5: Auto-update score trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_post_score_on_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET score = COALESCE((
      SELECT SUM(vote_type)
      FROM votes_posts
      WHERE post_id = OLD.post_id
    ), 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  ELSE
    UPDATE posts
    SET score = COALESCE((
      SELECT SUM(vote_type)
      FROM votes_posts
      WHERE post_id = NEW.post_id
    ), 0)
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_score ON votes_posts;

CREATE TRIGGER trigger_update_post_score
AFTER INSERT OR UPDATE OR DELETE ON votes_posts
FOR EACH ROW
EXECUTE FUNCTION update_post_score_on_vote();

-- ============================================
-- STEP 6: Ensure unique constraint
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'votes_posts_user_post_unique' 
  ) THEN
    ALTER TABLE votes_posts 
    ADD CONSTRAINT votes_posts_user_post_unique 
    UNIQUE (user_id, post_id);
  END IF;
END $$;

-- ============================================
-- STEP 7: Performance indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_post_photos_post_id_order 
ON post_photos(post_id, photo_order);

CREATE INDEX IF NOT EXISTS idx_votes_posts_user_id 
ON votes_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_votes_posts_post_id 
ON votes_posts(post_id);

CREATE INDEX IF NOT EXISTS idx_posts_score_created_id 
ON posts(score DESC, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_posts_created_id 
ON posts(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_posts_location_gist 
ON posts USING GIST(location);

-- ============================================
-- STEP 8: Comment count trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comment_count = (
      SELECT COUNT(*)
      FROM comments
      WHERE post_id = OLD.post_id AND deleted_at IS NULL
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  ELSE
    UPDATE posts
    SET comment_count = (
      SELECT COUNT(*)
      FROM comments
      WHERE post_id = NEW.post_id AND deleted_at IS NULL
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;

CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_count();

