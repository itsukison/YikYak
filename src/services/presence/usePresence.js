/**
 * Presence Hooks
 * React hooks for tracking and displaying user presence
 */

import { useState, useEffect, useCallback } from 'react';
import * as presenceService from '../../services/presence/presenceService';

/**
 * Hook to track current user's presence
 * Automatically starts tracking on mount and stops on unmount
 * @param {string} userId - Current user ID
 * @param {Object} metadata - Additional metadata
 */
export function useTrackPresence(userId, metadata = {}) {
  useEffect(() => {
    if (!userId) return;

    let cleanup;

    const startTracking = async () => {
      cleanup = await presenceService.trackPresence(userId, metadata);
    };

    startTracking();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [userId, metadata]);
}

/**
 * Hook to check if a user is online
 * @param {string} userId - User ID to check
 * @returns {Object} { online, loading, refresh }
 */
export function useUserOnline(userId) {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkOnline = useCallback(async () => {
    if (!userId) {
      setOnline(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const isOnline = await presenceService.isUserOnline(userId);
      setOnline(isOnline);
    } catch (error) {
      console.error('Error checking online status:', error);
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkOnline();
  }, [checkOnline]);

  return { online, loading, refresh: checkOnline };
}

/**
 * Hook to subscribe to a user's presence changes in real-time
 * @param {string} userId - User ID to watch
 * @returns {Object} { online, loading }
 */
export function useUserPresence(userId) {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOnline(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to presence changes
    const unsubscribe = presenceService.subscribeToUserPresence(
      userId,
      ({ online: isOnline }) => {
        setOnline(isOnline);
        setLoading(false);
      }
    );

    // Initial check
    presenceService.isUserOnline(userId).then((isOnline) => {
      setOnline(isOnline);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { online, loading };
}

/**
 * Hook to get online status for multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Object} { onlineUsers, loading, refresh }
 */
export function useOnlineUsers(userIds) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(true);

  const checkOnlineUsers = useCallback(async () => {
    if (!userIds || userIds.length === 0) {
      setOnlineUsers({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const status = await presenceService.getOnlineUsers(userIds);
      setOnlineUsers(status);
    } catch (error) {
      console.error('Error checking online users:', error);
      setOnlineUsers({});
    } finally {
      setLoading(false);
    }
  }, [userIds]);

  useEffect(() => {
    checkOnlineUsers();
  }, [checkOnlineUsers]);

  return { onlineUsers, loading, refresh: checkOnlineUsers };
}

/**
 * Hook to subscribe to multiple users' presence
 * @param {Array<string>} userIds - Array of user IDs to watch
 * @returns {Object} { onlineUsers, loading }
 */
export function useMultiplePresence(userIds) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setOnlineUsers({});
      setLoading(false);
      return;
    }

    const unsubscribes = [];

    // Subscribe to each user's presence
    userIds.forEach((userId) => {
      const unsubscribe = presenceService.subscribeToUserPresence(
        userId,
        ({ userId: uid, online }) => {
          setOnlineUsers((prev) => ({
            ...prev,
            [uid]: online,
          }));
          setLoading(false);
        }
      );
      unsubscribes.push(unsubscribe);
    });

    // Initial check for all users
    presenceService.getOnlineUsers(userIds).then((status) => {
      setOnlineUsers(status);
      setLoading(false);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [userIds]);

  return { onlineUsers, loading };
}
