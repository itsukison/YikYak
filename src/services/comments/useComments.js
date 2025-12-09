import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

/**
 * Fetch comments for a specific post
 */
export function useCommentsQuery(postId) {
    return useQuery({
        queryKey: ["comments", postId],
        queryFn: async () => {
            if (!postId) throw new Error("Post ID required");

            const { data, error } = await supabase
                .from("comments")
                .select(
                    `
          *,
          author:users!comments_user_id_fkey(id, nickname, is_anonymous)
        `
                )
                .eq("post_id", postId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Transform to include display name
            return data.map((comment) => ({
                ...comment,
                author_nickname: comment.author.is_anonymous
                    ? "Anonymous"
                    : comment.author.nickname || "User",
            }));
        },
        enabled: !!postId,
    });
}

/**
 * Fetch user's votes on comments for a post
 */
export function useCommentVotesQuery(postId, userId) {
    return useQuery({
        queryKey: ["comment-votes", postId, userId],
        queryFn: async () => {
            if (!postId || !userId) return {};

            const { data, error } = await supabase
                .from("votes_comments")
                .select("comment_id, vote_type")
                .eq("user_id", userId)
                .in(
                    "comment_id",
                    // Get all comment IDs for this post first
                    (
                        await supabase.from("comments").select("id").eq("post_id", postId)
                    ).data?.map((c) => c.id) || []
                );

            if (error) throw error;

            // Convert to map for easy lookup
            return data.reduce((acc, vote) => {
                acc[vote.comment_id] = vote.vote_type;
                return acc;
            }, {});
        },
        enabled: !!postId && !!userId,
    });
}
