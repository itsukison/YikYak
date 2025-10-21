import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import AppBackground from "../../components/AppBackground";
import EmptyState from "../../components/EmptyState";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import { useChatsQuery } from "../../utils/queries/chats";
import { subscribeToMessages } from "../../utils/realtime";
import { useQueryClient } from "@tanstack/react-query";

export default function MessagesScreen() {
  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: chats, isLoading } = useChatsQuery(user?.id);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

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

  if (!fontsLoaded) {
    return null;
  }

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
        <EmptyState
          Icon={MessageCircle}
          title="No Direct Messages"
          description="You can message students you follow. Follow someone from their posts to start a conversation!"
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
      <TouchableOpacity
        onPress={() => router.push(`/chat/${item.id}`)}
        style={{
          backgroundColor: colors.card,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary + "20",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 20, color: colors.primary }}>
            {displayName[0].toUpperCase()}
          </Text>
        </View>

        {/* Chat Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 16,
                color: colors.text,
              }}
            >
              {displayName}
            </Text>
            {lastMessageTime && (
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {lastMessageTime}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 14,
                color: colors.textSecondary,
                flex: 1,
              }}
            >
              {lastMessageText}
            </Text>
            {item.unreadCount > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 6,
                  marginLeft: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 12,
                    color: "#FFFFFF",
                  }}
                >
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 }}>
        <Text
          style={{
            fontFamily: "Poppins_600SemiBold",
            fontSize: 28,
            color: colors.text,
          }}
        >
          Messages
        </Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </AppBackground>
  );
}
