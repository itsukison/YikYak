import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  Bell,
  ArrowBigUp,
  MessageCircle,
  UserPlus,
  Mail,
} from "lucide-react-native";
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
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
} from "../../utils/queries/notifications";
import { subscribeToNotifications } from "../../utils/realtime";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationScreen() {
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useNotificationsQuery(user?.id);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Subscribe to new notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, () => {
      queryClient.invalidateQueries(["notifications", user.id]);
      queryClient.invalidateQueries(["notifications-unread-count", user.id]);
    });

    return unsubscribe;
  }, [user?.id, queryClient]);

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

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markReadMutation.mutate({ notificationId: notification.id });
    }

    // Navigate based on type
    switch (notification.type) {
      case "vote":
      case "comment":
        if (notification.post_id) {
          router.push(`/post/${notification.post_id}`);
        }
        break;
      case "follow":
        if (notification.actor_id) {
          router.push(`/user/${notification.actor_id}`);
        }
        break;
      case "message":
        // Navigate to messages tab
        router.push("/(tabs)/messages");
        break;
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate({ userId: user.id });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "vote":
        return ArrowBigUp;
      case "comment":
        return MessageCircle;
      case "follow":
        return UserPlus;
      case "message":
        return Mail;
      default:
        return Bell;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "vote":
        return `${notification.actor_name} upvoted your post`;
      case "comment":
        return `${notification.actor_name} commented on your post`;
      case "follow":
        return `${notification.actor_name} started following you`;
      case "message":
        return `${notification.actor_name} sent you a message`;
      default:
        return "New notification";
    }
  };

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

  if (!notifications || notifications.length === 0) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <EmptyState
          Icon={Bell}
          title="No Notifications"
          description="You'll see notifications here when someone votes on your posts, comments, or follows you!"
        />
      </AppBackground>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderNotification = ({ item }) => {
    const Icon = getNotificationIcon(item.type);
    const notificationText = getNotificationText(item);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        style={{
          backgroundColor: item.is_read ? colors.card : colors.primarySubtle,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: radius.card,
          flexDirection: "row",
          alignItems: "center",
          borderLeftWidth: 3,
          borderLeftColor: item.is_read ? "transparent" : colors.primary,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.avatar,
            backgroundColor: colors.primarySubtle,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Icon size={20} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: item.is_read
                ? "Poppins_400Regular"
                : "Poppins_600SemiBold",
              fontSize: 14,
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {notificationText}
          </Text>

          {/* Preview text for comments */}
          {item.type === "comment" && item.comment?.content && (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 13,
                color: colors.textSecondary,
                marginBottom: 4,
              }}
            >
              "{item.comment.content}"
            </Text>
          )}

          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>

        {/* Unread indicator */}
        {!item.is_read && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
              marginLeft: 8,
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins_600SemiBold",
            fontSize: 28,
            color: colors.text,
          }}
        >
          Notifications
        </Text>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 14,
                color: colors.primary,
              }}
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </AppBackground>
  );
}
