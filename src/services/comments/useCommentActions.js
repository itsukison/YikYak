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
 * Uses optimized RPC function that reduces 3 queries to 1
 */
export function useVoteCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, commentId, voteType, postId }) => {
            // Normalize voteType: null -> 0 for removal
            const normalizedVoteType = voteType === null || voteType === undefined ? 0 : voteType;

            // Use optimized RPC function (3 queries -> 1 RPC)
            const { data, error } = await supabase.rpc("handle_comment_vote", {
                p_comment_id: commentId,
                p_vote_type: normalizedVoteType,
            });

            if (error) throw error;

            return data;
        },
        onMutate: async ({ commentId, voteType, postId }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["comments", postId] });
            await queryClient.cancelQueries({ queryKey: ["comment-votes", postId] });

            // Snapshot the previous value
            const previousComments = queryClient.getQueryData(["comments", postId]);
            const previousVotes = queryClient.getQueryData(["comment-votes", postId]);

            // Optimistically update comment score
            queryClient.setQueryData(["comments", postId], (old) => {
                if (!old) return old;
                return old.map((comment) => {
                    if (comment.id === commentId) {
                        const currentVote = previousVotes?.[commentId] || 0;
                        const normalizedVoteType = voteType === null ? 0 : voteType;
                        const scoreChange = normalizedVoteType - currentVote;
                        return {
                            ...comment,
                            score: (comment.score || 0) + scoreChange,
                        };
                    }
                    return comment;
                });
            });

            // Optimistically update user votes
            queryClient.setQueryData(["comment-votes", postId], (old) => {
                const newVotes = { ...old };
                if (voteType === null || voteType === 0) {
                    delete newVotes[commentId];
                } else {
                    newVotes[commentId] = voteType;
                }
                return newVotes;
            });

            return { previousComments, previousVotes };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousComments) {
                queryClient.setQueryData(
                    ["comments", variables.postId],
                    context.previousComments
                );
            }
            if (context?.previousVotes) {
                queryClient.setQueryData(
                    ["comment-votes", variables.postId],
                    context.previousVotes
                );
            }
        },
        onSuccess: (_, variables) => {
            // Refetch to reconcile with server
            queryClient.invalidateQueries({
                queryKey: ["comments", variables.postId],
                refetchType: "active",
            });
            queryClient.invalidateQueries({
                queryKey: ["comment-votes", variables.postId],
                refetchType: "active",
            });
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
