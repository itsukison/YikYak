/**
 * Offline Queue Hook
 * Automatically processes queued messages when connection is restored
 */

import { useEffect } from "react";
import { AppState } from "react-native";
import * as offlineQueue from "./offlineQueue";

/**
 * Hook to automatically process offline message queue
 * Processes queue when:
 * - Component mounts (app opened)
 * - App comes to foreground
 * - Network connection is restored (if @react-native-community/netinfo is available)
 */
export function useOfflineQueue() {
  // Process queue on mount
  useEffect(() => {
    const processOnMount = async () => {
      try {
        const queueSize = await offlineQueue.getQueueSize();
        if (queueSize > 0) {
          console.log(
            `[useOfflineQueue] Processing ${queueSize} queued messages on mount`
          );
          const result = await offlineQueue.processQueue();
          if (result.processed > 0) {
            console.log(
              `[useOfflineQueue] Processed ${result.processed} offline messages`
            );
          }
        }
      } catch (error) {
        console.error(
          "[useOfflineQueue] Error processing queue on mount:",
          error
        );
      }
    };

    processOnMount();
  }, []);

  // Process queue when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active") {
          try {
            const queueSize = await offlineQueue.getQueueSize();
            if (queueSize > 0) {
              console.log(
                `[useOfflineQueue] App became active, processing ${queueSize} queued messages`
              );
              const result = await offlineQueue.processQueue();
              if (result.processed > 0) {
                console.log(
                  `[useOfflineQueue] Processed ${result.processed} offline messages`
                );
              }
            }
          } catch (error) {
            console.error(
              "[useOfflineQueue] Error processing queue on foreground:",
              error
            );
          }
        }
      }
    );

    return () => subscription.remove();
  }, []);
}

/**
 * Hook that returns queue management functions
 * @returns {Object} Queue management functions
 */
export function useOfflineQueueManager() {
  const processNow = async () => {
    try {
      const result = await offlineQueue.processQueue();
      return result;
    } catch (error) {
      console.error("[useOfflineQueueManager] Error processing queue:", error);
      return { success: false, error: error.message };
    }
  };

  const getQueueSize = async () => {
    try {
      return await offlineQueue.getQueueSize();
    } catch (error) {
      console.error(
        "[useOfflineQueueManager] Error getting queue size:",
        error
      );
      return 0;
    }
  };

  const clearQueue = async () => {
    try {
      await offlineQueue.clearQueue();
      return { success: true };
    } catch (error) {
      console.error("[useOfflineQueueManager] Error clearing queue:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    processNow,
    getQueueSize,
    clearQueue,
  };
}


