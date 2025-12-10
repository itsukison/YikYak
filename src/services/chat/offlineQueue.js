/**
 * Offline Message Queue
 * Handles queuing and processing of messages sent while offline
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../adapters/supabaseClient";
import * as chatStorage from "../storage/chatStorage";

const QUEUE_KEY = "offline_message_queue";

/**
 * Get the offline message queue
 * @returns {Promise<Array>} Queue of pending messages
 */
export async function getQueue() {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error getting offline queue:", error);
    return [];
  }
}

/**
 * Add a message to the offline queue
 * @param {Object} message - Message to queue
 */
export async function addToQueue(message) {
  try {
    const queue = await getQueue();
    queue.push({ ...message, queuedAt: new Date().toISOString() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(
      `[Offline Queue] Added message to queue. Queue size: ${queue.length}`
    );
  } catch (error) {
    console.error("Error adding to offline queue:", error);
  }
}

/**
 * Process the offline message queue
 * Sends all queued messages when connection is restored
 * @returns {Promise<Object>} Result with processed and failed counts
 */
export async function processQueue() {
  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    console.log(`[Offline Queue] Processing ${queue.length} queued messages`);

    let processed = 0;
    const failed = [];

    for (const msg of queue) {
      try {
        // Insert to database
        const { data, error } = await supabase
          .from("messages")
          .insert({
            chat_id: msg.chat_id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
          })
          .select(
            `
            *,
            sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
          `
          )
          .single();

        if (error) throw error;

        // Update local storage with real ID
        if (msg.tempId) {
          await chatStorage.updateMessage(msg.chat_id, msg.tempId, {
            ...data,
            synced: true,
            tempId: undefined,
          });
        }

        // Update chat timestamp
        await supabase
          .from("chats")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", msg.chat_id);

        processed++;
        console.log(
          `[Offline Queue] Successfully sent queued message ${
            msg.tempId || msg.id
          }`
        );
      } catch (error) {
        console.error("Failed to send queued message:", error);
        failed.push(msg);
      }
    }

    // Save failed messages back to queue
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));

    console.log(
      `[Offline Queue] Processed: ${processed}, Failed: ${failed.length}`
    );
    return { success: true, processed, failed: failed.length };
  } catch (error) {
    console.error("Error processing offline queue:", error);
    return { success: false, error: error.message, processed: 0, failed: 0 };
  }
}

/**
 * Clear the offline message queue
 */
export async function clearQueue() {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log("[Offline Queue] Queue cleared");
  } catch (error) {
    console.error("Error clearing offline queue:", error);
  }
}

/**
 * Get queue size
 * @returns {Promise<number>} Number of messages in queue
 */
export async function getQueueSize() {
  try {
    const queue = await getQueue();
    return queue.length;
  } catch (error) {
    console.error("Error getting queue size:", error);
    return 0;
  }
}
