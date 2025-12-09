import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../adapters/supabaseClient';

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
