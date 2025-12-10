import { useState, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../adapters/supabaseClient";
import * as chatStorage from "../storage/chatStorage";
import * as chatMetrics from "../monitoring/chatMetrics";

/**
 * Fetch all chats for the current user
 */
export function useChatsQuery(userId) {
  return useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("chats")
        .select(
          `
          *,
          user1:users!chats_user1_id_fkey(id, nickname, is_anonymous),
          user2:users!chats_user2_id_fkey(id, nickname, is_anonymous),
          messages(content, created_at, is_read, sender_id)
        `
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform data to include other user and last message
      return data
        .map((chat) => {
          // Defensive check: skip chats where user1 or user2 is null (deleted users)
          if (!chat.user1 || !chat.user2) {
            return null;
          }
          const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
          const messages = Array.isArray(chat.messages) ? chat.messages : [];
          const lastMessage =
            messages.length > 0 ? messages[messages.length - 1] : null;
          const unreadCount = messages.filter(
            (msg) => !msg.is_read && msg.sender_id !== userId
          ).length;

          return {
            ...chat,
            otherUser,
            lastMessage,
            unreadCount,
          };
        })
        .filter(Boolean); // Remove null entries from deleted user chats
    },
    enabled: !!userId,
  });
}

/**
 * Fetch messages for a specific chat (with local-first loading)
 */
export function useChatMessagesQuery(chatId, userId) {
  const PAGE_SIZE = 50;
  const [localMessages, setLocalMessages] = useState([]);
  const [loadedFromLocal, setLoadedFromLocal] = useState(false);

  // Load from local storage immediately on mount
  useEffect(() => {
    if (chatId) {
      const startTime = Date.now();
      chatStorage
        .getMessages(chatId)
        .then((messages) => {
          const latency = Date.now() - startTime;
          const validMessages = Array.isArray(messages) ? messages : [];
          chatMetrics.trackMessageLoad("local", latency, validMessages.length);
          setLocalMessages(validMessages);
          setLoadedFromLocal(true);
        })
        .catch((error) => {
          console.error("Error loading from local storage:", error);
          setLocalMessages([]);
          setLoadedFromLocal(true); // Continue anyway
        });
    } else {
      // No chatId, set as loaded with empty messages
      setLocalMessages([]);
      setLoadedFromLocal(true);
    }
  }, [chatId]);

  // Background fetch from database for recent messages (last 30 days)
  const query = useInfiniteQuery({
    queryKey: ["messages", chatId],
    queryFn: async ({ pageParam = 0, signal }) => {
      if (!chatId) throw new Error("Chat ID required");

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Only fetch last 30 days from database
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch from database with pagination
      const startTime = Date.now();
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, nickname, is_anonymous)
        `
        )
        .eq("chat_id", chatId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .range(from, to)
        .abortSignal(signal);

      if (error) throw error;

      // Track metrics
      const latency = Date.now() - startTime;
      chatMetrics.trackMessageLoad("database", latency, data?.length || 0);
      chatMetrics.trackDatabaseCost("read", 1, {
        operation: "message_fetch",
        pageParam,
      });

      // Merge with local storage (background)
      if (data && data.length > 0) {
        // Store in local storage for next time
        Promise.all(
          data.map((msg) =>
            chatStorage.addMessage(chatId, { ...msg, synced: true })
          )
        ).catch((err) => console.error("Error storing to local:", err));
      }

      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Safety check: ensure lastPage exists and is an array
      if (!lastPage || !Array.isArray(lastPage)) return undefined;
      // If the last page has fewer items than PAGE_SIZE, there are no more messages
      if (lastPage.length < PAGE_SIZE) return undefined;
      // Otherwise, the next page is the current number of pages
      return allPages.length;
    },
    enabled: loadedFromLocal && !!chatId, // Only fetch after local load
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combine local messages with query data - override the data property
  const combinedData = useMemo(() => {
    if (!loadedFromLocal) {
      return { pages: [[]], pageParams: [0] };
    }

    const dbMessages = query.data?.pages.flat() || [];
    const dbIds = new Set(dbMessages.map((m) => m.id).filter(Boolean));

    // Local messages that aren't in DB (older than 30 days or pending)
    const localOnly = localMessages.filter((m) => !m.id || !dbIds.has(m.id));

    // Combine and sort
    const allMessages = [...dbMessages, ...localOnly].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return {
      pages: [allMessages], // Single page with all combined messages
      pageParams: query.data?.pageParams || [0],
    };
  }, [localMessages, query.data, loadedFromLocal]);

  // Return query result with overridden data
  return {
    data: combinedData,
    isLoading: !loadedFromLocal || query.isLoading,
    refetch: query.refetch || (() => Promise.resolve()),
    fetchNextPage: query.fetchNextPage || (() => Promise.resolve()),
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage ?? false,
    error: query.error,
    isError: query.isError ?? false,
    // Additional properties for debugging
    localMessages,
    loadedFromLocal,
  };
}
