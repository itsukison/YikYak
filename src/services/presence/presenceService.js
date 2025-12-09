/**
 * Presence Service
 * Tracks user online/offline status using Supabase Realtime Presence
 */

import { supabase } from '../../adapters/supabaseClient';

// Active presence channels by user
const activeChannels = new Map();

// Presence state cache
const presenceCache = new Map();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

// Presence timeout (5 minutes)
const PRESENCE_TIMEOUT = 5 * 60 * 1000;

/**
 * Track user's online presence
 * @param {string} userId - User ID to track
 * @param {Object} metadata - Additional metadata (deviceId, etc.)
 * @returns {Function} Cleanup function
 */
export const trackPresence = async (userId, metadata = {}) => {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    // Create a unique channel for this user's presence
    const channelName = `presence:${userId}`;

    // Check if already tracking
    if (activeChannels.has(userId)) {
      console.log('Already tracking presence for user:', userId);
      return activeChannels.get(userId).cleanup;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Track presence state
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

    // Subscribe to channel
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track this user's presence
        const presenceData = {
          user_id: userId,
          online_at: new Date().toISOString(),
          ...metadata,
        };

        await channel.track(presenceData);
        console.log('Presence tracked for user:', userId);
      }
    });

    // Set up heartbeat to keep presence alive
    const heartbeatInterval = setInterval(async () => {
      try {
        const presenceData = {
          user_id: userId,
          online_at: new Date().toISOString(),
          ...metadata,
        };
        await channel.track(presenceData);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, HEARTBEAT_INTERVAL);

    // Cleanup function
    const cleanup = async () => {
      clearInterval(heartbeatInterval);
      await channel.untrack();
      await supabase.removeChannel(channel);
      activeChannels.delete(userId);
      console.log('Presence tracking stopped for user:', userId);
    };

    // Store channel reference
    activeChannels.set(userId, { channel, cleanup, heartbeatInterval });

    return cleanup;
  } catch (error) {
    console.error('Error tracking presence:', error);
    return () => { }; // Return no-op cleanup
  }
};

/**
 * Check if a user is currently online
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} Whether user is online
 */
export const isUserOnline = async (userId) => {
  try {
    if (!userId) return false;

    // Check cache first
    const cached = presenceCache.get(userId);
    if (cached && Date.now() - cached.timestamp < PRESENCE_TIMEOUT) {
      return cached.online;
    }

    // Subscribe to user's presence channel temporarily
    const channelName = `presence:${userId}`;
    const channel = supabase.channel(channelName);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        supabase.removeChannel(channel);
        presenceCache.set(userId, { online: false, timestamp: Date.now() });
        resolve(false);
      }, 3000); // 3 second timeout

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const isOnline = Object.keys(state).length > 0;

          clearTimeout(timeout);
          supabase.removeChannel(channel);

          // Cache result
          presenceCache.set(userId, { online: isOnline, timestamp: Date.now() });
          resolve(isOnline);
        })
        .subscribe();
    });
  } catch (error) {
    console.error('Error checking user presence:', error);
    return false;
  }
};

/**
 * Subscribe to a user's presence changes
 * @param {string} userId - User ID to watch
 * @param {Function} callback - Callback with online status
 * @returns {Function} Cleanup function
 */
export const subscribeToUserPresence = (userId, callback) => {
  try {
    if (!userId || !callback) {
      throw new Error('User ID and callback required');
    }

    const channelName = `presence:${userId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isOnline = Object.keys(state).length > 0;
        callback({ userId, online: isOnline, state });
      })
      .on('presence', { event: 'join' }, () => {
        callback({ userId, online: true });
      })
      .on('presence', { event: 'leave' }, () => {
        callback({ userId, online: false });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Error subscribing to presence:', error);
    return () => { }; // Return no-op cleanup
  }
};

/**
 * Get all online users in a list
 * @param {Array<string>} userIds - Array of user IDs to check
 * @returns {Promise<Object>} Map of userId -> online status
 */
export const getOnlineUsers = async (userIds) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return {};
    }

    const onlineStatus = {};

    // Check each user (in parallel)
    await Promise.all(
      userIds.map(async (userId) => {
        onlineStatus[userId] = await isUserOnline(userId);
      })
    );

    return onlineStatus;
  } catch (error) {
    console.error('Error getting online users:', error);
    return {};
  }
};

/**
 * Stop tracking presence for a user
 * @param {string} userId - User ID
 */
export const stopTracking = async (userId) => {
  try {
    const channelData = activeChannels.get(userId);
    if (channelData) {
      await channelData.cleanup();
    }
  } catch (error) {
    console.error('Error stopping presence tracking:', error);
  }
};

/**
 * Stop all presence tracking (on logout)
 */
export const stopAllTracking = async () => {
  try {
    const cleanupPromises = Array.from(activeChannels.values()).map(
      (data) => data.cleanup()
    );
    await Promise.all(cleanupPromises);
    activeChannels.clear();
    presenceCache.clear();
  } catch (error) {
    console.error('Error stopping all tracking:', error);
  }
};

/**
 * Clear presence cache
 */
export const clearCache = () => {
  presenceCache.clear();
};
