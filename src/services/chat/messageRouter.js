/**
 * Message Router Service
 * Routes messages based on recipient's online status
 * Online users: Real-time via Supabase Realtime
 * Offline users: Store in database + send notification
 */

import { supabase } from '../../adapters/supabaseClient';
import * as presenceService from '../presence/presenceService';
import * as chatStorage from '../storage/chatStorage';

/**
 * Send a message with smart routing
 * @param {Object} messageData - Message data
 * @param {string} recipientId - Recipient user ID
 * @returns {Object} Result with delivery method
 */
export const sendMessage = async (messageData, recipientId) => {
  try {
    const { chatId, senderId, content, senderData } = messageData;

    if (!chatId || !senderId || !content || !recipientId) {
      throw new Error('Invalid message data');
    }

    // Step 1: Check if recipient is online
    const isOnline = await presenceService.isUserOnline(recipientId);

    console.log(`Recipient ${recipientId} is ${isOnline ? 'online' : 'offline'}`);

    // Step 2: Create temporary message for local storage
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

    // Step 3: Store in sender's local storage immediately
    await chatStorage.addMessage(chatId, tempMessage);

    // Step 4: Insert to database
    const { data: dbMessage, error: dbError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select(
        `
        *,
        sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
      `
      )
      .single();

    if (dbError) throw dbError;

    // Step 5: Update chat timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    // Step 6: Route based on online status
    if (isOnline) {
      // Recipient is online - message will be delivered via Realtime subscription
      console.log('Message delivered via Realtime to online user');

      return {
        success: true,
        message: dbMessage,
        deliveryMethod: 'realtime',
        recipientOnline: true,
      };
    } else {
      // Recipient is offline - send notification
      console.log('Recipient offline, sending notification');

      // Create notification
      await createMessageNotification(recipientId, senderId, chatId, dbMessage.id);

      return {
        success: true,
        message: dbMessage,
        deliveryMethod: 'notification',
        recipientOnline: false,
      };
    }
  } catch (error) {
    console.error('Error routing message:', error);
    return {
      success: false,
      error: error.message,
      deliveryMethod: 'failed',
    };
  }
};

/**
 * Create a notification for an offline user
 * @param {string} recipientId - Recipient user ID
 * @param {string} senderId - Sender user ID
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 */
const createMessageNotification = async (recipientId, senderId, chatId, messageId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        actor_id: senderId,
        type: 'message',
        // Note: notifications table doesn't have chat_id or message_id fields
        // We'll use post_id as a workaround or extend the schema
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating notification:', error);
    } else {
      console.log('Notification created for offline user');
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Fetch pending messages for a user (when they come online)
 * @param {string} userId - User ID
 * @param {string} lastSeenTimestamp - Last time user was online
 * @returns {Array} Array of pending messages grouped by chat
 */
export const fetchPendingMessages = async (userId, lastSeenTimestamp) => {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    // Get all chats for this user
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (chatsError) throw chatsError;

    if (!chats || chats.length === 0) {
      return [];
    }

    const chatIds = chats.map((chat) => chat.id);

    // Fetch messages from all chats since last seen
    let query = supabase
      .from('messages')
      .select(
        `
        *,
        sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
      `
      )
      .in('chat_id', chatIds)
      .neq('sender_id', userId) // Only messages from others
      .order('created_at', { ascending: true });

    if (lastSeenTimestamp) {
      query = query.gt('created_at', lastSeenTimestamp);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) throw messagesError;

    // Group by chat
    const messagesByChat = {};
    messages.forEach((msg) => {
      if (!messagesByChat[msg.chat_id]) {
        messagesByChat[msg.chat_id] = [];
      }
      messagesByChat[msg.chat_id].push(msg);
    });

    return messagesByChat;
  } catch (error) {
    console.error('Error fetching pending messages:', error);
    return {};
  }
};

/**
 * Sync pending messages to local storage when user comes online
 * @param {string} userId - User ID
 * @param {string} lastSeenTimestamp - Last time user was online
 */
export const syncPendingMessages = async (userId, lastSeenTimestamp) => {
  try {
    const messagesByChat = await fetchPendingMessages(userId, lastSeenTimestamp);

    // Store each chat's messages in local storage
    for (const [chatId, messages] of Object.entries(messagesByChat)) {
      // Get existing local messages
      const localMessages = await chatStorage.getMessages(chatId);

      // Merge with new messages (deduplicate by ID)
      const existingIds = new Set(localMessages.map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));

      if (newMessages.length > 0) {
        const mergedMessages = [...localMessages, ...newMessages].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        await chatStorage.storeMessages(chatId, mergedMessages);
        console.log(`Synced ${newMessages.length} pending messages for chat ${chatId}`);
      }
    }

    return {
      success: true,
      chatsUpdated: Object.keys(messagesByChat).length,
      totalMessages: Object.values(messagesByChat).reduce(
        (sum, msgs) => sum + msgs.length,
        0
      ),
    };
  } catch (error) {
    console.error('Error syncing pending messages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark messages as delivered when recipient comes online
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID (recipient)
 */
export const markMessagesDelivered = async (chatId, userId) => {
  try {
    // This could be extended to add a 'delivered' status to messages
    // For now, we'll just mark them as read when the chat is opened
    console.log(`Messages in chat ${chatId} delivered to user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as delivered:', error);
    return { success: false, error: error.message };
  }
};
