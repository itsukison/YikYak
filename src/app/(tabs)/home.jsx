import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  MapPin,
  User,
  UserX,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Repeat,
  MoreHorizontal,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react-native";
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import { usePostsQuery, useUserVotesQuery } from "../../services/posts/usePosts";
import { useVotePostMutation } from "../../services/posts/usePostActions";
import { subscribeToNewPosts } from "../../services/realtime";
import AppBackground from "../../ui/components/AppBackground";
import { Card, Avatar } from "../../ui/components/ui";
import { Heading, Body, Caption } from "../../ui/components/ui/Text";
import PhotoGrid from "../../ui/components/PhotoGrid";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import PostActionSheet from "../../ui/components/PostActionSheet";
import { debounce } from "lodash";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from "@tanstack/react-query";
import { clearAllChats } from "../../services/storage/chatStorage";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark, spacing } = useTheme();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'popular'
  const [timeFilter, setTimeFilter] = useState("week"); // 'day' | 'week' | 'month'
  const [location, setLocation] = useState(null); // Fresh GPS location
  const [feedLocation, setFeedLocation] = useState(null); // Location used for feed (cached or fresh)
  const [locationError, setLocationError] = useState(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isUsingCachedLocation, setIsUsingCachedLocation] = useState(false);

  // Use profile radius (default to 5000 if not set)
  const locationRadius = profile?.location_radius || 5000;



  // Fetch posts from Supabase
  // Fetch posts from Supabase using feedLocation
  // Note: feedLocation structure should match expo-location object { coords: { latitude, longitude } }
  const { data: posts = [], isLoading, refetch } = usePostsQuery(
    feedLocation?.coords?.latitude,
    feedLocation?.coords?.longitude,
    locationRadius,
    activeTab,
    timeFilter,
    !!feedLocation // Enable query as soon as we have ANY location (cached or fresh)
  );

  // Fetch user's votes
  const { data: userVotes = {} } = useUserVotesQuery(user?.id);

  // Vote mutation
  const votePostMutation = useVotePostMutation();

  // Get location on mount (Cached + Fresh)
  useEffect(() => {
    loadLocationStrategy();
  }, []);

  const loadLocationStrategy = async () => {
    // 1. Try to load cached location immediately
    try {
      const cached = await AsyncStorage.getItem('lastKnownLocation');
      if (cached) {
        const parsedLocation = JSON.parse(cached);
        console.log("Using cached location:", parsedLocation);
        setFeedLocation(parsedLocation);
        setIsUsingCachedLocation(true);
      }
    } catch (e) {
      console.error("Failed to load cached location", e);
    }

    // 2. Fetch fresh location (with timeout)
    getLocationPermission();
  };


  // Refresh posts when radius changes
  useEffect(() => {
    if (feedLocation) {
      refetch();
    }
  }, [locationRadius]);



  // Debounced refetch to prevent flickering/excessive calls
  const debouncedRefetch = React.useCallback(
    debounce(() => {
      refetch();
    }, 1000),
    [refetch]
  );

  // Subscribe to new posts (Scoped by Geohash)
  useEffect(() => {
    // Pass the location to subscription to calculate geohash
    // We use feedLocation to ensure we subscribe even if using cached data
    if (!feedLocation?.coords || !user) return;

    const { latitude, longitude } = feedLocation.coords;

    const unsubscribe = subscribeToNewPosts(latitude, longitude, (newPost) => {
      // Check if post is within radius is handled in subscription/RPC mostly, 
      // but a simple client check or just refetching is fine.
      // The RPC is optimized now, so refetch is cheap.
      debouncedRefetch();
    });

    return () => {
      unsubscribe();
      debouncedRefetch.cancel();
    };
  }, [feedLocation, user, debouncedRefetch]);

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

      // Race condition: Location vs Timeout
      // We want to wait for location, but if it takes too long, we just stick with cache if we have it.
      // However, startAsync doesn't support timeout natively easily without wrapper.
      // We can wrap it.

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error("Location timeout")), 5000)
      );

      try {
        let currentLocation = await Promise.race([locationPromise, timeoutPromise]);

        // If successful, update state and cache
        setLocation(currentLocation);
        setFeedLocation(currentLocation); // Switch to fresh location
        setIsUsingCachedLocation(false);
        setLocationError(null);
        await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(currentLocation));

      } catch (err) {
        console.warn("Location fetch failed or timed out:", err);
        // If we have cached location, we suppress the error from UI or show a toast
        if (!feedLocation) {
          setLocationError("Could not retrieve current location. " + err.message);
        } else {
          // We are still using cached location, maybe show a small indicator?
          // For now, silent fail is better than blocking if we have cache.
        }
      }

    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError(error.message);
      if (!feedLocation) {
        Alert.alert("Error", "Failed to get your location. Please try again.");
      }
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Refresh both location and posts
    await loadLocationStrategy(); // Re-trigger the strategy
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

    // Prevent voting on temporary posts
    if (String(postId).startsWith("temp_")) {
      Alert.alert("Please wait", "Your post is still uploading.");
      return;
    }

    // Optimistic update handled by React Query
    votePostMutation.mutate({
      userId: user.id,
      postId,
      voteType: newVote,
    });
  };

  const handleResetCache = async () => {
    Alert.alert(
      "Reset Chat Cache",
      "This will clear all local chat history. Database messages will remain.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllChats();
              queryClient.invalidateQueries(["messages"]);
              queryClient.invalidateQueries(["chats"]);
              Alert.alert("Success", "Chat cache cleared. Please reload the app if issues persist.");
            } catch (error) {
              console.error("Error clearing cache:", error);
              Alert.alert("Error", "Failed to clear cache");
            }
          }
        }
      ]
    );
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

  const renderPost = (post, index) => {
    const userVote = userVotes[post.id] || null;
    const isLastPost = index === posts.length - 1;

    const navigateToPost = () => {
      router.push({
        pathname: `/post/${post.id}`,
        params: { post: JSON.stringify(post) },
      });
    };

    return (
      <Pressable
        key={post.id}
        onPress={navigateToPost}
        style={({ pressed }) => ({
          backgroundColor: "transparent", // Removed gray background
          paddingHorizontal: 20,
          paddingVertical: 24,
          borderBottomWidth: 0.5, // Very thin separator
          borderBottomColor: colors.borderLight,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {/* Post Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start", // Align to top for better multi-line handling
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {/* Avatar */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (!post.is_anonymous && post.user_id) {
                  router.push(`/user/${post.user_id}`);
                }
              }}
              disabled={post.is_anonymous}
            >
              <Avatar
                name={post.is_anonymous ? "Anonymous" : post.author_nickname || "Unknown"}
                size="small" // 40px
                style={{ marginRight: 12 }} // Gap 12px
              />
            </TouchableOpacity>

            {/* Text Stack */}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (!post.is_anonymous && post.user_id) {
                    router.push(`/user/${post.user_id}`);
                  }
                }}
                disabled={post.is_anonymous}
              >
                <Body weight="bold" style={{ color: colors.text, lineHeight: 20 }}>
                  {post.is_anonymous ? "Anonymous" : post.author_nickname || "Unknown"}
                </Body>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                {post.author_username && !post.is_anonymous && (
                  <Caption color="secondary" style={{ marginRight: 4 }}>
                    @{post.author_username} •
                  </Caption>
                )}
                <Caption color="secondary">
                  {formatTimeAgo(post.created_at)}
                </Caption>
              </View>
            </View>
          </View>

          {/* Location (Optional, kept minimal) */}
          {post.location_name && (
            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
              <MapPin size={12} color={colors.textTertiary} />
              <Caption color="tertiary" style={{ marginLeft: 2 }}>
                {post.location_name}
              </Caption>
            </View>
          )}
        </View>

        {/* Repost Content */}
        {post.repost_of && (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.card,
              padding: 12,
              marginBottom: spacing.md,
              backgroundColor: colors.surface,
            }}
          >
            {post.reposted_post_content ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.surfaceElevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: colors.border
                    }}
                  >
                    {post.reposted_post_is_anonymous ? (
                      <UserX size={12} color={colors.textSecondary} />
                    ) : (
                      <User size={12} color={colors.textSecondary} />
                    )}
                  </View>
                  <Body weight="bold" style={{ fontSize: 13 }}>
                    {post.reposted_post_is_anonymous ? "Anonymous" : post.reposted_post_author || "Unknown"}
                  </Body>
                  <Caption color="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    {formatTimeAgo(post.reposted_post_created_at)}
                  </Caption>
                </View>
                <Body style={{ fontSize: 14, color: colors.textSecondary }}>
                  {post.reposted_post_content}
                </Body>
              </>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "left", padding: spacing.sm, opacity: 0.6 }}>
                <Trash2 size={16} color={colors.textSecondary} />
                <Body style={{ marginLeft: 8, color: colors.textSecondary }}>
                  This post has been deleted
                </Body>
              </View>
            )}
          </View>
        )}

        {/* Post Content */}
        <Body style={{ marginBottom: post.photos?.length > 0 ? spacing.sm : spacing.lg }}>
          {post.content}
        </Body>

        {/* Post Photos */}
        {
          post.photos && post.photos.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <PhotoGrid photos={post.photos} onPress={navigateToPost} />
            </View>
          )
        }

        {/* Post Actions */}
        {/* Post Actions */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Vote Pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
                height: 32,
              }}
            >
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleVote(post.id, 'up');
                }}
                style={{
                  paddingHorizontal: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <ArrowUp
                  size={16}
                  color={userVote === 'up' ? colors.primary : colors.text}
                />
                <Body weight="bold" style={{ marginLeft: 4, color: userVote === 'up' ? colors.primary : userVote === 'down' ? colors.error : colors.text, fontSize: 12 }}>
                  {post.score || 0}
                </Body>
              </TouchableOpacity>

              <View style={{ width: 1, height: 16, backgroundColor: colors.border }} />

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleVote(post.id, 'down');
                }}
                style={{
                  paddingHorizontal: 8,
                  height: "100%",
                  justifyContent: "center",
                }}
              >
                <ArrowDown
                  size={16}
                  color={userVote === 'down' ? colors.error : colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Comment Pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: radius.pill,
                paddingHorizontal: 10,
                height: 32,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MessageCircle size={16} color={colors.text} />
              <Body weight="bold" style={{ marginLeft: 4, color: colors.text, fontSize: 12 }}>
                {post.comment_count || 0}
              </Body>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Repost Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/repost/${post.id}`);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surface,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Repeat size={16} color={colors.text} />
            </TouchableOpacity>

            {/* More Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedPost(post);
                setActionSheetVisible(true);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surface,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MoreHorizontal size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable >
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80, // Extra padding for FAB
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Scrollable Header */}
        <View
          style={{
            backgroundColor: colors.background,
            paddingTop: insets.top + 20,
            paddingBottom: 16,
            paddingHorizontal: 16,
            // Removed borderBottomWidth to keep it clean
          }}
        >
          {/* Title + Toggle Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {/* Left: Title */}
            <TouchableOpacity onPress={handleResetCache} onLongPress={handleResetCache}>
               <Heading variant="h2" weight="semibold">HearSay</Heading>
            </TouchableOpacity>

            {/* Right: New/Popular Toggle - Simplified */}
            <View
              style={{
                flexDirection: "row",
                // Removed container background and border
                padding: 0,
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveTab("new")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor:
                    activeTab === "new" ? colors.surface : "transparent", // Subtle background for active
                }}
              >
                <Body
                  variant="small"
                  weight={activeTab === "new" ? "bold" : "medium"}
                  style={{
                    color: activeTab === "new" ? colors.text : colors.textSecondary,
                  }}
                >
                  New
                </Body>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("popular")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor:
                    activeTab === "popular" ? colors.surface : "transparent",
                }}
              >
                <Body
                  variant="small"
                  weight={activeTab === "popular" ? "bold" : "medium"}
                  style={{
                    color: activeTab === "popular" ? colors.text : colors.textSecondary,
                  }}
                >
                  Popular
                </Body>
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtitle */}
          {(feedLocation || location) && (
            <View>
              <Caption color="secondary" style={{ marginBottom: isUsingCachedLocation ? 4 : 12 }}>
                Posts within {locationRadius / 1000}km
              </Caption>
              {isUsingCachedLocation && (
                <Caption color="tertiary" style={{ marginBottom: 12, fontSize: 11 }}>
                  Using last known location
                </Caption>
              )}
            </View>
          )}

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

          {/* Time Filter - Center, only when Popular */}
          {activeTab === "popular" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              {["day", "week", "month"].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setTimeFilter(filter)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor:
                      timeFilter === filter
                        ? colors.surface
                        : "transparent",
                  }}
                >
                  <Caption
                    weight={timeFilter === filter ? "bold" : "medium"}
                    style={{
                      color: timeFilter === filter ? colors.text : colors.textSecondary,
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
            <MessageCircle size={48} color={colors.primary} />
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
          posts.map((post, index) => renderPost(post, index))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/create-post" })}
        style={{
          position: "absolute",
          bottom: insets.bottom + 0,
          right: 20,
          width: 64,
          height: 64,
          borderRadius: radius.button,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus size={32} color={colors.primaryText} />
      </TouchableOpacity>
      {/* Post Action Sheet */}
      <PostActionSheet
        visible={actionSheetVisible}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />
    </AppBackground>
  );
}
