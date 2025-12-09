import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../adapters/supabaseClient';

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
