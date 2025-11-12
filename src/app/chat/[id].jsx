import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import AppBackground from "../../components/AppBackground";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import {
  useChatMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesReadMutation,
} from "../../utils/queries/chats";
import { subscribeToMessages } from "../../utils/realtime";
import { useQueryClient } from "@tanstack/react-query";
import { Heading, Body, Caption } from "../../components/ui";
import { useMessageSync } from "../../utils/hooks/useMessageSync";
import { useUserPresence } from "../../utils/hooks/usePresence";

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams();
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flatListRef = useRef(null);

  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: messages, isLoading } = useChatMessagesQuery(chatId, user?.id);
  const sendMessageMutation = useSendMessageMutation();
  const markReadMutation = useMarkMessagesReadMutation();
  const { syncNow } = useMessageSync(chatId, user?.id, !!chatId && !!user?.id);

  // Get other user ID and track their presence
  const otherUserId = messages && messages.length > 0
    ? messages.find((msg) => msg.sender_id !== user?.id)?.sender_id
    : null;
  const { online: recipientOnline } = useUserPresence(otherUserId);

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

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      // Message is still in local storage, so don't restore to input
      // User can see it in the chat with a "pending" indicator if needed
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncNow();
    } catch (error) {
      console.error("Error refreshing messages:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user.id;
    const showSenderName = !isOwnMessage && (index === 0 || messages[index - 1].sender_id !== item.sender_id);
    const displayName = item.sender?.is_anonymous ? "Anonymous" : item.sender?.nickname || "User";
    const isPending = !item.synced && item.tempId; // Message not yet synced to database

    return (
      <View
        style={{
          marginBottom: 16,
          paddingHorizontal: 20,
          alignItems: isOwnMessage ? "flex-end" : "flex-start",
        }}
      >
        {showSenderName && (
          <Caption 
            color="secondary"
            style={{ marginBottom: 4, marginLeft: isOwnMessage ? 0 : 12 }}
          >
            {displayName}
          </Caption>
        )}
        <View
          style={{
            backgroundColor: isOwnMessage ? colors.primary : colors.inputBackground,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 16,
            maxWidth: "75%",
            opacity: isPending ? 0.7 : 1, // Slightly transparent if pending
          }}
        >
          <Body 
            style={{ 
              color: isOwnMessage ? colors.primaryText : colors.text,
              lineHeight: 22,
            }}
          >
            {item.content}
          </Body>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Caption
              style={{
                color: isOwnMessage 
                  ? (isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)")
                  : colors.textSecondary,
              }}
            >
              {formatTime(item.created_at)}
            </Caption>
            {isPending && (
              <Caption
                style={{
                  color: isOwnMessage 
                    ? (isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)")
                    : colors.textSecondary,
                  marginLeft: 6,
                }}
              >
                • Sending...
              </Caption>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Get other user's name for header
  const otherUserName = messages && messages.length > 0
    ? messages.find((msg) => msg.sender_id !== user.id)?.sender.is_anonymous
      ? "Anonymous"
      : messages.find((msg) => msg.sender_id !== user.id)?.sender.nickname || "User"
    : "Chat";

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ 
              marginRight: 12,
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Heading variant="h2">{otherUserName}</Heading>
            {otherUserId && (
              <Caption color="secondary" style={{ marginTop: 2 }}>
                {recipientOnline ? "Online" : "Offline"}
              </Caption>
            )}
          </View>
          {recipientOnline && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#4CAF50",
                marginLeft: 8,
              }}
            />
          )}
        </View>

        {/* Messages List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => (item.id || item.tempId).toString()}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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

        {/* Input Area */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              backgroundColor: colors.inputBackground,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.text,
              marginRight: 12,
              minHeight: 48,
            }}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            style={{
              backgroundColor: message.trim() ? colors.primary : colors.border,
              width: 48,
              height: 48,
              borderRadius: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <MaterialIcons name="send" size={20} color={colors.primaryText} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
