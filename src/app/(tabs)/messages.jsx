import React, { useEffect } from "react";
import { View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MessageCircle, UserPlus } from "lucide-react-native";
import { useRouter } from "expo-router";
import AppBackground from "../../components/AppBackground";
import EmptyState from "../../components/EmptyState";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import { useChatsQuery } from "../../utils/queries/chats";
import { subscribeToMessages } from "../../utils/realtime";
import { useQueryClient } from "@tanstack/react-query";
import { Container, Heading, Body, Caption, Card, Avatar, Badge } from "../../components/ui";

export default function MessagesScreen() {
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: chats, isLoading } = useChatsQuery(user?.id);

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
          <Heading variant="h1">Messages</Heading>
          <TouchableOpacity
            onPress={() => router.push("/search-users")}
            style={{
              backgroundColor: colors.accentSubtle,
              padding: 12,
              borderRadius: 24,
            }}
          >
            <UserPlus size={20} color={colors.accent} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <EmptyState
          Icon={MessageCircle}
          title="No Direct Messages"
          description="You can message students you follow. Tap the + button above to find users!"
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

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderChatItem = ({ item }) => {
    const displayName = item.otherUser.is_anonymous
      ? "Anonymous"
      : item.otherUser.nickname || "User";
    const lastMessageText = item.lastMessage?.content || "No messages yet";
    const lastMessageTime = item.lastMessage?.created_at
      ? formatTime(item.lastMessage.created_at)
      : "";

    return (
      <Card 
        interactive
        onPress={() => router.push(`/chat/${item.id}`)}
        style={{ marginHorizontal: 20, marginBottom: 12 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Avatar */}
          <Avatar 
            name={displayName}
            size="medium"
            style={{ marginRight: 12 }}
          />

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
                  size="sm"
                  style={{ marginLeft: 8 }}
                >
                  {item.unreadCount}
                </Badge>
              )}
            </View>
          </View>
        </View>
      </Card>
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
          <Heading variant="h1">Messages</Heading>
          <TouchableOpacity
            onPress={() => router.push("/search-users")}
            style={{
              backgroundColor: colors.accentSubtle,
              padding: 12,
              borderRadius: 24,
            }}
          >
            <UserPlus size={20} color={colors.accent} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </Container>
    </AppBackground>
  );
}
