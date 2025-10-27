import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

// Fetch posts within radius
export function usePostsQuery(latitude, longitude, radius = 5000, sortBy = 'new', timeFilter = 'week', enabled = true) {
  return useQuery({
    queryKey: ['posts', latitude, longitude, radius, sortBy, timeFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_posts_within_radius', {
        user_lat: latitude,
        user_lon: longitude,
        radius_meters: radius,
        sort_by: sortBy,
        time_filter: timeFilter,
        limit_count: 20,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && latitude != null && longitude != null,
    staleTime: 1000 * 60, // 1 minute
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
        votesMap[vote.post_id] = vote.vote_type;
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
    mutationFn: async ({ userId, content, latitude, longitude, locationName }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: content.trim(),
          latitude,
          longitude,
          location_name: locationName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      // If voteType is null, delete the vote
      if (voteType === null) {
        const { error } = await supabase
          .from('votes_posts')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId);

        if (error) throw error;
        return null;
      }

      // Otherwise, upsert the vote
      const { error } = await supabase.rpc('handle_post_vote', {
        p_user_id: userId,
        p_post_id: postId,
        p_vote_type: voteType,
      });

      if (error) throw error;
      return voteType;
    },
    onSuccess: (_, variables) => {
      // Invalidate user votes to refetch
      queryClient.invalidateQueries({ queryKey: ['user-votes', variables.userId] });
      // Optionally invalidate posts to get updated scores
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
