import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../adapters/supabaseClient';

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
        onSuccess: (_, variables) => {
            // Invalidate block status for this user
            queryClient.invalidateQueries({
                queryKey: ['block-status', variables.blockedUserId]
            });
            // Invalidate posts to remove blocked user's posts
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            // Invalidate user posts to hide their posts on profile
            queryClient.invalidateQueries({
                queryKey: ['user-posts', variables.blockedUserId]
            });
        },
    });
}

// Unblock user
export function useUnblockUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ blockedUserId }) => {
            const { error } = await supabase.rpc('unblock_user', {
                blocked_user_id: blockedUserId,
            });

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            // Invalidate block status for this user
            queryClient.invalidateQueries({
                queryKey: ['block-status', variables.blockedUserId]
            });
            // Invalidate posts to show previously hidden posts
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            // Invalidate user posts to show their posts on profile
            queryClient.invalidateQueries({
                queryKey: ['user-posts', variables.blockedUserId]
            });
        },
    });
}

// Get block status for a specific user
export function useBlockStatusQuery(currentUserId, targetUserId) {
    return useQuery({
        queryKey: ['block-status', targetUserId],
        queryFn: async () => {
            if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
                return false;
            }

            const { data, error } = await supabase.rpc('get_block_status', {
                target_user_id: targetUserId,
            });

            if (error) throw error;
            return data || false;
        },
        enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// Get list of all blocked users (for settings page, future feature)
export function useBlockedUsersQuery(userId) {
    return useQuery({
        queryKey: ['blocked-users', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID required');

            const { data, error } = await supabase
                .from('blocks')
                .select(`
                    blocked_id,
                    created_at,
                    blocked_user:users!blocks_blocked_id_fkey(
                        id,
                        nickname,
                        username,
                        avatar_url,
                        is_anonymous
                    )
                `)
                .eq('blocker_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
    });
}
