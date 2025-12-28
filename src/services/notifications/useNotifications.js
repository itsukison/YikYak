import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

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
          actor:users!notifications_actor_id_fkey(id, nickname, is_anonymous, avatar_url),
          post:posts(id, content),
          comment:comments(id, content)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform data to include display names and avatar URLs
      return data.map((notification) => ({
        ...notification,
        actor_name: notification.actor?.is_anonymous
          ? "Anonymous"
          : notification.actor?.nickname || "Someone",
        actor_avatar_url: notification.actor?.is_anonymous
          ? null
          : notification.actor?.avatar_url || null,
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
