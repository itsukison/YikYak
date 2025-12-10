import { supabase } from "../adapters/supabaseClient";
import ngeohash from "ngeohash";

// Helper to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Subscribe to new posts within a radius (optimized with fewer channels)
export function subscribeToNewPosts(latitude, longitude, radius, callback) {
  if (!latitude || !longitude) return () => {};

  // Calculate geohash (precision 6 is ~1.2km x 0.6km)
  // OPTIMIZED: Subscribe to center + 4 cardinal neighbors only (not all 8)
  // This reduces channels from 9 to 5 (44% reduction)
  const centerHash = ngeohash.encode(latitude, longitude, 6);

  // Get only cardinal neighbors (N, S, E, W) for better coverage with fewer channels
  const neighbors = ngeohash.neighbors(centerHash);
  const cardinalNeighbors = [
    neighbors[0], // North
    neighbors[2], // East
    neighbors[4], // South
    neighbors[6], // West
  ];

  const relevantHashes = [centerHash, ...cardinalNeighbors];

  // Connection state tracking
  let isConnected = false;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  const channels = relevantHashes.map((hash) => {
    const channel = supabase
      .channel(`posts-geohash-${hash}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `geohash_6=eq.${hash}`,
        },
        (payload) => {
          const newPost = payload.new;

          // Client-side distance filtering (since we reduced channels)
          // Only callback if post is within actual radius
          if (newPost.latitude && newPost.longitude) {
            const distance = calculateDistance(
              latitude,
              longitude,
              newPost.latitude,
              newPost.longitude
            );

            if (distance <= radius) {
              callback(newPost, distance);
            }
          } else {
            // If no coordinates, pass through (shouldn't happen, but safety)
            callback(newPost, null);
          }
        }
      )
      .subscribe((status) => {
        // Connection state management
        if (status === "SUBSCRIBED") {
          isConnected = true;
          reconnectAttempts = 0;
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          isConnected = false;

          // Attempt reconnection with exponential backoff
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const backoffTime = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              30000
            );
            reconnectAttempts++;

            setTimeout(() => {
              if (!isConnected) {
                console.log(
                  `Reconnecting channel ${hash}, attempt ${reconnectAttempts}`
                );
                channel.subscribe();
              }
            }, backoffTime);
          }
        }
      });

    return channel;
  });

  // Cleanup function
  return () => {
    channels.forEach((channel) => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.error("Error removing channel:", err);
      }
    });
  };
}

// Subscribe to messages in a chat
export function subscribeToMessages(chatId, callback) {
  const channel = supabase
    .channel(`messages-${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to notifications for a user
export function subscribeToNotifications(userId, callback) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
