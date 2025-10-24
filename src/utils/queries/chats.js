import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

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
 * Fetch messages for a specific chat
 */
export function useChatMessagesQuery(chatId) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      if (!chatId) throw new Error("Chat ID required");

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
        `
        )
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!chatId,
  });
}

/**
 * Send a new message
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, senderId, content }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update chat's updated_at timestamp
      await supabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId);

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries(["messages", variables.chatId]);
      // Invalidate chats query to update last message
      queryClient.invalidateQueries(["chats"]);
    },
  });
}

/**
 * Create a new chat with another user
 */
export function useCreateChatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user1Id, user2Id }) => {
      // Check if chat already exists
      const { data: existingChat, error: checkError } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
        )
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingChat) {
        return existingChat;
      }

      // Ensure user1_id < user2_id to satisfy CHECK constraint
      const sortedIds = [user1Id, user2Id].sort();
      const [smallerId, largerId] = sortedIds;

      // Create new chat
      const { data, error } = await supabase
        .from("chats")
        .insert({
          user1_id: smallerId,
          user2_id: largerId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["chats"]);
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkMessagesReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, userId }) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .neq("sender_id", userId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["messages", variables.chatId]);
      queryClient.invalidateQueries(["chats"]);
    },
  });
}
