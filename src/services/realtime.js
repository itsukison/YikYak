import { supabase } from '../adapters/supabaseClient';
import ngeohash from 'ngeohash';

// Subscribe to new posts within a radius (filtered by geohash)
export function subscribeToNewPosts(latitude, longitude, callback) {
  if (!latitude || !longitude) return () => { };

  // Calculate geohash (precision 6 is ~1.2km x 0.6km)
  // We subscribe to the user's cell + 8 neighbors to ensure coverage
  const centerHash = ngeohash.encode(latitude, longitude, 6);
  const neighbors = ngeohash.neighbors(centerHash);
  const relevantHashes = [centerHash, ...neighbors];

  // We need to create a filter string like 'geohash_6=in.(val1,val2,...)'
  // Supabase realtime filter syntax is limited. 'in' might not worked well with realtime in the past,
  // but 'eq' works. For now, let's try subscribing to the channel with a filter.
  // Actually, Supabase Realtime 'postgres_changes' filter supports simple 'column=eq.value'.
  // It does NOT support 'in'.
  // We have to use a workaround: either listen to all and filter client side (which we are moving away from),
  // OR open multiple channels (one per hash). 9 channels is fine.

  const channels = relevantHashes.map(hash => {
    return supabase
      .channel(`posts-geohash-${hash}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `geohash_6=eq.${hash}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  });

  return () => {
    channels.forEach(channel => supabase.removeChannel(channel));
  };
}

// Subscribe to messages in a chat
export function subscribeToMessages(chatId, callback) {
  const channel = supabase
    .channel(`messages-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
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
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
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
