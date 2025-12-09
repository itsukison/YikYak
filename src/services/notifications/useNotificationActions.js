import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

/**
 * Mark a notification as read
 */
export function useMarkNotificationReadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ notificationId }) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            // Invalidate notifications query
            queryClient.invalidateQueries(["notifications"]);
            queryClient.invalidateQueries(["notifications-unread-count"]);
        },
    });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllReadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId }) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["notifications"]);
            queryClient.invalidateQueries(["notifications-unread-count"]);
        },
    });
}

/**
 * Delete a notification
 */
export function useDeleteNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ notificationId }) => {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["notifications"]);
            queryClient.invalidateQueries(["notifications-unread-count"]);
        },
    });
}
