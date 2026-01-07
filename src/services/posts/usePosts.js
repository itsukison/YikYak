import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

// Fetch posts within radius with infinite scroll support
export function usePostsQuery(
  latitude,
  longitude,
  radius = 5000,
  sortBy = "new",
  timeFilter = "week",
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: ["posts", latitude, longitude, radius, sortBy, timeFilter],
    queryFn: async ({ pageParam }) => {
      // Use the new optimized RPC v2 with cursor-based pagination
      const { data, error } = await supabase.rpc("get_feed_v2", {
        user_lat: latitude,
        user_lon: longitude,
        radius_meters: radius,
        sort_by: sortBy,
        time_filter: timeFilter,
        limit_count: 20,
        cursor_post_id: pageParam?.cursorPostId || null,
        cursor_value: pageParam?.cursorValue || null,
      });

      if (error) throw error;

      // Return posts with pagination metadata
      return {
        posts: data || [],
        nextCursor:
          data && data.length === 20
            ? {
              cursorPostId: data[data.length - 1].id,
              cursorValue:
                sortBy === "popular"
                  ? data[data.length - 1].score
                  : new Date(data[data.length - 1].created_at).getTime(),
            }
            : undefined,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && latitude != null && longitude != null,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Fetch single post with photos
export function usePostQuery(postId, options = {}) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      // Fetch post with basic info (avoid nested self-referential join)
      const { data: post, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          users!posts_user_id_fkey (
            nickname,
            is_anonymous,
            avatar_url
          )
        `
        )
        .eq("id", postId)
        .single();

      if (error) throw error;

      // Fetch reposted post separately if this is a repost
      if (post.repost_of) {
        const { data: repostedPost, error: repostError } = await supabase
          .from("posts")
          .select(
            `
            id,
            content,
            created_at,
            user_id,
            is_anonymous,
            users!posts_user_id_fkey (
              nickname,
              is_anonymous,
              avatar_url
            )
          `
          )
          .eq("id", post.repost_of)
          .single();

        if (!repostError && repostedPost) {
          // Flatten the structure to match expected format
          post.reposted_post = repostedPost;
          post.reposted_post_content = repostedPost.content;
          post.reposted_post_author = repostedPost.users?.nickname;
          post.reposted_post_is_anonymous = repostedPost.is_anonymous;
          post.reposted_post_created_at = repostedPost.created_at;
          post.reposted_post_author_avatar_url = repostedPost.is_anonymous ? null : repostedPost.users?.avatar_url || null;
        }
      }

      // Fetch photos
      const { data: photos, error: photosError } = await supabase
        .from("post_photos")
        .select("*")
        .eq("post_id", postId)
        .order("photo_order", { ascending: true });

      if (!photosError && photos) {
        post.photos = photos;
      } else {
        post.photos = [];
      }

      return post;
    },
    enabled: options.enabled !== undefined ? options.enabled : !!postId,
  });
}

// Fetch user's votes with optimized caching
export function useUserVotesQuery(userId) {
  return useQuery({
    queryKey: ["user-votes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes_posts")
        .select("post_id, vote_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1000); // Limit to recent votes for performance

      if (error) throw error;

      // Convert to map for easy lookup
      const votesMap = {};
      data?.forEach((vote) => {
        // Map integer to string for UI
        let type = null;
        if (vote.vote_type === 1) type = "up";
        if (vote.vote_type === -1) type = "down";
        if (type) votesMap[vote.post_id] = type;
      });
      return votesMap;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
  });
}

// Helper to fetch full post details (for realtime updates)
// Returns data in the exact same shape as get_feed_v2
export async function fetchPostDetails(postId, userLatitude, userLongitude) {
  try {
    // 1. Fetch the post with author and simple fields
    // We also join repost data if needed
    const { data: post, error } = await supabase
      .from("posts")
      .select(`
        *,
        users!posts_user_id_fkey (
          nickname,
          username,
          is_anonymous,
          avatar_url
        ),
        repost:posts!posts_repost_of_fkey (
          id,
          content,
          created_at,
          user:users!posts_user_id_fkey (
            nickname,
            is_anonymous,
            avatar_url
          )
        )
      `)
      .eq("id", postId)
      .single();

    if (error) throw error;
    if (!post) return null;

    // 2. Fetch photos
    const { data: photos } = await supabase
      .from("post_photos")
      .select("photo_url, photo_order")
      .eq("post_id", postId)
      .order("photo_order", { ascending: true });

    // 3. Transform to Feed Format (matching get_feed_v2 output)
    const formattedPost = {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      created_at: post.created_at,
      latitude: post.latitude,
      longitude: post.longitude,
      location_name: post.location_name,
      score: post.score,
      comment_count: post.comment_count,

      // Author info
      author_nickname: post.users?.nickname || post.users?.username || "Unknown",
      is_anonymous: post.is_anonymous,
      author_username: post.users?.username,
      author_avatar_url: post.is_anonymous ? null : post.users?.avatar_url || null,

      // Repost info
      repost_of: post.repost_of,
      reposted_post_content: post.repost?.content,
      reposted_post_author: post.repost?.user?.nickname,
      reposted_post_is_anonymous: post.repost?.is_anonymous,
      reposted_post_created_at: post.repost?.created_at,
      reposted_post_author_avatar_url: post.repost?.is_anonymous ? null : post.repost?.user?.avatar_url || null,

      // Distance (if user location provided)
      distance_meters: (userLatitude && userLongitude && post.latitude && post.longitude)
        ? calculateDistance(userLatitude, userLongitude, post.latitude, post.longitude)
        : null,

      // Photos
      photos: photos || [],

      status: post.status
    };

    return formattedPost;

  } catch (err) {
    console.error("Error fetching post details:", err);
    return null;
  }
}

// Helper for distance (Haversine) - duplicated from realtime.js to keep this pure
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
