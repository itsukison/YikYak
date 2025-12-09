/**
 * Custom hook for managing message synchronization
 */

import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as messageSync from '../../services/storage/messageSync';

/**
 * Hook to handle automatic message synchronization
 * @param {string|number} chatId - Chat ID to sync
 * @param {string} userId - Current user ID
 * @param {boolean} enabled - Whether sync is enabled
 */
export function useMessageSync(chatId, userId, enabled = true) {
  const queryClient = useQueryClient();

  // Sync messages when app comes to foreground
  useEffect(() => {
    if (!enabled || !chatId || !userId) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, sync messages
        messageSync.syncMessagesFromDatabase(chatId, userId)
          .then((result) => {
            if (result.success && result.newCount > 0) {
              // Invalidate query to trigger re-render with new messages
              queryClient.invalidateQueries(['messages', chatId]);
            }
          })
          .catch((error) => {
            console.error('Foreground sync failed:', error);
          });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [chatId, userId, enabled, queryClient]);

  // Manual sync function
  const syncNow = useCallback(async () => {
    if (!chatId || !userId) return { success: false, error: 'Invalid parameters' };

    try {
      const result = await messageSync.fullSync(chatId, userId);
      
      if (result.success) {
        // Invalidate query to show updated messages
        queryClient.invalidateQueries(['messages', chatId]);
      }

      return result;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return { success: false, error: error.message };
    }
  }, [chatId, userId, queryClient]);

  return { syncNow };
}

/**
 * Hook to sync unsynced messages periodically
 * @param {number} intervalMs - Sync interval in milliseconds (default: 30 seconds)
 */
export function usePeriodicSync(intervalMs = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncAllChats = async () => {
      try {
        // Get all chats from query cache
        const chatsData = queryClient.getQueryData(['chats']);
        
        if (!chatsData || !Array.isArray(chatsData)) return;

        // Sync each chat
        for (const chat of chatsData) {
          await messageSync.syncMessagesToDatabase(chat.id);
        }
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    };

    // Initial sync
    syncAllChats();

    // Set up interval
    const interval = setInterval(syncAllChats, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, queryClient]);
}
