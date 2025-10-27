import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
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

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams();
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flatListRef = useRef(null);

  const [message, setMessage] = useState("");

  const { data: messages, isLoading } = useChatMessagesQuery(chatId);
  const sendMessageMutation = useSendMessageMutation();
  const markReadMutation = useMarkMessagesReadMutation();

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
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage("");

    try {
      await sendMessageMutation.mutateAsync({
        chatId,
        senderId: user.id,
        content: messageText,
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(messageText); // Restore message on error
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user.id;
    const showSenderName = !isOwnMessage && (index === 0 || messages[index - 1].sender_id !== item.sender_id);
    const displayName = item.sender.is_anonymous ? "Anonymous" : item.sender.nickname || "User";

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
          <Caption
            style={{
              color: isOwnMessage 
                ? (isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)")
                : colors.textSecondary,
              marginTop: 4,
            }}
          >
            {formatTime(item.created_at)}
          </Caption>
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
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Heading variant="h2" style={{ flex: 1 }}>
            {otherUserName}
          </Heading>
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
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
              <Send size={20} color={colors.primaryText} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
