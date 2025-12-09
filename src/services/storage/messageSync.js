/**
 * Message Sync Service
 * Handles synchronization between local storage and database
 */

import { supabase } from '../../adapters/supabaseClient';
import * as chatStorage from './chatStorage';

const SYNC_BATCH_SIZE = 50;
const RETENTION_DAYS = 30;

/**
 * Sync messages from database to local storage
 * @param {string|number} chatId - Chat ID
 * @param {string} userId - Current user ID
 * @returns {Object} Sync result
 */
export const syncMessagesFromDatabase = async (chatId, userId) => {
  try {
    if (!chatId || !userId) {
      throw new Error('Invalid chatId or userId');
    }

    // Get local messages
    const localMessages = await chatStorage.getMessages(chatId);
    const lastLocalMessage = localMessages[localMessages.length - 1];
    const lastLocalTimestamp = lastLocalMessage?.created_at;

    // Fetch messages from database (only newer than local)
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (lastLocalTimestamp) {
      query = query.gt('created_at', lastLocalTimestamp);
    }

    const { data: newMessages, error } = await query;

    if (error) throw error;

    if (!newMessages || newMessages.length === 0) {
      return { success: true, newCount: 0, totalCount: localMessages.length };
    }

    // Merge with local messages
    const mergedMessages = [...localMessages];
    let newCount = 0;

    for (const msg of newMessages) {
      // Check if message already exists locally
      const exists = mergedMessages.some((m) => m.id === msg.id);
      if (!exists) {
        mergedMessages.push({ ...msg, synced: true });
        newCount++;
      }
    }

    // Sort by created_at
    mergedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Store merged messages
    await chatStorage.storeMessages(chatId, mergedMessages);

    return {
      success: true,
      newCount,
      totalCount: mergedMessages.length,
    };
  } catch (error) {
    console.error('Error syncing messages from database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync unsynced local messages to database
 * @param {string|number} chatId - Chat ID
 * @returns {Object} Sync result
 */
export const syncMessagesToDatabase = async (chatId) => {
  try {
    if (!chatId) {
      throw new Error('Invalid chatId');
    }

    // Get local messages that haven't been synced
    const localMessages = await chatStorage.getMessages(chatId);
    const unsyncedMessages = localMessages.filter((msg) => !msg.synced && msg.tempId);

    if (unsyncedMessages.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    let syncedCount = 0;
    const errors = [];

    // Sync in batches
    for (let i = 0; i < unsyncedMessages.length; i += SYNC_BATCH_SIZE) {
      const batch = unsyncedMessages.slice(i, i + SYNC_BATCH_SIZE);

      for (const msg of batch) {
        try {
          // Insert to database
          const { data, error } = await supabase
            .from('messages')
            .insert({
              chat_id: msg.chat_id,
              sender_id: msg.sender_id,
              content: msg.content,
              created_at: msg.created_at,
            })
            .select()
            .single();

          if (error) throw error;

          // Update local message with real ID and mark as synced
          await chatStorage.updateMessage(chatId, msg.tempId, {
            id: data.id,
            synced: true,
            tempId: undefined, // Remove tempId
          });

          syncedCount++;
        } catch (error) {
          console.error('Error syncing message:', error);
          errors.push({ messageId: msg.tempId, error: error.message });
        }
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error syncing messages to database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Full bidirectional sync
 * @param {string|number} chatId - Chat ID
 * @param {string} userId - Current user ID
 * @returns {Object} Sync result
 */
export const fullSync = async (chatId, userId) => {
  try {
    // First, sync local messages to database
    const uploadResult = await syncMessagesToDatabase(chatId);

    // Then, sync database messages to local
    const downloadResult = await syncMessagesFromDatabase(chatId, userId);

    return {
      success: uploadResult.success && downloadResult.success,
      uploaded: uploadResult.syncedCount,
      downloaded: downloadResult.newCount,
      total: downloadResult.totalCount,
    };
  } catch (error) {
    console.error('Error in full sync:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up old messages from database (keep only last 30 days)
 * This should be run periodically on the backend, but can be triggered manually
 * @param {string|number} chatId - Chat ID
 * @returns {Object} Cleanup result
 */
export const cleanupOldMessages = async (chatId) => {
  try {
    if (!chatId) {
      throw new Error('Invalid chatId');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId)
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) throw error;

    return {
      success: true,
      deletedCount: data?.length || 0,
    };
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize chat - load from local storage first, then sync from database
 * @param {string|number} chatId - Chat ID
 * @param {string} userId - Current user ID
 * @returns {Object} Initial messages and sync status
 */
export const initializeChat = async (chatId, userId) => {
  try {
    // Load from local storage immediately
    const localMessages = await chatStorage.getMessages(chatId);

    // Start background sync (don't wait for it)
    syncMessagesFromDatabase(chatId, userId).catch((error) => {
      console.error('Background sync failed:', error);
    });

    return {
      messages: localMessages,
      fromCache: true,
      syncInProgress: true,
    };
  } catch (error) {
    console.error('Error initializing chat:', error);
    return {
      messages: [],
      fromCache: false,
      error: error.message,
    };
  }
};

/**
 * Send message with local-first approach
 * @param {Object} messageData - Message data
 * @returns {Object} Result with temporary message
 */
export const sendMessageLocalFirst = async (messageData) => {
  try {
    const { chatId, senderId, content } = messageData;

    if (!chatId || !senderId || !content) {
      throw new Error('Invalid message data');
    }

    // Create temporary message for optimistic UI
    const tempMessage = {
      tempId: `temp_${Date.now()}_${Math.random()}`,
      chat_id: chatId,
      sender_id: senderId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      synced: false,
      is_read: false,
    };

    // Store locally immediately
    await chatStorage.addMessage(chatId, tempMessage);

    // Return temp message for immediate UI update
    return {
      success: true,
      message: tempMessage,
      local: true,
    };
  } catch (error) {
    console.error('Error sending message locally:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark message as synced after successful database insert
 * @param {string|number} chatId - Chat ID
 * @param {string} tempId - Temporary message ID
 * @param {Object} serverMessage - Message data from server
 */
export const markMessageSynced = async (chatId, tempId, serverMessage) => {
  try {
    await chatStorage.updateMessage(chatId, tempId, {
      id: serverMessage.id,
      synced: true,
      tempId: undefined,
      created_at: serverMessage.created_at, // Use server timestamp
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking message as synced:', error);
    return { success: false, error: error.message };
  }
};
