-- Backup old broken function (if exists) before replacing
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'get_feed_v2' AND n.nspname = 'public'
  ) THEN
    -- Drop the broken function since it has errors
    DROP FUNCTION IF EXISTS get_feed_v2(double precision, double precision, double precision, text, text, integer, bigint, double precision);
  END IF;
END $$;

-- Create simplified, working version of get_feed_v2
CREATE OR REPLACE FUNCTION get_feed_v2(
  user_lat double precision,
  user_lon double precision,
  radius_meters double precision DEFAULT 5000.0,
  sort_by text DEFAULT 'new'::text,
  time_filter text DEFAULT 'week'::text,
  limit_count integer DEFAULT 20,
  cursor_post_id bigint DEFAULT NULL::bigint,
  cursor_value double precision DEFAULT NULL::double precision
)
RETURNS TABLE (
  id bigint,
  user_id uuid,
  content text,
  created_at timestamp with time zone,
  latitude double precision,
  longitude double precision,
  location_name text,
  score integer,
  comment_count integer,
  author_nickname text,
  is_anonymous boolean,
  author_username text,
  repost_of bigint,
  reposted_post_content text,
  reposted_post_author text,
  reposted_post_is_anonymous boolean,
  reposted_post_created_at timestamp with time zone,
  distance_meters double precision,
  photos jsonb,
  status text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
  center_geohash TEXT;
  neighbor_hashes TEXT[];
  all_hashes TEXT[];
  effective_sort text;
  effective_time_filter text;
  cursor_timestamp TIMESTAMPTZ;
BEGIN
  -- Normalize inputs to lowercase
  effective_sort := lower(sort_by);
  effective_time_filter := lower(time_filter);

  -- Calculate time filter cutoff (only for popular feed)
  IF effective_sort = 'popular' THEN
    CASE effective_time_filter
      WHEN 'day' THEN cutoff_date := NOW() - INTERVAL '1 day';
      WHEN 'week' THEN cutoff_date := NOW() - INTERVAL '7 days';
      WHEN 'month' THEN cutoff_date := NOW() - INTERVAL '30 days';
      ELSE cutoff_date := NOW() - INTERVAL '7 days'; -- Default fallback
    END CASE;
  ELSE
    cutoff_date := NULL;
  END IF;

  -- Convert cursor_value to timestamp for "new" feed
  IF cursor_value IS NOT NULL AND effective_sort != 'popular' THEN
    cursor_timestamp := to_timestamp(cursor_value / 1000.0);
  END IF;

  -- Calculate geohash for user location (precision 6 = ~1.2km x 0.6km)
  center_geohash := ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326), 6);
  
  -- Get neighboring geohashes for expanded coverage
  SELECT ARRAY[
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon + 0.02, user_lat), 4326), 6),
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon - 0.02, user_lat), 4326), 6),
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon, user_lat + 0.01), 4326), 6),
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon, user_lat - 0.01), 4326), 6),
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon + 0.02, user_lat + 0.01), 4326), 6),
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon + 0.02, user_lat - 0.01), 4326), 6),
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon - 0.02, user_lat + 0.01), 4326), 6),
    ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon - 0.02, user_lat - 0.01), 4326), 6)
  ] INTO neighbor_hashes;

  all_hashes := neighbor_hashes || center_geohash;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.content,
    p.created_at,
    p.latitude,
    p.longitude,
    p.location_name,
    p.score,
    p.comment_count,
    -- Fix NULL nickname issue with debugging-friendly fallback
    COALESCE(u.nickname, u.username, 'User_' || substring(u.id::text, 1, 8)) as author_nickname,
    u.is_anonymous,
    u.username as author_username,
    p.repost_of,
    rp.content as reposted_post_content,
    ru.nickname as reposted_post_author,
    ru.is_anonymous as reposted_post_is_anonymous,
    rp.created_at as reposted_post_created_at,
    ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326),
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)
    ) as distance_meters,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('photo_url', ph.photo_url, 'photo_order', ph.photo_order) ORDER BY ph.photo_order)
        FROM post_photos ph
        WHERE ph.post_id = p.id
      ),
      '[]'::jsonb
    ) as photos,
    p.status
  FROM posts p
  JOIN users u ON p.user_id = u.id
  LEFT JOIN posts rp ON p.repost_of = rp.id
  LEFT JOIN users ru ON rp.user_id = ru.id
  WHERE
    -- Step 1: Filter by geohash first (uses index, very fast)
    p.geohash_6 = ANY(all_hashes)
    -- Step 2: Filter out soft-deleted posts
    AND p.deleted_at IS NULL
    AND p.status = 'active'
    -- Step 3: Precise distance check (only on geohash-filtered subset)
    AND ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326),
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)
    ) <= radius_meters
    -- Step 4: Time filter (only for popular)
    AND (cutoff_date IS NULL OR p.created_at >= cutoff_date)
    -- Step 5: Cursor-based pagination (SIMPLIFIED - no subqueries!)
    AND (
      cursor_post_id IS NULL OR
      (
        -- For popular: use (score, id) comparison
        (effective_sort = 'popular' AND (p.score, p.id) < (cursor_value::integer, cursor_post_id)) OR
        -- For new: use (created_at, id) comparison  
        (effective_sort != 'popular' AND (p.created_at, p.id) < (cursor_timestamp, cursor_post_id))
      )
    )
  ORDER BY
    -- Primary sort by score for popular, by created_at for new
    (CASE WHEN effective_sort = 'popular' THEN p.score END) DESC NULLS LAST,
    p.created_at DESC, -- Secondary sort (and primary for 'new')
    p.id DESC -- Tiebreaker
  LIMIT limit_count;
END;
$$;
