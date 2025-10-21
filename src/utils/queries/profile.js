import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

// Fetch profile stats (post count, follower count, following count)
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

      return {
        postCount: postCount || 0,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
