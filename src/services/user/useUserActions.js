import { useMutation, useQueryClient } from '@tanstack/react-query';
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
        onSuccess: () => {
            // Invalidate posts to remove blocked user's posts
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
}
