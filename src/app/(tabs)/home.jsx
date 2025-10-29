import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import { usePostsQuery, useUserVotesQuery, useVotePostMutation } from "../../utils/queries/posts";
import { subscribeToNewPosts } from "../../utils/realtime";
import AppBackground from "../../components/AppBackground";
import { Card } from "../../components/ui";
import { Heading, Body, Caption } from "../../components/ui/Text";
import * as Location from "expo-location";
import { router } from "expo-router";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark, spacing } = useTheme();
  const { user, profile } = useAuth();
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'popular'
  const [timeFilter, setTimeFilter] = useState("week"); // 'day' | 'week' | 'month'
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Use profile radius (default to 5000 if not set)
  const locationRadius = profile?.location_radius || 5000;



  // Fetch posts from Supabase
  const { data: posts = [], isLoading, refetch } = usePostsQuery(
    location?.coords.latitude,
    location?.coords.longitude,
    locationRadius,
    activeTab,
    timeFilter,
    !!location
  );

  // Fetch user's votes
  const { data: userVotes = {} } = useUserVotesQuery(user?.id);

  // Vote mutation
  const votePostMutation = useVotePostMutation();

  // Get location on mount
  useEffect(() => {
    getLocationPermission();
  }, []);

  // Refresh posts when radius changes
  useEffect(() => {
    if (location) {
      refetch();
    }
  }, [locationRadius]);

  // Subscribe to new posts
  useEffect(() => {
    if (!location || !user) return;

    const unsubscribe = subscribeToNewPosts((newPost) => {
      // Check if post is within radius (simple check)
      refetch();
    });

    return unsubscribe;
  }, [location, user, refetch]);

  const getLocationPermission = async () => {
    try {
      setLocationError(null);
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError("Location permission denied");
        Alert.alert(
          "Location Permission",
          "Location access is required to see nearby posts.",
          [{ text: "OK" }]
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);
      setLocationError(null);
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError(error.message);
      Alert.alert("Error", "Failed to get your location. Please try again.");
    }
  };

  const handleRefresh = async () => {
    // Refresh both location and posts
    await getLocationPermission();
    await refetch();
  };

  const handleVote = async (postId, voteType) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to vote");
      return;
    }

    const currentVote = userVotes[postId] || null;
    let newVote = voteType;

    // If clicking the same vote, remove it
    if (currentVote === voteType) {
      newVote = null;
    }

    // Optimistic update handled by React Query
    votePostMutation.mutate({
      userId: user.id,
      postId,
      voteType: newVote,
    });
  };

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowHeaderBorder(scrollY > 10);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const formatDistance = (distance) => {
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const renderPost = (post) => {
    const userVote = userVotes[post.id] || null;

    const navigateToPost = () => {
      router.push({
        pathname: `/post/${post.id}`,
        params: { post: JSON.stringify(post) },
      });
    };

    return (
      <Card
        key={post.id}
        interactive
        onPress={navigateToPost}
        padding="default"
        style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}
      >
        {/* Post Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (!post.is_anonymous && post.user_id) {
                  router.push(`/user/${post.user_id}`);
                }
              }}
              disabled={post.is_anonymous}
            >
              <Body weight="medium" style={{ color: colors.primary }}>
                {post.is_anonymous ? "Anonymous" : post.author_nickname || "Unknown"}
              </Body>
            </TouchableOpacity>
            <Caption color="secondary" style={{ marginLeft: spacing.sm }}>
              • {formatTimeAgo(post.created_at)}
            </Caption>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="place" size={12} color={colors.accent} />
            <Caption color="secondary" style={{ marginLeft: spacing.xs }}>
              {post.location_name || formatDistance(post.distance)}
            </Caption>
          </View>
        </View>

        {/* Post Content */}
        <Body style={{ marginBottom: spacing.lg }}>
          {post.content}
        </Body>

        {/* Post Actions */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleVote(post.id, 1);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.pill,
                backgroundColor:
                  userVote === 1
                    ? colors.accentSubtle
                    : colors.inputBackground,
              }}
            >
              <MaterialIcons
                name="keyboard-arrow-up"
                size={18}
                color={
                  userVote === 1 ? colors.accent : colors.textSecondary
                }
              />
              <Body
                variant="small"
                weight="medium"
                style={{
                  marginLeft: spacing.xs,
                  color: userVote === 1 ? colors.accent : colors.textSecondary
                }}
              >
                {post.score || 0}
              </Body>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleVote(post.id, -1);
              }}
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              <MaterialIcons
                name="keyboard-arrow-down"
                size={18}
                color={userVote === -1 ? colors.error : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              navigateToPost();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
            }}
          >
            <MaterialIcons name="chat-bubble" size={16} color={colors.textSecondary} />
            <Caption color="secondary" style={{ marginLeft: spacing.sm }}>
              {post.comment_count || 0}
            </Caption>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // If no user, show loading (root layout will handle redirect)
  if (!user) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Body>Loading...</Body>
        </View>
      </AppBackground>
    );
  }

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
          paddingHorizontal: 16,
          borderBottomWidth: showHeaderBorder ? 1 : 0,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            marginTop: 20,
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="school" size={28} color={colors.primary} />
            <Heading variant="h1" style={{ marginLeft: 8 }}>
              Campus Feed
            </Heading>
          </View>
          {location && (
            <Caption color="secondary" style={{ marginTop: 2 }}>
              Posts within {locationRadius / 1000}km
            </Caption>
          )}
        </View>

        {/* Show location error */}
        {locationError && (
          <View
            style={{
              backgroundColor: colors.errorSubtle || "#FFE5E5",
              borderRadius: 12,
              padding: 8,
              marginBottom: 12,
            }}
          >
            <Caption style={{ color: colors.error || "#D32F2F" }}>
              📍 {locationError}
            </Caption>
          </View>
        )}

        {/* Tab Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.inputBackground,
            borderRadius: radius.input,
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("new")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderRadius: radius.small,
              backgroundColor:
                activeTab === "new" ? colors.primary : "transparent",
            }}
          >
            <MaterialIcons
              name="access-time"
              size={16}
              color={activeTab === "new" ? colors.primaryText : colors.textSecondary}
            />
            <Body
              variant="small"
              weight="medium"
              style={{
                color: activeTab === "new" ? colors.primaryText : colors.textSecondary,
                marginLeft: 6,
              }}
            >
              New
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("popular")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderRadius: radius.small,
              backgroundColor:
                activeTab === "popular" ? colors.primary : "transparent",
            }}
          >
            <MaterialIcons
              name="trending-up"
              size={16}
              color={activeTab === "popular" ? colors.primaryText : colors.textSecondary}
            />
            <Body
              variant="small"
              weight="medium"
              style={{
                color: activeTab === "popular" ? colors.primaryText : colors.textSecondary,
                marginLeft: 6,
              }}
            >
              Popular
            </Body>
          </TouchableOpacity>
        </View>

        {/* Time Filter - Only visible when Popular tab is active */}
        {activeTab === "popular" && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
              gap: 6,
            }}
          >
            {["day", "week", "month"].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setTimeFilter(filter)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor:
                    timeFilter === filter
                      ? colors.primary
                      : "transparent",
                }}
              >
                <Caption
                  weight="medium"
                  style={{
                    color: timeFilter === filter ? colors.primaryText : colors.textSecondary,
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Caption>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Posts Feed */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + (activeTab === "popular" ? 200 : 160), // Account for fixed header + time filter
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && posts.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 40,
            }}
          >
            <Body color="secondary">
              Loading posts...
            </Body>
          </View>
        ) : posts.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 40,
              paddingHorizontal: 32,
            }}
          >
            <MaterialIcons name="chat-bubble" size={48} color={colors.accent} />
            <Heading
              variant="h2"
              style={{
                textAlign: "center",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No Posts Yet
            </Heading>
            <Body
              color="secondary"
              style={{
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Be the first to share what's happening on campus! Tap the + button
              to create a post.
            </Body>
          </View>
        ) : (
          posts.map(renderPost)
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/create-post" })}
        style={{
          position: "absolute",
          bottom: insets.bottom,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: radius.button,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <MaterialIcons name="add" size={28} color={colors.primaryText} />
      </TouchableOpacity>
    </AppBackground>
  );
}
