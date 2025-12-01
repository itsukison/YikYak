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
  Keyboard,
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


export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams();
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flatListRef = useRef(null);

  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: messages, isLoading, refetch } = useChatMessagesQuery(chatId, user?.id);
  const sendMessageMutation = useSendMessageMutation();
  const markReadMutation = useMarkMessagesReadMutation();

  // Get other user ID
  const otherUserId = messages && messages.length > 0
    ? messages.find((msg) => msg.sender_id !== user?.id)?.sender_id
    : null;

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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user.id;
    const isPending = !item.synced && item.tempId; // Message not yet synced to database

    return (
      <View
        style={{
          marginBottom: 16,
          paddingHorizontal: 20,
          alignItems: isOwnMessage ? "flex-end" : "flex-start",
        }}
      >
        {isOwnMessage ? (
          // Own message: timestamp on left
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Caption
              color="secondary"
              style={{ marginRight: 8, marginBottom: 2 }}
            >
              {formatTime(item.created_at)}
              {isPending && " • Sending..."}
            </Caption>
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                maxWidth: "75%",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              <Body
                style={{
                  color: colors.primaryText,
                  lineHeight: 22,
                }}
              >
                {item.content}
              </Body>
            </View>
          </View>
        ) : (
          // Other's message: timestamp on right
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <View
              style={{
                backgroundColor: colors.surfaceElevated,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                maxWidth: "75%",
              }}
            >
              <Body
                style={{
                  color: colors.text,
                  lineHeight: 22,
                }}
              >
                {item.content}
              </Body>
            </View>
            <Caption
              color="secondary"
              style={{ marginLeft: 8, marginBottom: 2 }}
            >
              {formatTime(item.created_at)}
            </Caption>
          </View>
        )}
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
          </View>
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
            inverted
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
              backgroundColor: colors.surfaceElevated,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 16,
              color: colors.text,
              marginRight: 12,
              minHeight: 40,
            }}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            style={{
              backgroundColor: message.trim() ? colors.primary : colors.border,
              width: 40,
              height: 40,
              borderRadius: 20,
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
