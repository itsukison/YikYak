import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

/**
 * Check if current user is following a target user
 */
export function useFollowStatusQuery(userId, targetUserId) {
  return useQuery({
    queryKey: ["follow-status", userId, targetUserId],
    queryFn: async () => {
      if (!userId || !targetUserId) return false;

      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", userId)
        .eq("following_id", targetUserId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return !!data;
    },
    enabled: !!userId && !!targetUserId && userId !== targetUserId,
  });
}

/**
 * Get list of users that current user is following
 */
export function useFollowingQuery(userId) {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("follows")
        .select(`
          following_id,
          following:users!follows_following_id_fkey(id, nickname, is_anonymous)
        `)
        .eq("follower_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Get list of users following the current user
 */
export function useFollowersQuery(userId) {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("follows")
        .select(`
          follower_id,
          follower:users!follows_follower_id_fkey(id, nickname, is_anonymous)
        `)
        .eq("following_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Follow a user
 */
export function useFollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followerId, followingId }) => {
      const { error } = await supabase.from("follows").insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate follow status
      queryClient.invalidateQueries([
        "follow-status",
        variables.followerId,
        variables.followingId,
      ]);
      // Invalidate following list
      queryClient.invalidateQueries(["following", variables.followerId]);
      // Invalidate followers list
      queryClient.invalidateQueries(["followers", variables.followingId]);
      // Invalidate profile stats
      queryClient.invalidateQueries(["profile-stats"]);
    },
  });
}

/**
 * Unfollow a user
 */
export function useUnfollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followerId, followingId }) => {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate follow status
      queryClient.invalidateQueries([
        "follow-status",
        variables.followerId,
        variables.followingId,
      ]);
      // Invalidate following list
      queryClient.invalidateQueries(["following", variables.followerId]);
      // Invalidate followers list
      queryClient.invalidateQueries(["followers", variables.followingId]);
      // Invalidate profile stats
      queryClient.invalidateQueries(["profile-stats"]);
    },
  });
}

/**
 * Get posts by a specific user
 */
export function useUserPostsQuery(userId) {
  return useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:users!posts_user_id_fkey(id, nickname, is_anonymous)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return data.map((post) => ({
        ...post,
        author_nickname: post.author.is_anonymous
          ? "Anonymous"
          : post.author.nickname || "User",
      }));
    },
    enabled: !!userId,
  });
}

/**
 * Get user profile by ID
 */
export function useUserProfileQuery(userId) {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
