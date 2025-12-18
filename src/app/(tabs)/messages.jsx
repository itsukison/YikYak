import React, { useEffect } from "react";
import { View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { UserPlus, MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import AppBackground from "../../ui/components/AppBackground";
import EmptyState from "../../ui/components/EmptyState";
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import { useChatsQuery } from "../../services/chat/useChat";
import { subscribeToMessages } from "../../services/realtime";
import { useQueryClient } from "@tanstack/react-query";
import { Container, Heading, Body, Caption, Card, Avatar, Badge } from "../../ui/components/ui";
import { useMultiplePresence } from "../../services/presence/usePresence";
import { useLanguageStore } from "../../services/i18n/languageStore";

export default function MessagesScreen() {
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();

  const { data: chats, isLoading } = useChatsQuery(user?.id);

  // Track online status for all chat participants
  const otherUserIds = chats?.map((chat) => chat.otherUser.id) || [];
  const { onlineUsers } = useMultiplePresence(otherUserIds);

  // Subscribe to new messages for all chats
  useEffect(() => {
    if (!chats || chats.length === 0) return;

    const unsubscribers = chats.map((chat) =>
      subscribeToMessages(chat.id, () => {
        // Invalidate chats query to refetch with new message
        queryClient.invalidateQueries(["chats", user?.id]);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [chats, user?.id, queryClient]);

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

  if (isLoading) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppBackground>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />

        {/* Header with Find Users Button */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Heading variant="h1">{t('messages_title')}</Heading>
          <TouchableOpacity
            onPress={() => router.push("/search-users")}
            style={{
              backgroundColor: colors.accentSubtle,
              padding: 12,
              borderRadius: 24,
            }}
          >
            <UserPlus size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <EmptyState
          Icon={MessageCircle}
          title={t('messages_no_dms')}
          description={t('messages_start_chat_desc')}
        />
      </AppBackground>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('messages_just_now');
    if (diffMins < 60) return `${diffMins}m ago`; // TODO: i18n suffix
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderChatItem = ({ item, index }) => {
    const displayName = item.otherUser.is_anonymous
      ? t('profile.anonymous_user')
      : item.otherUser.nickname || "User";
    const lastMessageText = item.lastMessage?.content || "No messages yet";
    const lastMessageTime = item.lastMessage?.created_at
      ? formatTime(item.lastMessage.created_at)
      : "";
    const isOnline = onlineUsers[item.otherUser.id] || false;

    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: `/chat/${item.id}`,
          params: {
            otherUserId: item.otherUser.id,
            otherUserNickname: item.otherUser.nickname,
            otherUserIsAnonymous: item.otherUser.is_anonymous ? 'true' : 'false'
          }
        })}
        style={{
          backgroundColor: "transparent",
          borderBottomWidth: 0.5,
          borderBottomColor: colors.borderLight,
        }}
        activeOpacity={0.7}
      >
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          {/* Avatar with online indicator */}
          <View style={{ position: 'relative', marginRight: 12 }}>
            <Avatar
              name={displayName}
              size="medium"
            />
            {isOnline && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 14,
                  height: 14,
                  borderRadius: radius.avatar,
                  backgroundColor: colors.success,
                  borderWidth: 2,
                  borderColor: colors.background,
                }}
              />
            )}
          </View>

          {/* Chat Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Body weight="semibold">{displayName}</Body>
              {lastMessageTime && (
                <Caption color="secondary">{lastMessageTime}</Caption>
              )}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Caption
                numberOfLines={1}
                color="secondary"
                style={{ flex: 1 }}
              >
                {lastMessageText}
              </Caption>
              {item.unreadCount > 0 && (
                <Badge
                  variant="primary"
                  size="small"
                  style={{ marginLeft: 8 }}
                >
                  {item.unreadCount}
                </Badge>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <Container padding="none">
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Heading variant="h2" weight="semibold">{t('messages_title')}</Heading>
          <TouchableOpacity
            onPress={() => router.push("/search-users")}
            style={{
              backgroundColor: colors.surface,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserPlus size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id.toString()}
        />
      </Container>
    </AppBackground>
  );
}
