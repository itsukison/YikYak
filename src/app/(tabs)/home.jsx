import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Pressable,
  ActivityIndicator,
  Platform,
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
import AppBackground from "../../ui/components/AppBackground";
import { Card, Avatar } from "../../ui/components/ui";
import { Heading, Body, Caption } from "../../ui/components/ui/Text";
import PhotoGrid from "../../ui/components/PhotoGrid";
import { router } from "expo-router";
import PostActionSheet from "../../ui/components/PostActionSheet";
import SkeletonPost from "../../ui/components/SkeletonPost";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from "@tanstack/react-query";
import LocationPermissionPrimer from "../../ui/components/LocationPermissionPrimer";
import { useLanguageStore } from "../../services/i18n/languageStore";
import { getRadiusLabel } from "../../services/location/locationRadius";

// Platform-specific imports for native modules
// On mobile: use native expo modules
// On web: these will be null and we'll use browser APIs
const Location = Platform.OS === 'web' ? null : require('expo-location');
const Haptics = Platform.OS === 'web' ? null : require('expo-haptics');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark, spacing } = useTheme();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'popular'
  const [timeFilter, setTimeFilter] = useState("week"); // 'day' | 'week' | 'month'
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLocationPrimerVisible, setIsLocationPrimerVisible] = useState(false);

  // Simplified location state
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [locationError, setLocationError] = useState(null);



  // Use profile radius (default to 5000 if not set)
  const locationRadius = profile?.location_radius || 5000;



  // Fetch posts from Supabase with infinite scroll
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error: queryError
  } = usePostsQuery(
    location?.latitude,
    location?.longitude,
    locationRadius,
    activeTab,
    timeFilter,
    !!location // Enable query when we have location
  );

  // Flatten infinite query pages into single posts array
  const posts = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.posts || []);
  }, [data]);

  // Guard against malformed data
  if (posts && !Array.isArray(posts)) {
    console.error('Posts data is not an array:', posts);
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <AlertCircle size={48} color={colors.error} />
          <Heading variant="h2" style={{ marginTop: 16, textAlign: 'center' }}>
            Unable to load feed
          </Heading>
          <Body color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
            There was an error loading posts. Please try refreshing.
          </Body>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary,
              borderRadius: radius.button,
            }}
          >
            <Body style={{ color: colors.primaryText }}>Refresh</Body>
          </TouchableOpacity>
        </View>
      </AppBackground>
    );
  }

  // Fetch user's votes
  const { data: userVotes = {} } = useUserVotesQuery(user?.id);

  // Vote mutation
  const votePostMutation = useVotePostMutation();

  // Track in-flight vote requests to prevent rapid clicking
  const votingInProgress = useRef(new Set());

  // Get location on mount (Cached + Fresh)
  useEffect(() => {
    loadLocationStrategy();
  }, []);

  const loadLocationStrategy = async () => {
    // 1. Try cached location first for fast load
    try {
      const cached = await AsyncStorage.getItem('lastKnownLocation');
      if (cached) {
        const parsedLocation = JSON.parse(cached);
        console.log("Using cached location:", parsedLocation);
        setLocation(parsedLocation);
      }
    } catch (e) {
      console.error("Failed to load cached location", e);
    }

    // 2. Then fetch fresh location
    getLocationPermission();
  };

  // Refresh posts when radius changes
  useEffect(() => {
    if (location) {
      refetch();
    }
  }, [locationRadius]);

  // Refresh posts when location loads (fixes race condition on app startup)
  useEffect(() => {
    if (location) {
      refetch();
    }
  }, [location]);

  // REMOVED: Real-time subscriptions to reduce costs and complexity
  // Posts fetch strategy:
  // 1. App startup (initial query)
  // 2. Manual pull-to-refresh
  // 3. Location/radius changes
  // 4. After post creation (optimistic update)
  // 5. After post deletion (cache invalidation)
  //
  // Tab switching uses React Query's smart caching:
  // - Shows cached data instantly if < 5min old (staleTime)
  // - Background refetch if > 5min old
  // - Each tab (new/popular) has separate cache

  const getLocationPermission = async (skipPrimer = false) => {
    try {
      setLocationError(null);

      // Platform-specific location handling
      if (Platform.OS === 'web') {
        // Web: Use browser geolocation API
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }

        setIsLocationPrimerVisible(false);
        // Browser will show its own permission prompt
      } else {
        // Native: Use expo-location (original behavior unchanged)
        if (!Location) {
          throw new Error('Location module not available');
        }

        // Show primer for first-time users
        if (!skipPrimer) {
          try {
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
            console.log('Permission status:', existingStatus);
            if (existingStatus === 'undetermined') {
              setIsLocationPrimerVisible(true);
              return;
            }
          } catch (permissionError) {
            console.error('Error checking location permission status:', permissionError);
            // If permission check fails, skip primer and proceed to request permission
            // This prevents the screen from freezing
          }
        }

        setIsLocationPrimerVisible(false);

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError(t('home_location_permission_denied'));
          Alert.alert(
            t('home_location_permission_title'),
            t('home_location_permission_msg'),
            [{ text: t('ok') }]
          );
          return;
        }
      }

      // Fetch location with timeout (platform-specific)
      let currentLocation;
      if (Platform.OS === 'web') {
        // Web: Use browser geolocation
        const position = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Location timeout")), 5000);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeout);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeout);
              reject(err);
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 0,
            }
          );
        });
        currentLocation = position;
      } else {
        // Native: Use expo-location
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Location timeout")), 5000)
        );
        currentLocation = await Promise.race([locationPromise, timeoutPromise]);
      }

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(coords);

      // Cache for next time
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(coords));

    } catch (error) {
      console.error("Error getting location:", error);
      if (!location) {
        setLocationError(error.message);
        Alert.alert(t('error'), t('home_failed_to_get_location'));
      }
      // If we have cached location, silently fail
    }
  };

  const handleRefresh = async () => {
    // Haptic feedback only on native platforms
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Refresh both location and posts
    await loadLocationStrategy(); // Re-trigger the strategy
    await refetch();
  };

  const handleVote = async (postId, voteType) => {
    if (!user) {
      Alert.alert(t('error'), t('home_must_be_logged_in_to_vote'));
      return;
    }

    // DEBOUNCING: Prevent multiple rapid votes on same post
    if (votingInProgress.current.has(postId)) {
      console.log('Vote already in progress for post:', postId);
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
      Alert.alert(t('please_wait'), t('home_post_uploading'));
      return;
    }

    // Mark vote as in progress
    votingInProgress.current.add(postId);

    // Optimistic update handled by React Query
    votePostMutation.mutate(
      {
        userId: user.id,
        postId,
        voteType: newVote,
      },
      {
        // Remove from in-progress set when done (success or error)
        onSettled: () => {
          votingInProgress.current.delete(postId);
        },
      }
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
      <TouchableOpacity
        key={post.id}
        onPress={navigateToPost}
        activeOpacity={1} // No dimming on press
        style={{
          backgroundColor: "transparent",
          paddingHorizontal: 20,
          paddingVertical: 24,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.borderLight,
        }}
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
                source={!post.is_anonymous && post.author_avatar_url ? { uri: post.author_avatar_url } : null}
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

              {/* Location (Moved here) */}
              {post.location_name && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <MapPin size={12} color={colors.textTertiary} />
                  <Caption color="tertiary" style={{ marginLeft: 2 }}>
                    {post.location_name}
                  </Caption>
                </View>
              )}
            </View>
          </View>

          {/* Time (Moved to Top Right) */}
          <Caption color="secondary" style={{ marginLeft: 8 }}>
            {formatTimeAgo(post.created_at)}
          </Caption>
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
                  {t('home_post_deleted')}
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
                if (String(post.id).startsWith("temp_")) {
                  Alert.alert(t('please_wait'), t('home_post_uploading'));
                  return;
                }
                router.push({
                  pathname: `/share/${post.id}`,
                  params: { post: JSON.stringify(post) }
                });
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
      </TouchableOpacity>
    );
  };

  // If no user, show loading (root layout will handle redirect)
  if (!user) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Body>{t('loading')}</Body>
        </View>
      </AppBackground>
    );
  }

  const renderHeader = () => (
    <View
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top + 20,
        paddingBottom: 8,
        paddingHorizontal: 16,
      }}
    >
      {/* Title + Toggle Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        {/* Left: Title */}
        <Heading variant="h2" weight="semibold">{t('home_title')}</Heading>

        {/* Right: New/Popular Toggle */}
        <View
          style={{
            flexDirection: "row",
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
                activeTab === "new" ? colors.surface : "transparent",
            }}
          >
            <Body
              variant="small"
              weight={activeTab === "new" ? "bold" : "medium"}
              style={{
                color: activeTab === "new" ? colors.text : colors.textSecondary,
              }}
            >
              {t('home_tab_new')}
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
              {t('home_tab_popular')}
            </Body>
          </TouchableOpacity>

          {/* Loading Indicator - Only show for pagination, not initial load */}
          {isFetchingNextPage && !isLoading && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* Subtitle */}
      {location && (
        <View>
          <Caption color="secondary" style={{ marginBottom: 8 }}>
            {getRadiusLabel(locationRadius, t, 'display')}
          </Caption>
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

      {/* Show query error */}
      {queryError && (
        <View
          style={{
            backgroundColor: colors.errorSubtle || "#FFE5E5",
            borderRadius: 12,
            padding: 8,
            marginBottom: 12,
          }}
        >
          <Caption style={{ color: colors.error || "#D32F2F" }}>
            ⚠️ Failed to load posts: {queryError.message}
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
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Caption color="secondary" style={{ marginTop: 8 }}>{t('home_loading_more')}</Caption>
      </View>
    );
  };

  const renderEmpty = () => (
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
        {t('home_no_posts')}
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
  );

  const renderSkeletonList = () => (
    <View>
      {[...Array(5)].map((_, index) => (
        <SkeletonPost key={`skeleton-${index}`} index={index} />
      ))}
    </View>
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      <FlatList
        data={posts}
        renderItem={({ item, index }) => renderPost(item, index)}
        keyExtractor={(item) => item.id.toString()}
        extraData={userVotes}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmpty : renderSkeletonList}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && posts.length > 0}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/compose" })}
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

      <LocationPermissionPrimer
        visible={isLocationPrimerVisible}
        onEnable={() => getLocationPermission(true)}
        onSkip={() => {
          setIsLocationPrimerVisible(false);
          // Optional: handle skip logic (maybe show error or default location)
        }}
      />
    </AppBackground>
  );
}
