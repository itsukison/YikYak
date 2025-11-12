/**
 * Storage Debug Utilities
 * Helper functions for testing and debugging local storage
 */

import * as chatStorage from './chatStorage';
import * as messageSync from './messageSync';

/**
 * Log all stored chats and their message counts
 */
export const logStorageStatus = async () => {
  try {
    const stats = await chatStorage.getStorageStats();
    const metadata = await chatStorage.getChatMetadata();

    console.log('=== Local Storage Status ===');
    console.log('Total Chats:', stats.totalChats);
    console.log('Total Messages:', stats.totalMessages);
    console.log('Average Messages per Chat:', stats.averageMessagesPerChat);
    console.log('\nChat Details:');

    for (const [chatId, meta] of Object.entries(metadata)) {
      const messages = await chatStorage.getMessages(chatId);
      const unsyncedCount = messages.filter((m) => !m.synced).length;

      console.log(`\nChat ${chatId}:`);
      console.log(`  - Total Messages: ${messages.length}`);
      console.log(`  - Unsynced: ${unsyncedCount}`);
      console.log(`  - Last Updated: ${meta.lastUpdated}`);
    }

    console.log('===========================');

    return stats;
  } catch (error) {
    console.error('Error logging storage status:', error);
    return null;
  }
};

/**
 * Test local storage by creating a mock message
 */
export const testLocalStorage = async () => {
  try {
    const testChatId = 'test_chat_123';
    const testMessage = {
      id: 'test_msg_1',
      chat_id: testChatId,
      sender_id: 'test_user',
      content: 'Test message',
      created_at: new Date().toISOString(),
      synced: true,
    };

    console.log('Testing local storage...');

    // Store message
    const storeResult = await chatStorage.addMessage(testChatId, testMessage);
    console.log('Store result:', storeResult);

    // Retrieve message
    const messages = await chatStorage.getMessages(testChatId);
    console.log('Retrieved messages:', messages);

    // Update message
    const updateResult = await chatStorage.updateMessage(
      testChatId,
      testMessage.id,
      { content: 'Updated test message' }
    );
    console.log('Update result:', updateResult);

    // Verify update
    const updatedMessages = await chatStorage.getMessages(testChatId);
    console.log('Updated messages:', updatedMessages);

    // Clean up
    await chatStorage.clearChat(testChatId);
    console.log('Test completed and cleaned up');

    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
};

/**
 * Force sync all unsynced messages
 */
export const forceSyncAll = async () => {
  try {
    const metadata = await chatStorage.getChatMetadata();
    const chatIds = Object.keys(metadata);

    console.log(`Syncing ${chatIds.length} chats...`);

    const results = [];

    for (const chatId of chatIds) {
      const result = await messageSync.syncMessagesToDatabase(chatId);
      results.push({ chatId, ...result });
      console.log(`Chat ${chatId}:`, result);
    }

    const totalSynced = results.reduce((sum, r) => sum + (r.syncedCount || 0), 0);
    console.log(`\nTotal messages synced: ${totalSynced}`);

    return results;
  } catch (error) {
    console.error('Force sync failed:', error);
    return null;
  }
};

/**
 * Clear all local storage (for testing/debugging)
 */
export const clearAllStorage = async () => {
  try {
    console.log('Clearing all local storage...');
    await chatStorage.clearAllChats();
    console.log('All storage cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
};

/**
 * Export storage data for debugging
 */
export const exportStorageData = async () => {
  try {
    const metadata = await chatStorage.getChatMetadata();
    const chatIds = Object.keys(metadata);
    const exportData = {};

    for (const chatId of chatIds) {
      const messages = await chatStorage.getMessages(chatId);
      exportData[chatId] = {
        metadata: metadata[chatId],
        messages,
      };
    }

    console.log('Storage Export:', JSON.stringify(exportData, null, 2));
    return exportData;
  } catch (error) {
    console.error('Export failed:', error);
    return null;
  }
};
