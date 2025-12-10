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
BEGIN
  -- Calculate time filter cutoff
  IF sort_by = 'popular' THEN
    CASE time_filter
      WHEN 'day' THEN cutoff_date := NOW() - INTERVAL '1 day';
      WHEN 'week' THEN cutoff_date := NOW() - INTERVAL '7 days';
      WHEN 'month' THEN cutoff_date := NOW() - INTERVAL '30 days';
      ELSE cutoff_date := NOW() - INTERVAL '7 days';
    END CASE;
  ELSE
    cutoff_date := NULL;
  END IF;

  -- Calculate geohash for user location (precision 6 = ~1.2km x 0.6km)
  center_geohash := ST_GeoHash(ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326), 6);
  
  -- Get neighboring geohashes for expanded coverage. 
  -- Note: This assumes radius fits within the neighbor grid (~3km). 
  -- For larger radii, this optimization might exclude posts.
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
    u.nickname as author_nickname,
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
    -- Step 5: Cursor-based pagination
    AND (
      cursor_post_id IS NULL OR
      (
        CASE
          WHEN sort_by = 'popular' THEN
            -- For popular, key is (score, id). We are sorting DESC.
            (p.score < cursor_value OR (p.score = cursor_value AND p.id < cursor_post_id))
          ELSE
            -- For new, key is (created_at, id). We are sorting DESC.
            -- Using a subquery for cursor_post_id allows for precise continuation
            (p.created_at < (SELECT p2.created_at FROM posts p2 WHERE p2.id = cursor_post_id) OR 
             (p.created_at = (SELECT p2.created_at FROM posts p2 WHERE p2.id = cursor_post_id) AND p.id < cursor_post_id))
        END
      )
    )
  ORDER BY
    (CASE WHEN sort_by = 'popular' THEN p.score END) DESC NULLS LAST,
    -- Add secondary sort for Popular? No, rely on ID as tiebreaker.
    (CASE WHEN sort_by = 'new' THEN p.created_at END) DESC NULLS LAST,
    p.id DESC
  LIMIT limit_count;
END;
$$;
