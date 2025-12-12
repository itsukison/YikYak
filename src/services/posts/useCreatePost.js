import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";
import { validateContent } from "../moderation/contentFilter";

// Create new post
export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      content,
      latitude,
      longitude,
      locationName,
      photos = [],
      repostOf = null,
    }) => {
      const validation = validateContent(content);
      if (!validation.allowed) {
        throw new Error(validation.error);
      }

      // Step 1: Insert post via RPC (includes rate limiting)
      const { data: post, error } = await supabase.rpc("create_post", {
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
          .from("post_photos")
          .insert(photoRecords);

        if (photoError) {
          console.error("Failed to link photos to post:", photoError);
          // We don't throw here to avoid rolling back the post creation,
          // but in a production app we might want to alert the user or retry.
        }
      }

      return {
        ...post,
        photos: photos.map((url, i) => ({ photo_url: url, photo_order: i })),
      };
    },
    onMutate: async ({
      userId,
      content,
      latitude,
      longitude,
      locationName,
      userNickname,
      userIsAnonymous,
      photos = [],
      repostOf = null,
    }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous data
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      // Create temp post with all required fields
      const tempPost = {
        id: `temp_${Date.now()}`,
        user_id: userId,
        content: content.trim(),
        latitude,
        longitude,
        location_name: locationName,
        created_at: new Date().toISOString(),
        score: 0,
        comment_count: 0,
        photos: photos.map((url, i) => ({ photo_url: url, photo_order: i })),
        author_nickname: userNickname || "User",
        is_anonymous: userIsAnonymous,
        repost_of: repostOf,
        status: "active",
        temp: true,
      };

      // Optimistically add to ONLY the first page of infinite query caches
      // This prevents adding to all location caches
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old?.pages) {
          // If no pages exist, create first page
          return {
            pages: [{ posts: [tempPost], nextCursor: undefined }],
            pageParams: [undefined],
          };
        }
        // Add to the first page only
        return {
          ...old,
          pages: old.pages.map((page, index) => {
            if (index === 0) {
              // Add to first page
              return {
                ...page,
                posts: [tempPost, ...page.posts],
              };
            }
            return page;
          }),
        };
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
    onSuccess: (newPost) => {
      // Remove temp post and add real post with server data
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page, index) => {
            if (index === 0) {
              // Remove temp, add real post to first page
              return {
                ...page,
                posts: [
                  newPost,
                  ...page.posts.filter(
                    (p) => !String(p.id).startsWith("temp_")
                  ),
                ],
              };
            }
            return {
              ...page,
              posts: page.posts.filter(
                (p) => !String(p.id).startsWith("temp_")
              ),
            };
          }),
        };
      });
    },
  });
}
