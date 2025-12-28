-- Migration: Add avatar URLs to feed function
-- Date: 2025-12-29
-- Description: Updates get_feed_v2 to return avatar URLs for posts and reposts

-- Drop existing function
DROP FUNCTION IF EXISTS get_feed_v2(double precision, double precision, double precision, text, text, integer, bigint, double precision);

-- Recreate with avatar_url fields
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
    u.is_anonymous,
    u.username as author_username,
    u.avatar_url as author_avatar_url,
    p.repost_of,
    rp.content as reposted_post_content,
    COALESCE(ru.nickname, ru.username, 'User_' || substring(ru.id::text, 1, 8)) as reposted_post_author,
    ru.is_anonymous as reposted_post_is_anonymous,
    rp.created_at as reposted_post_created_at,
    ru.avatar_url as reposted_post_author_avatar_url,
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
