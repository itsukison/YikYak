-- Migration: Fix post anonymity bug - use post's is_anonymous instead of user's
-- Date: 2026-01-03
-- Description: Fixes get_feed_v2 and create_post to return post-level is_anonymous
--              instead of user-level is_anonymous preference.
--              Also conditionally hides avatar URLs for anonymous posts (security fix).

-- Part 1: Fix get_feed_v2 function
DROP FUNCTION IF EXISTS get_feed_v2(double precision, double precision, double precision, text, text, integer, bigint, double precision);

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
  author_avatar_url text,
  repost_of bigint,
  reposted_post_content text,
  reposted_post_author text,
  reposted_post_is_anonymous boolean,
  reposted_post_created_at timestamp with time zone,
  reposted_post_author_avatar_url text,
  distance_meters double precision,
  photos jsonb,
  status text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
  effective_sort text;
  effective_time_filter text;
  cursor_timestamp TIMESTAMPTZ;
  user_location GEOGRAPHY;
BEGIN
  -- Normalize inputs
  effective_sort := lower(sort_by);
  effective_time_filter := lower(time_filter);

  -- Handle Time Filter (only for 'popular')
  IF effective_sort = 'popular' THEN
    CASE effective_time_filter
      WHEN 'day' THEN cutoff_date := NOW() - INTERVAL '1 day';
      WHEN 'week' THEN cutoff_date := NOW() - INTERVAL '7 days';
      WHEN 'month' THEN cutoff_date := NOW() - INTERVAL '30 days';
      ELSE cutoff_date := NOW() - INTERVAL '7 days';
    END CASE;
  ELSE
    cutoff_date := NULL;
  END IF;

  -- Handle Cursor for 'new' feed
  IF cursor_value IS NOT NULL AND effective_sort != 'popular' THEN
    cursor_timestamp := to_timestamp(cursor_value / 1000.0);
  END IF;

  -- Create user location point
  user_location := ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography;

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
    COALESCE(u.nickname, u.username, 'User_' || substring(u.id::text, 1, 8)) as author_nickname,
    p.is_anonymous,  -- FIX: Use post's is_anonymous, not user's
    u.username as author_username,
    CASE WHEN p.is_anonymous THEN NULL ELSE u.avatar_url END as author_avatar_url,  -- FIX: Conditionally hide avatar for security
    p.repost_of,
    rp.content as reposted_post_content,
    COALESCE(ru.nickname, ru.username, 'User_' || substring(ru.id::text, 1, 8)) as reposted_post_author,
    rp.is_anonymous as reposted_post_is_anonymous,  -- FIX: Use repost's is_anonymous, not user's
    rp.created_at as reposted_post_created_at,
    CASE WHEN rp.is_anonymous THEN NULL ELSE ru.avatar_url END as reposted_post_author_avatar_url,  -- FIX: Conditionally hide avatar for security
    ST_Distance(p.location, user_location) as distance_meters,
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
    p.deleted_at IS NULL
    AND p.status = 'active'
    -- Filter out posts from blocked users
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE b.blocker_id = auth.uid()
        AND b.blocked_id = p.user_id
    )
    -- Also filter out reposts where the original poster is blocked
    AND (p.repost_of IS NULL OR NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE b.blocker_id = auth.uid()
        AND b.blocked_id = rp.user_id
    ))
    AND (
      radius_meters < 0
      OR ST_DWithin(p.location, user_location, radius_meters)
    )
    AND (cutoff_date IS NULL OR p.created_at >= cutoff_date)
    AND (
      cursor_post_id IS NULL OR
      (
        (effective_sort = 'popular' AND (p.score, p.id) < (cursor_value::integer, cursor_post_id)) OR
        (effective_sort != 'popular' AND (p.created_at, p.id) < (cursor_timestamp, cursor_post_id))
      )
    )
  ORDER BY
    CASE WHEN effective_sort = 'popular' THEN p.score END DESC NULLS LAST,
    p.created_at DESC,
    p.id DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION get_feed_v2 IS 'Get feed posts with correct post-level is_anonymous (fixed bug where user is_anonymous was returned)';

-- Part 2: Fix create_post function return value
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
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_post_id bigint;
  v_result json;
BEGIN
  -- 1. Check Rate Limit (e.g., 5 posts per 10 minutes)
  PERFORM check_rate_limit(auth.uid(), 'post', 5, 10);

  -- 2. Insert Post with status and location fields
  INSERT INTO posts (user_id, content, latitude, longitude, location_name, repost_of, is_anonymous, status, location)
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
        'is_anonymous', p.is_anonymous  -- FIX: Return post's is_anonymous, not user's
      ) as sender
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = v_post_id
  ) t;

  RETURN v_result;
END;
$function$;

COMMENT ON FUNCTION create_post IS 'Create post with correct post-level is_anonymous in response (fixed bug)';
