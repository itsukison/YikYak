-- Update get_posts_within_radius function to support time filtering
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
    calculate_distance(user_lat, user_lon, p.latitude, p.longitude) as distance,
    u.nickname as author_nickname,
    u.is_anonymous
  FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= radius_meters
    AND (cutoff_date IS NULL OR p.created_at >= cutoff_date)
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
