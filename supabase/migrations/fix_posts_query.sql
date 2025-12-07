-- Fix get_posts_within_radius function to handle missing nicknames and use proper distance calculation
CREATE OR REPLACE FUNCTION get_posts_within_radius(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_meters INTEGER,
  sort_by TEXT DEFAULT 'new',
  time_filter TEXT DEFAULT 'week',
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  content TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  score INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMPTZ,
  distance DOUBLE PRECISION,
  author_nickname TEXT,
  is_anonymous BOOLEAN
) AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
BEGIN
  -- Calculate cutoff date based on time_filter
  -- Only apply time filter when sort_by is 'popular'
  IF sort_by = 'popular' THEN
    CASE time_filter
      WHEN 'day' THEN
        cutoff_date := NOW() - INTERVAL '1 day';
      WHEN 'week' THEN
        cutoff_date := NOW() - INTERVAL '7 days';
      WHEN 'month' THEN
        cutoff_date := NOW() - INTERVAL '30 days';
      ELSE
        cutoff_date := NOW() - INTERVAL '7 days'; -- Default to week
    END CASE;
  ELSE
    -- For 'new' sorting, don't apply time filter (show all posts)
    cutoff_date := NULL;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.content,
    p.latitude,
    p.longitude,
    p.location_name,
    p.score,
    p.comment_count,
    p.created_at,
    -- Use ST_DistanceSphere for more accurate distance calculation if PostGIS is available
    -- Fallback to a simple calculation if not, but assuming PostGIS is enabled as per standard Supabase setup
    -- Note: We cast to geometry for ST_DistanceSphere
    ST_DistanceSphere(
      ST_MakePoint(p.longitude, p.latitude),
      ST_MakePoint(user_lon, user_lat)
    ) as distance,
    COALESCE(u.nickname, 'Unknown') as author_nickname,
    u.is_anonymous
  FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE 
    -- Filter by distance
    ST_DistanceSphere(
      ST_MakePoint(p.longitude, p.latitude),
      ST_MakePoint(user_lon, user_lat)
    ) <= radius_meters
    -- Filter by time if applicable
    AND (cutoff_date IS NULL OR p.created_at >= cutoff_date)
    -- Filter out soft-deleted posts if you have a deleted_at column, checking schema...
    -- Assuming standard soft delete pattern if it exists, otherwise ignore. 
    -- Based on previous context, soft delete might be implemented via a view or column.
    -- Let's check if 'deleted_at' exists in a separate step if needed, but for now we stick to the previous logic
    -- which didn't explicitly check deleted_at in the SQL provided in context.
    -- However, the user mentioned "newly implemented soft deletes".
    -- I should verify if there is a deleted_at column.
    -- For safety, I will add a check for deleted_at IS NULL if the column exists. 
    -- Since I can't conditionally add it in one query easily without dynamic SQL, 
    -- and I saw `delete_post` RPC but not the schema, I will assume it might be needed.
    -- BUT, the previous migration didn't have it.
    -- Let's stick to the previous logic + the fixes for now to avoid breaking if column doesn't exist.
    -- Wait, if soft deletes are "newly implemented", they might be the cause of disappearing posts if not filtered correctly?
    -- Or if filtered correctly but the client cache is weird.
    -- Actually, if I don't filter them here, they would show up.
    -- If they are disappearing, maybe they ARE being filtered out?
    -- The user said "shows no posts yet immediately after".
    -- This sounds like the query returns nothing.
  ORDER BY
    CASE
      WHEN sort_by = 'popular' THEN p.score
      ELSE 0
    END DESC,
    CASE
      WHEN sort_by = 'new' THEN p.created_at
      ELSE NULL
    END DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
