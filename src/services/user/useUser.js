import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

/**
 * Helper to check if a string is a valid UUID
 */
function isUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Search users by username or user ID
 */
export function useUserSearchQuery(searchTerm, currentUserId) {
    return useQuery({
        queryKey: ["user-search", searchTerm, currentUserId],
        queryFn: async () => {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return [];
            }

            const trimmedTerm = searchTerm.trim();

            // Search by exact user ID if it's a UUID
            if (isUUID(trimmedTerm)) {
                const { data, error } = await supabase
                    .from("users")
                    .select("id, username, nickname, bio, is_anonymous, school_name, avatar_url")
                    .eq("id", trimmedTerm)
                    .neq("id", currentUserId)
                    .single();

                if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
                return data ? [data] : [];
            }

            // Search by username (partial match, case-insensitive)
            const { data, error } = await supabase
                .from("users")
                .select("id, username, nickname, bio, is_anonymous, school_name, avatar_url")
                .ilike("username", `%${trimmedTerm}%`)
                .neq("id", currentUserId)
                .limit(20);

            if (error) throw error;
            return data || [];
        },
        enabled: !!searchTerm && searchTerm.trim().length >= 2 && !!currentUserId,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Get a single user by ID
 */
export function useUserByIdQuery(userId) {
    return useQuery({
        queryKey: ["user-by-id", userId],
        queryFn: async () => {
            if (!userId) throw new Error("User ID required");

            const { data, error } = await supabase
                .from("users")
                .select("id, username, nickname, bio, is_anonymous, school_name, avatar_url")
                .eq("id", userId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });
}

/**
 * Get user profile by ID (Full profile)
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
          author:users!posts_user_id_fkey(id, nickname, is_anonymous, avatar_url)
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
                author_avatar_url: post.author.is_anonymous
                    ? null
                    : post.author.avatar_url || null,
            }));
        },
        enabled: !!userId,
    });
}

/**
 * Fetch profile stats (post count, follower count, following count)
 */
export function useProfileStatsQuery(userId) {
    return useQuery({
        queryKey: ['profile-stats', userId],
        queryFn: async () => {
            // Fetch post count
            const { count: postCount, error: postError } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (postError) throw postError;

            // Fetch follower count
            const { count: followerCount, error: followerError } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', userId);

            if (followerError) throw followerError;

            // Fetch following count
            const { count: followingCount, error: followingError } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', userId);

            if (followingError) throw followingError;

            // Fetch upvote count (Karma) using RPC
            const { data: upvoteCount, error: upvoteError } = await supabase
                .rpc('get_user_total_score', { target_user_id: userId });

            if (upvoteError) {
                console.error('Error fetching user karma:', upvoteError);
                // Don't throw, just default to 0 to keep other stats working
            }

            return {
                postCount: postCount || 0,
                followerCount: followerCount || 0,
                followingCount: followingCount || 0,
                upvoteCount: upvoteCount || 0,
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
