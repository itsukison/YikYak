import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  Settings,
  HelpCircle,
  LogOut,
  User,
  UserX,
  MapPin,
  Users,
  FileText,
} from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import { useProfileStatsQuery } from "../../utils/queries/profile";
import { useQueryClient } from "@tanstack/react-query";
import AppBackground from "../../components/AppBackground";
import MenuItem from "../../components/MenuItem";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, profile, signOut, updateProfile, updateLocationRadius } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(profile?.is_anonymous || false);
  const [locationRadius, setLocationRadius] = useState(
    profile?.location_radius ? profile.location_radius / 1000 : 5
  );

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  // Fetch real stats from database
  const { data: stats } = useProfileStatsQuery(user?.id);

  // Use real user data from auth
  const currentUser = {
    id: user?.id || "",
    email: user?.email || "",
    nickname: profile?.nickname || "Anonymous User",
    bio: profile?.bio || "No bio yet",
    follower_count: stats?.followerCount || 0,
    following_count: stats?.followingCount || 0,
    post_count: stats?.postCount || 0,
    is_anonymous: profile?.is_anonymous || false,
  };

  // Sync anonymous state with profile when it loads
  React.useEffect(() => {
    if (profile?.is_anonymous !== undefined) {
      setIsAnonymous(profile.is_anonymous);
    }
  }, [profile?.is_anonymous]);

  // Sync location radius with profile when it loads
  React.useEffect(() => {
    if (profile?.location_radius) {
      setLocationRadius(profile.location_radius / 1000);
    }
  }, [profile?.location_radius]);

  if (!fontsLoaded) {
    return null;
  }

  // If no user or profile, show loading (root layout will handle redirect)
  if (!user || !profile) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: colors.text }}>
            Loading profile...
          </Text>
        </View>
      </AppBackground>
    );
  }

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowHeaderBorder(scrollY > 10);
  };

  const handleAnonymousToggle = async () => {
    const newValue = !isAnonymous;
    setIsAnonymous(newValue);

    // Update in Supabase
    const { error } = await updateProfile({
      is_anonymous: newValue,
    });

    if (error) {
      console.error("Error updating profile:", error);
      setIsAnonymous(!newValue);
      Alert.alert("Error", "Failed to update anonymous setting.");
    }
  };

  const handleSettings = () => {
    Alert.alert("Settings", "Settings screen would open here");
  };

  const handleHelp = () => {
    Alert.alert("Help & Support", "Help & Support options would be shown here");
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert("Error", "Failed to sign out");
          } else {
            router.replace("/login");
          }
        },
      },
    ]);
  };

  const handleLocationRadius = () => {
    Alert.alert(
      "Location Radius",
      "Choose how far you want to see posts from your location",
      [
        { 
          text: "2km", 
          onPress: async () => {
            setLocationRadius(2);
            const { error } = await updateLocationRadius(2000);
            if (error) {
              Alert.alert("Error", "Failed to update radius preference");
              setLocationRadius(profile.location_radius / 1000);
            } else {
              queryClient.invalidateQueries({ queryKey: ['posts'] });
            }
          }
        },
        { 
          text: "5km", 
          onPress: async () => {
            setLocationRadius(5);
            const { error } = await updateLocationRadius(5000);
            if (error) {
              Alert.alert("Error", "Failed to update radius preference");
              setLocationRadius(profile.location_radius / 1000);
            } else {
              queryClient.invalidateQueries({ queryKey: ['posts'] });
            }
          }
        },
        { 
          text: "10km", 
          onPress: async () => {
            setLocationRadius(10);
            const { error } = await updateLocationRadius(10000);
            if (error) {
              Alert.alert("Error", "Failed to update radius preference");
              setLocationRadius(profile.location_radius / 1000);
            } else {
              queryClient.invalidateQueries({ queryKey: ['posts'] });
            }
          }
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const accountMenuItems = [
    {
      icon: isAnonymous ? UserX : User,
      title: "Anonymous Mode",
      subtitle: isAnonymous
        ? "You're posting anonymously"
        : "You're posting with your name",
      onPress: handleAnonymousToggle,
      showChevron: false,
      rightComponent: (
        <Switch
          value={isAnonymous}
          onValueChange={handleAnonymousToggle}
          trackColor={{
            false: colors.inputBackground,
            true: colors.primarySubtle,
          }}
          thumbColor={isAnonymous ? colors.primary : "#FFFFFF"}
        />
      ),
    },
    {
      icon: MapPin,
      title: "Location Radius",
      subtitle: `See posts within ${locationRadius}km of your location`,
      onPress: handleLocationRadius,
    },
  ];

  const appMenuItems = [
    {
      icon: Settings,
      title: "Settings",
      subtitle: "Notifications, privacy, and more",
      onPress: handleSettings,
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      subtitle: "Get help or contact us",
      onPress: handleHelp,
    },
    {
      icon: LogOut,
      title: "Sign Out",
      subtitle: "Sign out of your account",
      onPress: handleSignOut,
    },
  ];

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Fixed Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: 16,
          borderBottomWidth: showHeaderBorder ? 1 : 0,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins_600SemiBold",
            fontSize: 28,
            color: colors.text,
            textAlign: "center",
            paddingHorizontal: 16,
          }}
        >
          Profile
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 60, // Account for fixed header
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Header */}
        <View
          style={{
            alignItems: "center",
            marginBottom: 32,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 24,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {/* Profile Avatar */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {isAnonymous ? (
              <UserX size={32} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 28,
                  color: "#FFFFFF",
                }}
              >
                {currentUser.nickname.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* User Name */}
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 22,
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {isAnonymous ? "Anonymous User" : currentUser.nickname}
          </Text>

          {/* User Email/Bio */}
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {isAnonymous ? "Your identity is hidden" : currentUser.bio}
          </Text>

          {/* Stats */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              width: "100%",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                {currentUser.post_count}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Posts
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                {currentUser.following_count}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Following
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                {currentUser.follower_count}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Followers
              </Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingVertical: 8,
            marginBottom: 16,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 16,
                color: colors.text,
              }}
            >
              Account Settings
            </Text>
          </View>

          {accountMenuItems.map((item, index) => (
            <View key={index}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
              >
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
                  <item.icon
                    size={20}
                    color={colors.accent}
                    strokeWidth={1.5}
                  />
                </View>

                {/* Text Content */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                      fontSize: 16,
                      color: colors.text,
                      marginBottom: 2,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 13,
                      color: colors.textSecondary,
                      lineHeight: 18,
                    }}
                  >
                    {item.subtitle}
                  </Text>
                </View>

                {/* Right Component */}
                {item.rightComponent ? (
                  item.rightComponent
                ) : item.showChevron !== false ? (
                  <TouchableOpacity onPress={item.onPress}>
                    <Text
                      style={{
                        fontFamily: "Poppins_500Medium",
                        fontSize: 14,
                        color: colors.primary,
                      }}
                    >
                      Change
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {index < accountMenuItems.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginLeft: 68,
                  }}
                />
              )}
            </View>
          ))}
        </View>

        {/* App Settings */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingVertical: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {appMenuItems.map((item, index) => (
            <MenuItem
              key={index}
              Icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={item.onPress}
              showDivider={index < appMenuItems.length - 1}
            />
          ))}
        </View>

        {/* App Version */}
        <View
          style={{
            alignItems: "center",
            marginTop: 32,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
              color: colors.textTertiary,
              letterSpacing: 0.5,
            }}
          >
            YikYak Japan v1.0.0
          </Text>
        </View>
      </ScrollView>
    </AppBackground>
  );
}
