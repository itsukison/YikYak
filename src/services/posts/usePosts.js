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
    staleTime: 1000 * 60 * 5, // 5 minutes (increased from 1 minute)
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection time
    // Keep previous data during fetches for smooth UX
    placeholderData: (previousData) => previousData,
  });
}

// Fetch single post with photos
export function usePostQuery(postId) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      // Fetch post
      const { data: post, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          users!posts_user_id_fkey (
            nickname,
            is_anonymous
          ),
          reposted_post:posts!posts_repost_of_fkey (
            id,
            content,
            created_at,
            user_id,
            users!posts_user_id_fkey (
              nickname,
              is_anonymous
            )
          )
        `
        )
        .eq("id", postId)
        .single();

      if (error) throw error;

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
    enabled: !!postId,
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
