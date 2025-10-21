import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

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
        .select(`
          *,
          author:users!comments_user_id_fkey(id, nickname, is_anonymous)
        `)
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
            await supabase
              .from("comments")
              .select("id")
              .eq("post_id", postId)
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
        .select(`
          *,
          author:users!comments_user_id_fkey(id, nickname, is_anonymous)
        `)
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
      // Insert or update vote
      const { error } = await supabase
        .from("votes_comments")
        .upsert(
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

      // Recalculate comment score
      const { data: votes } = await supabase
        .from("votes_comments")
        .select("vote_type")
        .eq("comment_id", commentId);

      const newScore = votes?.reduce((sum, vote) => sum + vote.vote_type, 0) || 0;

      await supabase
        .from("comments")
        .update({ score: newScore })
        .eq("id", commentId);
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
