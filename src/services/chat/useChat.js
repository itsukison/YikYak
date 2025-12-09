import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

/**
 * Fetch all chats for the current user
 */
export function useChatsQuery(userId) {
  return useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("chats")
        .select(
          `
          *,
          user1:users!chats_user1_id_fkey(id, nickname, is_anonymous),
          user2:users!chats_user2_id_fkey(id, nickname, is_anonymous),
          messages(content, created_at, is_read, sender_id)
        `
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform data to include other user and last message
      return data.map((chat) => {
        const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
        const messages = chat.messages || [];
        const lastMessage =
          messages.length > 0 ? messages[messages.length - 1] : null;
        const unreadCount = messages.filter(
          (msg) => !msg.is_read && msg.sender_id !== userId
        ).length;

        return {
          ...chat,
          otherUser,
          lastMessage,
          unreadCount,
        };
      });
    },
    enabled: !!userId,
  });
}

/**
 * Fetch messages for a specific chat (with local storage)
 */
export function useChatMessagesQuery(chatId, userId) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async ({ signal }) => {
      if (!chatId) throw new Error("Chat ID required");

      // Always fetch from database to ensure we have the latest messages
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
        `
        )
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .abortSignal(signal);

      if (error) throw error;

      return data || [];
    },
    enabled: !!chatId,
    // staleTime defaults to 5 mins from global config
    // gcTime defaults to 24 hours from global config
  });
}
