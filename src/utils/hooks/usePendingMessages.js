/**
 * Pending Messages Hook
 * Syncs pending messages when user comes online
 */

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as messageRouter from '../../services/messaging/messageRouter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_KEY = 'last_seen_timestamp';

/**
 * Hook to sync pending messages when app comes to foreground
 * @param {string} userId - Current user ID
 * @param {boolean} enabled - Whether sync is enabled
 */
export function usePendingMessages(userId, enabled = true) {
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);
  const lastSyncRef = useRef(null);

  useEffect(() => {
    if (!enabled || !userId) return;

    const syncPendingMessages = async () => {
      try {
        // Get last seen timestamp
        const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
        
        console.log('Syncing pending messages since:', lastSeen);

        // Fetch and sync pending messages
        const result = await messageRouter.syncPendingMessages(userId, lastSeen);

        if (result.success && result.totalMessages > 0) {
          console.log(`Synced ${result.totalMessages} pending messages from ${result.chatsUpdated} chats`);

          // Invalidate queries to show new messages
          queryClient.invalidateQueries(['chats']);
          queryClient.invalidateQueries(['messages']);
        }

        // Update last seen timestamp
        await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
        lastSyncRef.current = Date.now();
      } catch (error) {
        console.error('Error syncing pending messages:', error);
      }
    };

    // Sync on mount (app opened)
    syncPendingMessages();

    // Sync when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground
        const timeSinceLastSync = lastSyncRef.current
          ? Date.now() - lastSyncRef.current
          : Infinity;

        // Only sync if it's been more than 30 seconds since last sync
        if (timeSinceLastSync > 30000) {
          syncPendingMessages();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userId, enabled, queryClient]);
}

/**
 * Hook to update last seen timestamp when app goes to background
 * @param {string} userId - Current user ID
 */
export function useUpdateLastSeen(userId) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!userId) return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background, update last seen
        try {
          await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
          console.log('Updated last seen timestamp');
        } catch (error) {
          console.error('Error updating last seen:', error);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userId]);
}
