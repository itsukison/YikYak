import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";
import * as presenceService from "../presence/presenceService";
import * as chatStorage from "../storage/chatStorage";
import * as chatMetrics from "../monitoring/chatMetrics";

/**
 * Send a new message with smart routing based on recipient presence
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      senderId,
      content,
      senderData,
      recipientId,
    }) => {
      const startTime = Date.now();

      // Check if recipient is online
      const presenceStartTime = Date.now();
      const isRecipientOnline = await presenceService.isUserOnline(recipientId);
      const presenceLatency = Date.now() - presenceStartTime;

      // Track presence check
      chatMetrics.trackPresenceCheck(
        recipientId,
        isRecipientOnline,
        presenceLatency
      );

      console.log(
        `[Smart Routing] Recipient ${recipientId} is ${
          isRecipientOnline ? "online" : "offline"
        }`
      );

      // Create message object
      const messageData = {
        chat_id: chatId,
        sender_id: senderId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      if (isRecipientOnline) {
        // ONLINE: Deliver via Realtime, database insert for 30-day retention
        const tempMessage = {
          ...messageData,
          tempId: `temp_${Date.now()}_${Math.random()}`,
          sender: senderData,
          synced: false,
          is_read: false,
        };

        // Store in local storage immediately
        await chatStorage.addMessage(chatId, tempMessage);

        // Broadcast via Supabase Realtime (recipient picks it up via subscription)
        const { data, error } = await supabase
          .from("messages")
          .insert(messageData)
          .select(
            `
                        *,
                        sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
                    `
          )
          .single();

        if (error) throw error;

        if (data) {
          // Update local storage with real ID
          await chatStorage.updateMessage(chatId, tempMessage.tempId, {
            ...data,
            synced: true,
            tempId: undefined,
          });
        }

        // Update chat timestamp
        await supabase
          .from("chats")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", chatId);

        // Track metrics
        const totalLatency = Date.now() - startTime;
        chatMetrics.trackMessageSent("realtime", true, totalLatency, {
          chatId,
          recipientOnline: true,
        });
        chatMetrics.trackDatabaseCost("write", 2, {
          operation: "message_insert_and_chat_update",
        });

        return { ...data, deliveryMethod: "realtime" };
      } else {
        // OFFLINE: Store in database + create notification
        const { data, error } = await supabase
          .from("messages")
          .insert(messageData)
          .select(
            `
                        *,
                        sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
                    `
          )
          .single();

        if (error) throw error;

        // Store in local storage
        await chatStorage.addMessage(chatId, { ...data, synced: true });

        // Create notification for offline user
        await supabase.from("notifications").insert({
          user_id: recipientId,
          actor_id: senderId,
          type: "message",
        });

        // Update chat timestamp
        await supabase
          .from("chats")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", chatId);

        // Track metrics
        const totalLatency = Date.now() - startTime;
        chatMetrics.trackMessageSent("notification", true, totalLatency, {
          chatId,
          recipientOnline: false,
        });
        chatMetrics.trackDatabaseCost("write", 3, {
          operation: "message_insert_notification_chat_update",
        });

        return { ...data, deliveryMethod: "notification" };
      }
    },
    onMutate: async ({ chatId, senderId, content, senderData }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["messages", chatId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(["messages", chatId]);

      // Create temporary message for optimistic UI
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

      // Store in local storage immediately
      await chatStorage.addMessage(chatId, tempMessage);

      // Optimistically update React Query cache
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old || !old.pages) {
          return { pages: [[tempMessage]], pageParams: [0] };
        }

        // Add to the beginning of the first page
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          newPages[0] = [tempMessage, ...newPages[0]];
        } else {
          newPages.push([tempMessage]);
        }

        return { ...old, pages: newPages };
      });

      // Return a context object with the snapshotted value
      return { previousMessages, tempMessage };
    },
    onSuccess: (data, variables, context) => {
      // Remove temp message from local storage if it exists
      if (context?.tempMessage?.tempId) {
        chatStorage
          .deleteMessage(variables.chatId, context.tempMessage.tempId)
          .catch((err) => console.error("Error deleting temp message:", err));
      }

      // Add real message to local storage
      chatStorage
        .addMessage(variables.chatId, { ...data, synced: true })
        .catch((err) =>
          console.error("Error adding message to local storage:", err)
        );

      // Replace the temp message with the real one in React Query
      queryClient.setQueryData(["messages", variables.chatId], (oldData) => {
        if (!oldData || !oldData.pages) return oldData;

        const newPages = oldData.pages.map((page) =>
          page.map((msg) => {
            if (msg.tempId === context?.tempMessage?.tempId) {
              return data;
            }
            return msg;
          })
        );

        return { ...oldData, pages: newPages };
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries(["chats"]);
    },
    onError: (err, variables, context) => {
      console.error("Error sending message:", err);

      // Track error
      chatMetrics.trackMessageDeliveryFailed(err, {
        chatId: variables.chatId,
        recipientId: variables.recipientId,
      });

      // Mark as failed in local storage (don't delete)
      if (context?.tempMessage?.tempId) {
        chatStorage
          .updateMessage(variables.chatId, context.tempMessage.tempId, {
            synced: false,
            error: err.message,
          })
          .catch((updateErr) =>
            console.error("Error updating message:", updateErr)
          );
      }

      // Rollback React Query
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", variables.chatId],
          context.previousMessages
        );
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
