import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

// Fetch posts within radius
// Fetch posts within radius
export function usePostsQuery(latitude, longitude, radius = 5000, sortBy = 'new', timeFilter = 'week', enabled = true) {
  return useQuery({
    queryKey: ['posts', latitude, longitude, radius, sortBy, timeFilter],
    queryFn: async () => {
      // Use the new optimized RPC that returns posts WITH photos
      const { data, error } = await supabase.rpc('get_feed_optimized', {
        user_lat: latitude,
        user_lon: longitude,
        radius_meters: radius,
        sort_by: sortBy,
        time_filter: timeFilter,
        limit_count: 20,
      });

      if (error) throw error;

      // The RPC returns 'photos' as a JSON array, so we don't need manual fetching
      return data || [];
    },
    enabled: enabled && latitude != null && longitude != null,
    staleTime: 1000 * 60, // 1 minute
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
  });
}

// Fetch user's votes
export function useUserVotesQuery(userId) {
  return useQuery({
    queryKey: ['user-votes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes_posts')
        .select('post_id, vote_type')
        .eq('user_id', userId);

      if (error) throw error;

      // Convert to map for easy lookup
      const votesMap = {};
      data?.forEach((vote) => {
        // Map integer to string for UI
        let type = null;
        if (vote.vote_type === 1) type = 'up';
        if (vote.vote_type === -1) type = 'down';
        if (type) votesMap[vote.post_id] = type;
      });
      return votesMap;
    },
    enabled: !!userId,
  });
}

// Create new post
export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, content, latitude, longitude, locationName, photos = [], repostOf = null }) => {
      // Step 1: Insert post via RPC (includes rate limiting)
      const { data: post, error } = await supabase.rpc('create_post', {
        p_content: content.trim(),
        p_latitude: latitude,
        p_longitude: longitude,
        p_location_name: locationName,
        p_repost_of: repostOf,
      });

      if (error) throw error;

      // Step 2: Insert photos if any
      if (photos.length > 0) {
        const photoRecords = photos.map((url, index) => ({
          post_id: post.id,
          photo_url: url,
          photo_order: index,
        }));

        const { error: photoError } = await supabase
          .from('post_photos')
          .insert(photoRecords);

        if (photoError) {
          console.error('Failed to link photos to post:', photoError);
          // We don't throw here to avoid rolling back the post creation, 
          // but in a production app we might want to alert the user or retry.
        }
      }

      return { ...post, photos: photos.map((url, i) => ({ photo_url: url, photo_order: i })) };
    },
    onMutate: async ({ userId, content, latitude, longitude, locationName, userNickname, userIsAnonymous, photos = [], repostOf = null }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot previous data
      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });

      // Create temp post
      const tempPost = {
        id: `temp_${Date.now()}`,
        user_id: userId,
        content: content.trim(),
        latitude,
        longitude,
        location_name: locationName,
        created_at: new Date().toISOString(),
        score: 0,
        photos: photos.map((url, i) => ({ photo_url: url, photo_order: i })),
        nickname: userNickname || 'User', // Fallback
        is_anonymous: userIsAnonymous,
        repost_of: repostOf,
        temp: true,
      };

      // Optimistically update posts lists
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
        if (!old) return [tempPost];
        return [tempPost, ...old];
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate posts queries to refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Vote on post
export function useVotePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, postId, voteType }) => {
      // If voteType is null, delete the vote using RPC (value 0)
      if (voteType === null) {
        const { error } = await supabase.rpc('handle_post_vote', {
          p_post_id: postId,
          p_user_id: userId,
          p_vote_value: 0,
        });

        if (error) throw error;
        return null;
      }

      // Map string to integer for DB
      const dbVoteType = voteType === 'up' ? 1 : -1;

      // Otherwise, upsert the vote
      const { error } = await supabase.rpc('handle_post_vote', {
        p_post_id: postId,
        p_user_id: userId,
        p_vote_value: dbVoteType,
      });

      if (error) throw error;
      return voteType;
    },
    onMutate: async ({ userId, postId, voteType }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['user-votes', userId] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });
      const previousUserVotes = queryClient.getQueryData(['user-votes', userId]);
      const previousPost = queryClient.getQueryData(['post', postId]);

      // Optimistically update user votes
      queryClient.setQueryData(['user-votes', userId], (old) => {
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
        if (currentVote === 'up') change -= 1;
        if (currentVote === 'down') change += 1; // Removing a downvote increases score

        // Add new vote effect
        if (newVote === 'up') change += 1;
        if (newVote === 'down') change -= 1;

        return change;
      };

      const currentVote = previousUserVotes ? previousUserVotes[postId] : null;
      const scoreChange = calculateScoreChange(currentVote, voteType);

      // Optimistically update posts lists
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              score: (post.score || 0) + scoreChange,
            };
          }
          return post;
        });
      });

      // Optimistically update single post view
      queryClient.setQueryData(['post', postId], (old) => {
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
        queryClient.setQueryData(['user-votes', variables.userId], context.previousUserVotes);
      }
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', variables.postId], context.previousPost);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user-votes', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

// Fetch single post with photos
export function usePostQuery(postId) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      // Fetch post
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
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
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Fetch photos
      const { data: photos, error: photosError } = await supabase
        .from('post_photos')
        .select('*')
        .eq('post_id', postId)
        .order('photo_order', { ascending: true });

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

// Report post
export function useReportPostMutation() {
  return useMutation({
    mutationFn: async ({ reporterId, postId, reportedUserId, reason }) => {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_post_id: postId,
          reported_user_id: reportedUserId,
          reason: reason,
        });

      if (error) throw error;
    },
  });
}

// Block user
export function useBlockUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockedUserId }) => {
      const { error } = await supabase.rpc('block_user', {
        blocked_user_id: blockedUserId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate posts to remove blocked user's posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Delete post (Soft Delete)
export function useDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }) => {
      const { error } = await supabase.rpc('delete_post', {
        p_post_id: postId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-votes'] }); // Optional, but good practice
    },
  });
}
