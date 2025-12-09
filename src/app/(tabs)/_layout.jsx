import { Tabs, useRouter } from "expo-router";
import { View } from "react-native";
import { Home, MessageCircle, Bell, User } from "lucide-react-native";
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import { useUnreadCountQuery } from "../../services/notifications/useNotifications";
import { useEffect } from "react";
import { Badge } from "../../ui/components/ui";

export default function TabLayout() {
  const { colors, radius } = useTheme();
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { data: unreadCount } = useUnreadCountQuery(user?.id);

  // Root layout handles auth routing, just show loading if needed
  if (loading || !user) {
    return null;
  }

  // Enforce onboarding
  useEffect(() => {
    if (user && !loading && profile && !profile.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [user, loading, profile]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
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
            <Home size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Bell size={24} color={color} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -10,
                  }}
                >
                  <Badge variant="error" size="small">
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
            <User size={24} color={color} />
          ),
        }}
      />
    </Tabs >
  );
}
