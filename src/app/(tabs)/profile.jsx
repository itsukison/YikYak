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
        <Heading variant="h1" style={{ textAlign: "center", paddingHorizontal: 16 }}>
          Profile
        </Heading>
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
        <Card style={{ alignItems: "center", marginBottom: 24 }}>
          {/* Profile Avatar */}
          <Avatar
            size="xlarge"
            name={currentUser.nickname}
            style={{ marginBottom: 16 }}
          />

          {/* User Name */}
          <Heading variant="h2" style={{ marginBottom: 4 }}>
            {isAnonymous ? "Anonymous User" : currentUser.nickname}
          </Heading>

          {/* User Email/Bio */}
          <Body variant="small" color="secondary" style={{ textAlign: "center", marginBottom: 20 }}>
            {isAnonymous ? "Your identity is hidden" : currentUser.bio}
          </Body>

          {/* Stats */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              width: "100%",
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ alignItems: "center", flex: 1 }}>
              <Heading variant="h2">{currentUser.post_count}</Heading>
              <Caption color="secondary">Posts</Caption>
            </View>

            <TouchableOpacity
              onPress={() => router.push(`/user/following/${user.id}`)}
              style={{ alignItems: "center", flex: 1 }}
            >
              <Heading variant="h2">
                {currentUser.following_count}
              </Heading>
              <Caption color="secondary">Following</Caption>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/user/followers/${user.id}`)}
              style={{ alignItems: "center", flex: 1 }}
            >
              <Heading variant="h2">
                {currentUser.follower_count}
              </Heading>
              <Caption color="secondary">Followers</Caption>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Account Settings */}
        <Section spacing="md">
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            Account Settings
          </Heading>
          
          <Card style={{ paddingVertical: 8 }}>

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
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={colors.accent}
                  />
                </View>

                {/* Text Content */}
                <View style={{ flex: 1 }}>
                  <Body weight="medium" style={{ marginBottom: 2 }}>
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
                  <TouchableOpacity onPress={item.onPress}>
                    <Body variant="small" weight="medium" style={{ color: colors.primary }}>
                      Change
                    </Body>
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
          </Card>
        </Section>

        {/* App Settings */}
        <Section spacing="md">
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            App Settings
          </Heading>
          
          <Card style={{ paddingVertical: 8 }}>
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
          </Card>
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
