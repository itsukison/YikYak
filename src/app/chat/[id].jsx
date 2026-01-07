import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import AppBackground from "../../ui/components/AppBackground";
import { Caption } from "../../ui/components/ui";
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import { useChatMessagesQuery } from "../../services/chat/useChat";
import { useSendMessageMutation, useMarkMessagesReadMutation } from "../../services/chat/useChatActions";
import { subscribeToMessages } from "../../services/realtime";
import { useLanguageStore } from "../../services/i18n/languageStore";

import ChatHeader from "./components/ChatHeader";
import MessageInput from "./components/MessageInput";
import MessageBubble from "./components/MessageBubble";
import SkeletonMessage from "../../ui/components/SkeletonMessage";

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Today";
  } else if (isSameDay(date, yesterday)) {
    return "Yesterday";
  } else if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } else {
    return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  }
};

export default function ChatDetailScreen() {
  const {
    id: chatId,
    otherUserId: paramOtherUserId,
    otherUserNickname: paramOtherUserNickname,
    otherUserIsAnonymous: paramOtherUserIsAnonymous
  } = useLocalSearchParams();

  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef(null);
  const { t } = useLanguageStore();

  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [listHeight, setListHeight] = useState(0);

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useChatMessagesQuery(chatId, user?.id);
  const sendMessageMutation = useSendMessageMutation();
  const markReadMutation = useMarkMessagesReadMutation();

  // Safely extract messages with defensive checks
  // Note: useChatMessagesQuery returns pages as a single array [allMessages], not multiple pages
  const messages = (data?.pages?.[0] || []).filter(Boolean);

  // Get other user ID (prefer param, fallback to messages)
  const otherUserId = paramOtherUserId || (messages && messages.length > 0
    ? messages.find((msg) => msg.sender_id !== user?.id)?.sender_id
    : null);

  // Subscribe to new messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, () => {
      queryClient.invalidateQueries(["messages", chatId]);
    });

    return unsubscribe;
  }, [chatId, queryClient]);

  // Mark messages as read when screen opens
  useEffect(() => {
    if (chatId && user?.id) {
      markReadMutation.mutate({ chatId, userId: user.id });
    }
  }, [chatId, user?.id]);

  if (!user) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppBackground>
    );
  }

  const handleSend = async () => {
    if (!message.trim() || !otherUserId) return;

    const messageText = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      await sendMessageMutation.mutateAsync({
        chatId,
        senderId: user.id,
        content: messageText,
        senderData: {
          id: user.id,
          nickname: user.nickname,
          is_anonymous: user.is_anonymous,
        },
        recipientId: otherUserId,
      });

    } catch (error) {
      console.error("Error sending message:", error);
      // Restore message to input on error
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing messages:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get other user's name for header
  const otherUserName = paramOtherUserNickname
    ? (paramOtherUserIsAnonymous === 'true' ? t('profile.anonymous_user') : paramOtherUserNickname)
    : (messages && messages.length > 0
      ? messages.find((msg) => msg.sender_id !== user.id)?.sender.is_anonymous
        ? t('profile.anonymous_user')
        : messages.find((msg) => msg.sender_id !== user.id)?.sender.nickname || "User"
      : "Chat");

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ChatHeader title={otherUserName} otherUserId={otherUserId} />



        {/* Messages List */}
        {isLoading ? (
          <FlatList
            data={[...Array(12)]} // Show enough items to fill screen
            renderItem={({ index }) => <SkeletonMessage index={index} />}
            keyExtractor={(_, index) => `skeleton-${index}`}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 8,
              flexGrow: 1,
              justifyContent: 'flex-end',
            }}
            inverted // Match real chat behavior
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item, index }) => {
              const nextItem = messages[index + 1];
              const isFirstOfDay = !nextItem || !isSameDay(new Date(item.created_at), new Date(nextItem.created_at));

              return (
                <View>
                  {isFirstOfDay && (
                    <View style={{ alignItems: 'center', marginVertical: 12 }}>
                      <View style={{ backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                        <Caption style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>
                          {formatDate(new Date(item.created_at))}
                        </Caption>
                      </View>
                    </View>
                  )}
                  <MessageBubble item={item} isOwnMessage={item.sender_id === user.id} />
                </View>
              );
            }}
            keyExtractor={(item) => (item.id || item.tempId).toString()}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 8,
              flexGrow: 1,
              justifyContent: 'flex-end' // Always align to bottom since it's inverted
            }}
            onContentSizeChange={(w, h) => setContentHeight(h)}
            onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
            inverted
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}

        <MessageInput
          message={message}
          onChangeText={setMessage}
          onSend={handleSend}
          isSending={isSending}
        />
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
