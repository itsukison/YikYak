-- Add is_anonymous column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Enable RLS for the new column (implicitly covered by existing policies usually, but good to be aware)

-- Update create_post function to accept and store is_anonymous
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

  -- 2. Insert Post
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
        'is_anonymous', u.is_anonymous
      ) as sender
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = v_post_id
  ) t;

  RETURN v_result;
END;
$function$;
