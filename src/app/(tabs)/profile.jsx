import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import { useProfileStatsQuery } from "../../utils/queries/profile";
import { useQueryClient } from "@tanstack/react-query";
import AppBackground from "../../components/AppBackground";
import MenuItem from "../../components/MenuItem";
import { Container, Section, Heading, Body, Caption, Card, Avatar } from "../../components/ui";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { user, profile, signOut, updateProfile, updateLocationRadius } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(profile?.is_anonymous || false);
  const [locationRadius, setLocationRadius] = useState(
    profile?.location_radius ? profile.location_radius / 1000 : 5
  );

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

  // If no user or profile, show loading (root layout will handle redirect)
  if (!user || !profile) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Body>Loading profile...</Body>
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
      icon: isAnonymous ? "person-off" : "person",
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
      icon: "place",
      title: "Location Radius",
      subtitle: `See posts within ${locationRadius}km of your location`,
      onPress: handleLocationRadius,
    },
  ];

  const appMenuItems = [
    {
      icon: "settings",
      title: "Settings",
      subtitle: "Notifications, privacy, and more",
      onPress: handleSettings,
    },
    {
      icon: "help",
      title: "Help & Support",
      subtitle: "Get help or contact us",
      onPress: handleHelp,
    },
    {
      icon: "logout",
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
        <Heading variant="h2" weight="semibold" style={{ textAlign: "left", paddingHorizontal: 20 }}>
          Profile
        </Heading>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 60, // Account for fixed header
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Header */}
        <View style={{
          marginBottom: 24, // Reduced from 32
          paddingHorizontal: 0,
        }}>
          {/* Top Section: Avatar + Name + Stats */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            {/* Profile Avatar */}
            <Avatar
              size="xlarge" // Increased from large
              name={currentUser.nickname}
            />

            {/* Right Column: Name + Stats */}
            <View style={{ flex: 1, marginLeft: 20, justifyContent: "center" }}>
              {/* User Name */}
              <Body weight="bold" style={{ marginBottom: 8, fontSize: 18 }}>
                {isAnonymous ? "Anonymous User" : currentUser.nickname}
              </Body>

              {/* Stats Row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  paddingRight: 20,
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/user/${user.id}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>{currentUser.post_count}</Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>Posts</Caption>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/user/following/${user.id}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>
                    {currentUser.following_count}
                  </Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>Following</Caption>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/user/followers/${user.id}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>
                    {currentUser.follower_count}
                  </Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>Followers</Caption>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* User Email/Bio */}
          <Body variant="small" color="secondary" style={{ textAlign: "left", marginBottom: 16 }}>
            {isAnonymous ? "Your identity is hidden" : currentUser.bio}
          </Body>
        </View>

        {/* Account Settings */}
        <Section spacing="lg">
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            Account Settings
          </Heading>

          <View style={{ marginBottom: 20 }}>
            {accountMenuItems.map((item, index) => (
              <View key={index}>
                <TouchableOpacity
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                    paddingHorizontal: 4,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.borderLight,
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.pill,
                      backgroundColor: colors.surface,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={22}
                      color={colors.text}
                    />
                  </View>

                  {/* Text Content */}
                  <View style={{ flex: 1 }}>
                    <Body weight="bold" style={{ marginBottom: 2 }}>
                      {item.title}
                    </Body>
                    <Caption color="secondary">
                      {item.subtitle}
                    </Caption>
                  </View>

                  {/* Right Component */}
                  {item.rightComponent ? (
                    item.rightComponent
                  ) : item.showChevron !== false ? (
                    <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
                  ) : null}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Section>

        {/* App Settings */}
        <Section spacing="lg">
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            App Settings
          </Heading>

          <View>
            {appMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 4,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.borderLight,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.pill,
                    backgroundColor: colors.surface,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 16,
                  }}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={colors.text}
                  />
                </View>

                {/* Text Content */}
                <View style={{ flex: 1 }}>
                  <Body weight="bold" style={{ marginBottom: 2 }}>
                    {item.title}
                  </Body>
                  <Caption color="secondary">
                    {item.subtitle}
                  </Caption>
                </View>

                <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* App Version */}
        <View
          style={{
            alignItems: "center",
            marginTop: 48,
            marginBottom: 20,
          }}
        >
          <Caption color="tertiary" style={{ letterSpacing: 0.5 }}>
            HearSay Japan v1.0.0
          </Caption>
        </View>
      </ScrollView>
    </AppBackground>
  );
}
