import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

/**
 * Fetch all notifications for a user
 */
export function useNotificationsQuery(userId) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:users!notifications_actor_id_fkey(id, nickname, is_anonymous),
          post:posts(id, content),
          comment:comments(id, content)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform data to include display names
      return data.map((notification) => ({
        ...notification,
        actor_name: notification.actor?.is_anonymous
          ? "Anonymous"
          : notification.actor?.nickname || "Someone",
      }));
    },
    enabled: !!userId,
  });
}

/**
 * Get unread notification count
 */
export function useUnreadCountQuery(userId) {
  return useQuery({
    queryKey: ["notifications-unread-count", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}

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
