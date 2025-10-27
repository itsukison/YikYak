import React, { useEffect } from "react";
import {
  View,
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
import { Container, Heading, Body, Caption, Card, Button } from "../../components/ui";

export default function NotificationScreen() {
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useNotificationsQuery(user?.id);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  // Subscribe to new notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, () => {
      queryClient.invalidateQueries(["notifications", user.id]);
      queryClient.invalidateQueries(["notifications-unread-count", user.id]);
    });

    return unsubscribe;
  }, [user?.id, queryClient]);

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
      <Card
        interactive
        onPress={() => handleNotificationPress(item)}
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          backgroundColor: item.is_read ? colors.surface : colors.accentSubtle,
          borderLeftWidth: 3,
          borderLeftColor: item.is_read ? "transparent" : colors.accent,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Icon */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.inputBackground,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Icon size={20} color={colors.accent} strokeWidth={2} />
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Body 
              weight={item.is_read ? "regular" : "semibold"}
              style={{ marginBottom: 4 }}
            >
              {notificationText}
            </Body>

            {/* Preview text for comments */}
            {item.type === "comment" && item.comment?.content && (
              <Caption 
                numberOfLines={1}
                color="secondary"
                style={{ marginBottom: 4 }}
              >
                "{item.comment.content}"
              </Caption>
            )}

            <Caption color="secondary">
              {formatTime(item.created_at)}
            </Caption>
          </View>

          {/* Unread indicator */}
          {!item.is_read && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.accent,
                marginLeft: 8,
              }}
            />
          )}
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
          <Heading variant="h1">Notifications</Heading>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="small"
              onPress={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </Container>
    </AppBackground>
  );
}
