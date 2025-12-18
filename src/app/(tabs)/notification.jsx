import React, { useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ArrowUp, MessageCircle, UserPlus, Mail, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import AppBackground from "../../ui/components/AppBackground";
import EmptyState from "../../ui/components/EmptyState";
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import { useNotificationsQuery } from "../../services/notifications/useNotifications";
import {
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
} from "../../services/notifications/useNotificationActions";
import { subscribeToNotifications } from "../../services/realtime";
import { useQueryClient } from "@tanstack/react-query";
import { Container, Heading, Body, Caption, Card, Button, Avatar } from "../../ui/components/ui";
import { useLanguageStore } from "../../services/i18n/languageStore";

export default function NotificationScreen() {
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();

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
        return ArrowUp;
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
    const actorName = notification.actor_name || t('profile.anonymous_user');

    switch (notification.type) {
      case "vote":
        return `${actorName} ${t('notification_vote')}`;
      case "comment":
        return `${actorName} ${t('notification_comment')}`;
      case "follow":
        return `${actorName} ${t('notification_follow')}`;
      case "message":
        return `${actorName} ${t('notification_message')}`;
      default:
        return t('notifications_title');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('messages_just_now');
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
          title={t('notifications_no_data')}
          description={t('notifications_desc')}
        />
      </AppBackground>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderNotification = ({ item }) => {
    const IconComponent = getNotificationIcon(item.type);
    const notificationText = getNotificationText(item);

    // Determine avatar name (use actor name or "System")
    const avatarName = item.actor_name || "System";

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        style={{
          backgroundColor: item.is_read ? "transparent" : colors.primarySubtle,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.borderLight,
        }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {/* Avatar */}
          <View style={{ marginRight: 12, position: 'relative' }}>
            <Avatar
              name={avatarName}
              size="medium"
            />
            {/* Type Icon Badge */}
            <View
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                backgroundColor: colors.primary,
                borderRadius: 10,
                width: 20,
                height: 20,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <IconComponent size={12} color="#173300" />
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Body
              weight={item.is_read ? "regular" : "semibold"}
              style={{ marginBottom: 4, lineHeight: 20 }}
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
                borderRadius: radius.avatar,
                backgroundColor: colors.primary,
                marginLeft: 8,
                marginTop: 6,
              }}
            />
          )}
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
          <Heading variant="h2" weight="semibold">{t('notifications_title')}</Heading>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="small"
              onPress={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              {t('notifications_mark_all_read')}
            </Button>
          )}
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
        />
      </Container>
    </AppBackground>
  );
}
