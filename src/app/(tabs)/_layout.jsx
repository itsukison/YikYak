import { Tabs, useRouter } from "expo-router";
import { View } from "react-native";
import { Home, MessageCircle, Bell, User } from "lucide-react-native";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import { useUnreadCountQuery } from "../../utils/queries/notifications";
import { useEffect } from "react";
import { Badge } from "../../components/ui";

export default function TabLayout() {
  const { colors, radius } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: unreadCount } = useUnreadCountQuery(user?.id);

  // Root layout handles auth routing, just show loading if needed
  if (loading || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={24} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={24} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Bell color={color} size={24} strokeWidth={2} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -10,
                  }}
                >
                  <Badge variant="error" size="sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={24} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
