/**
 * Chat Storage Service
 * Handles local storage of chat messages using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'chat_messages_';
const CHAT_METADATA_KEY = 'chat_metadata';
const MAX_MESSAGES_PER_CHAT = 1000; // Prevent storage overflow

/**
 * Get storage key for a chat
 */
const getChatKey = (chatId) => `${STORAGE_PREFIX}${chatId}`;

/**
 * Store messages for a chat
 * @param {string|number} chatId - Chat ID
 * @param {Array} messages - Array of message objects
 */
export const storeMessages = async (chatId, messages) => {
  try {
    if (!chatId || !Array.isArray(messages)) {
      throw new Error('Invalid chatId or messages');
    }

    // Limit messages to prevent storage overflow
    const limitedMessages = messages.slice(-MAX_MESSAGES_PER_CHAT);

    const key = getChatKey(chatId);
    await AsyncStorage.setItem(key, JSON.stringify(limitedMessages));

    // Update metadata
    await updateChatMetadata(chatId, {
      lastUpdated: new Date().toISOString(),
      messageCount: limitedMessages.length,
    });

    return true;
  } catch (error) {
    console.error('Error storing messages:', error);
    return false;
  }
};

/**
 * Get messages for a chat from local storage
 * @param {string|number} chatId - Chat ID
 * @returns {Array} Array of message objects
 */
export const getMessages = async (chatId) => {
  try {
    if (!chatId) {
      throw new Error('Invalid chatId');
    }

    const key = getChatKey(chatId);
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

/**
 * Add a single message to local storage
 * @param {string|number} chatId - Chat ID
 * @param {Object} message - Message object
 */
export const addMessage = async (chatId, message) => {
  try {
    if (!chatId || !message) {
      throw new Error('Invalid chatId or message');
    }

    const existingMessages = await getMessages(chatId);
    
    // Check for duplicates (by id or temporary id)
    const isDuplicate = existingMessages.some(
      (msg) => msg.id === message.id || (message.tempId && msg.tempId === message.tempId)
    );

    if (isDuplicate) {
      return true; // Already exists, no need to add
    }

    const updatedMessages = [...existingMessages, message];
    return await storeMessages(chatId, updatedMessages);
  } catch (error) {
    console.error('Error adding message:', error);
    return false;
  }
};

/**
 * Update a message in local storage (e.g., mark as synced)
 * @param {string|number} chatId - Chat ID
 * @param {string|number} messageId - Message ID or tempId
 * @param {Object} updates - Fields to update
 */
export const updateMessage = async (chatId, messageId, updates) => {
  try {
    if (!chatId || !messageId) {
      throw new Error('Invalid chatId or messageId');
    }

    const messages = await getMessages(chatId);
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId || msg.tempId === messageId) {
        return { ...msg, ...updates };
      }
      return msg;
    });

    return await storeMessages(chatId, updatedMessages);
  } catch (error) {
    console.error('Error updating message:', error);
    return false;
  }
};

/**
 * Delete a message from local storage
 * @param {string|number} chatId - Chat ID
 * @param {string|number} messageId - Message ID
 */
export const deleteMessage = async (chatId, messageId) => {
  try {
    if (!chatId || !messageId) {
      throw new Error('Invalid chatId or messageId');
    }

    const messages = await getMessages(chatId);
    const filteredMessages = messages.filter(
      (msg) => msg.id !== messageId && msg.tempId !== messageId
    );

    return await storeMessages(chatId, filteredMessages);
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

/**
 * Clear all messages for a chat
 * @param {string|number} chatId - Chat ID
 */
export const clearChat = async (chatId) => {
  try {
    if (!chatId) {
      throw new Error('Invalid chatId');
    }

    const key = getChatKey(chatId);
    await AsyncStorage.removeItem(key);

    // Remove from metadata
    await removeChatMetadata(chatId);

    return true;
  } catch (error) {
    console.error('Error clearing chat:', error);
    return false;
  }
};

/**
 * Get metadata for all chats
 * @returns {Object} Chat metadata object
 */
export const getChatMetadata = async () => {
  try {
    const data = await AsyncStorage.getItem(CHAT_METADATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting chat metadata:', error);
    return {};
  }
};

/**
 * Update metadata for a specific chat
 * @param {string|number} chatId - Chat ID
 * @param {Object} metadata - Metadata to store
 */
export const updateChatMetadata = async (chatId, metadata) => {
  try {
    const allMetadata = await getChatMetadata();
    allMetadata[chatId] = {
      ...allMetadata[chatId],
      ...metadata,
    };
    await AsyncStorage.setItem(CHAT_METADATA_KEY, JSON.stringify(allMetadata));
    return true;
  } catch (error) {
    console.error('Error updating chat metadata:', error);
    return false;
  }
};

/**
 * Remove metadata for a specific chat
 * @param {string|number} chatId - Chat ID
 */
export const removeChatMetadata = async (chatId) => {
  try {
    const allMetadata = await getChatMetadata();
    delete allMetadata[chatId];
    await AsyncStorage.setItem(CHAT_METADATA_KEY, JSON.stringify(allMetadata));
    return true;
  } catch (error) {
    console.error('Error removing chat metadata:', error);
    return false;
  }
};

/**
 * Get total storage usage for chats
 * @returns {Object} Storage statistics
 */
export const getStorageStats = async () => {
  try {
    const metadata = await getChatMetadata();
    const chatIds = Object.keys(metadata);
    
    let totalMessages = 0;
    let totalChats = chatIds.length;

    for (const chatId of chatIds) {
      const messages = await getMessages(chatId);
      totalMessages += messages.length;
    }

    return {
      totalChats,
      totalMessages,
      averageMessagesPerChat: totalChats > 0 ? Math.round(totalMessages / totalChats) : 0,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalChats: 0, totalMessages: 0, averageMessagesPerChat: 0 };
  }
};

/**
 * Clear all chat data (use with caution)
 */
export const clearAllChats = async () => {
  try {
    const metadata = await getChatMetadata();
    const chatIds = Object.keys(metadata);

    // Remove all chat message keys
    const removePromises = chatIds.map((chatId) => {
      const key = getChatKey(chatId);
      return AsyncStorage.removeItem(key);
    });

    await Promise.all(removePromises);

    // Clear metadata
    await AsyncStorage.removeItem(CHAT_METADATA_KEY);

    return true;
  } catch (error) {
    console.error('Error clearing all chats:', error);
    return false;
  }
};
