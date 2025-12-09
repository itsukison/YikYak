import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

/**
 * Create a new comment
 */
export function useCreateCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, userId, content }) => {
            const { data, error } = await supabase
                .from("comments")
                .insert({
                    post_id: postId,
                    user_id: userId,
                    content: content.trim(),
                })
                .select(
                    `
          *,
          author:users!comments_user_id_fkey(id, nickname, is_anonymous)
        `
                )
                .single();

            if (error) throw error;

            // Transform to include display name
            return {
                ...data,
                author_nickname: data.author.is_anonymous
                    ? "Anonymous"
                    : data.author.nickname || "User",
            };
        },
        onSuccess: (data, variables) => {
            // Invalidate comments query to refetch
            queryClient.invalidateQueries(["comments", variables.postId]);
            // Invalidate posts query to update comment count
            queryClient.invalidateQueries(["posts"]);
        },
    });
}

/**
 * Vote on a comment (upvote/downvote)
 */
export function useVoteCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, commentId, voteType, postId }) => {
            // If voteType is 0 or null, delete the vote
            if (voteType === 0 || voteType === null) {
                const { error } = await supabase
                    .from("votes_comments")
                    .delete()
                    .eq("user_id", userId)
                    .eq("comment_id", commentId);

                if (error) throw error;

                // Recalculate comment score after deletion
                const { data: votes } = await supabase
                    .from("votes_comments")
                    .select("vote_type")
                    .eq("comment_id", commentId);

                const newScore =
                    votes?.reduce((sum, vote) => sum + vote.vote_type, 0) || 0;

                await supabase
                    .from("comments")
                    .update({ score: newScore })
                    .eq("id", commentId);

                return null;
            }

            // Otherwise, upsert the vote
            const { error } = await supabase.from("votes_comments").upsert(
                {
                    user_id: userId,
                    comment_id: commentId,
                    vote_type: voteType,
                },
                {
                    onConflict: "user_id,comment_id",
                }
            );

            if (error) throw error;

            // Recalculate comment score after upsert
            const { data: votes } = await supabase
                .from("votes_comments")
                .select("vote_type")
                .eq("comment_id", commentId);

            const newScore =
                votes?.reduce((sum, vote) => sum + vote.vote_type, 0) || 0;

            await supabase
                .from("comments")
                .update({ score: newScore })
                .eq("id", commentId);

            return voteType;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["comments", variables.postId]);
            queryClient.invalidateQueries(["comment-votes", variables.postId]);
        },
    });
}

/**
 * Delete a comment
 */
export function useDeleteCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ commentId, postId }) => {
            const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["comments", variables.postId]);
            queryClient.invalidateQueries(["posts"]);
        },
    });
}
