import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";

/**
 * Send a new message (simplified for reliability)
 */
export function useSendMessageMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chatId, senderId, content, senderData, recipientId }) => {
            // Insert message to database
            const { data, error } = await supabase
                .from("messages")
                .insert({
                    chat_id: chatId,
                    sender_id: senderId,
                    content: content.trim(),
                })
                .select(`
          *,
          sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
        `)
                .single();

            if (error) throw error;

            return data;
        },
        onMutate: async ({ chatId, senderId, content, senderData }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            // Do NOT await this, as it can hang if the query is stuck.
            // We accept the risk of a race condition (old data overwriting new) which is eventualy fixed by invalidation.
            queryClient.cancelQueries({ queryKey: ["messages", chatId] }).catch(err => console.warn('Cancel failed:', err));

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData(["messages", chatId]);

            // Create temporary message
            const tempMessage = {
                tempId: `temp_${Date.now()}_${Math.random()}`,
                chat_id: chatId,
                sender_id: senderId,
                content: content.trim(),
                created_at: new Date().toISOString(),
                synced: false,
                is_read: false,
                sender: senderData,
            };

            // Optimistically update to the new value
            // Note: We prepend because the list is now sorted descending (Newest first)
            queryClient.setQueryData(["messages", chatId], (old) => {
                if (!old) return [tempMessage];
                return [tempMessage, ...old];
            });

            // Return a context object with the snapshotted value
            return { previousMessages };
        },
        onSuccess: (data, variables) => {
            // Replace the temp message with the real one
            queryClient.setQueryData(["messages", variables.chatId], (oldData) => {
                if (!oldData) return [data];

                // Find the temp message (it should be at the top) and replace it
                // Or just map through to be safe
                return oldData.map(msg => {
                    if (msg.content === data.content && msg.sender_id === data.sender_id && !msg.id) {
                        return data;
                    }
                    return msg;
                });
            });

            // Invalidate to ensure consistency
            queryClient.invalidateQueries(["chats"]);
            queryClient.invalidateQueries(["messages", variables.chatId]);
        },
        onError: (err, variables, context) => {
            console.error("Error sending message:", err);
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousMessages) {
                queryClient.setQueryData(["messages", variables.chatId], context.previousMessages);
            }
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
