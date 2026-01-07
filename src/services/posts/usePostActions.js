import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

// Vote on post
export function useVotePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, postId, voteType }) => {
      // If voteType is null, delete the vote using RPC (value 0)
      if (voteType === null) {
        const { error } = await supabase.rpc("handle_post_vote", {
          p_post_id: postId,
          p_user_id: userId,
          p_vote_value: 0,
        });

        if (error) throw error;
        return null;
      }

      // Map string to integer for DB
      const dbVoteType = voteType === "up" ? 1 : -1;

      // Otherwise, upsert the vote
      const { error } = await supabase.rpc("handle_post_vote", {
        p_post_id: postId,
        p_user_id: userId,
        p_vote_value: dbVoteType,
      });

      if (error) throw error;
      return voteType;
    },
    onMutate: async ({ userId, postId, voteType }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["user-votes", userId] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });
      const previousUserVotes = queryClient.getQueryData([
        "user-votes",
        userId,
      ]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      // Optimistically update user votes
      queryClient.setQueryData(["user-votes", userId], (old) => {
        const newVotes = { ...old };
        if (voteType === null) {
          delete newVotes[postId];
        } else {
          newVotes[postId] = voteType;
        }
        return newVotes;
      });

      // Helper to calculate score change
      const calculateScoreChange = (currentVote, newVote) => {
        let change = 0;

        // Remove old vote effect
        if (currentVote === "up") change -= 1;
        if (currentVote === "down") change += 1; // Removing a downvote increases score

        // Add new vote effect
        if (newVote === "up") change += 1;
        if (newVote === "down") change -= 1;

        return change;
      };

      const currentVote = previousUserVotes ? previousUserVotes[postId] : null;
      const scoreChange = calculateScoreChange(currentVote, voteType);

      // Optimistically update posts lists (infinite query structure)
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  score: (post.score || 0) + scoreChange,
                };
              }
              return post;
            }),
          })),
        };
      });

      // Optimistically update single post view
      queryClient.setQueryData(["post", postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          score: (old.score || 0) + scoreChange,
        };
      });

      // Return a context object with the snapshotted value
      return { previousPosts, previousUserVotes, previousPost };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousUserVotes) {
        queryClient.setQueryData(
          ["user-votes", variables.userId],
          context.previousUserVotes
        );
      }
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousPost) {
        queryClient.setQueryData(
          ["post", variables.postId],
          context.previousPost
        );
      }
    },
    onSuccess: (_, variables) => {
      // HYBRID APPROACH: Optimistic updates + server reconciliation
      // Mark user votes as stale but don't refetch immediately
      // This prevents race condition with optimistic update
      queryClient.invalidateQueries({
        queryKey: ["user-votes", variables.userId],
        exact: true,
        refetchType: "none", // Don't refetch now, prevents overwriting optimistic update
      });

      // Mark post data as stale but don't refetch immediately (no loading spinner)
      // This ensures next time we fetch, we get accurate server data
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
        refetchType: "none", // Don't refetch now, just mark stale
      });

      // Mark posts lists as stale (will refetch on next mount or focus)
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "none", // Don't refetch now
      });
    },
  });
}

// Report post
export function useReportPostMutation() {
  return useMutation({
    mutationFn: async ({ reporterId, postId, reportedUserId, reason }) => {
      const { error } = await supabase.from("reports").insert({
        reporter_id: reporterId,
        reported_post_id: postId,
        reported_user_id: reportedUserId,
        reason: reason,
      });

      if (error) throw error;
    },
  });
}

// Delete post (Soft Delete)
export function useDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }) => {
      const { error } = await supabase.rpc("delete_post", {
        p_post_id: postId,
      });

      if (error) throw error;
    },
    onMutate: async ({ postId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous data
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      // Optimistically remove post from all infinite query caches
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((post) => post.id !== postId),
          })),
        };
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate posts queries to ensure deleted post doesn't reappear from cache
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// Edit post
export function useEditPostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, isAnonymous, photos }) => {
      // Step 1: Update post content and is_anonymous (photos is NOT a column in posts table)
      const updates = {
        content,
        is_anonymous: isAnonymous,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", postId)
        .select()
        .single();

      if (error) throw error;

      // Step 2: Handle photos separately in post_photos table
      if (photos !== undefined) {
        // Delete existing photos for this post
        const { error: deleteError } = await supabase
          .from("post_photos")
          .delete()
          .eq("post_id", postId);

        if (deleteError) {
          console.error("Failed to delete old photos:", deleteError);
          // Continue anyway - we'll try to insert new ones
        }

        // Insert new photos if any
        if (photos.length > 0) {
          const photoRecords = photos.map((url, index) => ({
            post_id: postId,
            photo_url: url,
            photo_order: index,
          }));

          const { error: photoError } = await supabase
            .from("post_photos")
            .insert(photoRecords);

          if (photoError) {
            console.error("Failed to insert new photos:", photoError);
            // Don't throw - post content was updated successfully
          }
        }
      }

      return {
        ...data,
        photos: photos || [],
      };
    },
    onMutate: async ({ postId, content, isAnonymous, photos }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Snapshot previous data
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });
      const previousPost = queryClient.getQueryData(["post", postId]);

      const now = new Date().toISOString();

      // Optimistically update in infinite query caches
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  content,
                  is_anonymous: isAnonymous,
                  photos,
                  updated_at: now,
                };
              }
              return post;
            }),
          })),
        };
      });

      // Optimistically update single post view
      queryClient.setQueryData(["post", postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          content,
          is_anonymous: isAnonymous,
          photos,
          updated_at: now,
        };
      });

      return { previousPosts, previousPost };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousPost) {
        queryClient.setQueryData(
          ["post", variables.postId],
          context.previousPost
        );
      }
    },
    onSuccess: (data) => {
      // No global invalidation - optimistic updates handle it
      // Only update with server response to ensure consistency
      queryClient.setQueryData(["post", data.id], data);
    },
  });
}
