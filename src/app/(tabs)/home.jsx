import React, { useState, useRef } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  MessageCircle,
  Plus,
  AlertCircle
} from "lucide-react-native";
import * as Device from 'expo-device';
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import { usePostsQuery, useUserVotesQuery } from "../../services/posts/usePosts";
import { useVotePostMutation } from "../../services/posts/usePostActions";
import { useLocationManager } from "../../services/location/useLocationManager";
import AppBackground from "../../ui/components/AppBackground";
import { Heading, Body, Caption } from "../../ui/components/ui/Text";
import { router } from "expo-router";
import PostActionSheet from "../../ui/components/PostActionSheet";
import SkeletonPost from "../../ui/components/SkeletonPost";
import LocationPermissionPrimer from "../../ui/components/LocationPermissionPrimer";
import { useLanguageStore } from "../../services/i18n/languageStore";
import FeedHeader from "../../ui/components/feed/FeedHeader";
import PostCard from "../../ui/components/feed/PostCard";

// Platform-specific imports for native modules
const Haptics = Platform.OS === 'web' ? null : require('expo-haptics');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { user, profile } = useAuth();
  const { t } = useLanguageStore();

  // Location management
  const {
    location,
    locationError,
    isLocationPrimerVisible,
    setIsLocationPrimerVisible,
    loadLocation,
    getLocationPermission,
  } = useLocationManager();

  // UI state
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'popular'
  const [timeFilter, setTimeFilter] = useState("week"); // 'day' | 'week' | 'month'
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Handle time filter changes with immediate refetch
  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    // Force immediate refetch when time filter changes
    refetch();
  };

  // Handle tab changes with immediate refetch
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Force immediate refetch when switching tabs
    refetch();
  };

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

  const handleRefresh = async () => {
    // Haptic feedback only on native platforms
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Refresh both location and posts
    await loadLocation();
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

  const renderPost = ({ item }) => {
    const userVote = userVotes[item.id] || null;

    return (
      <PostCard
        post={item}
        userVote={userVote}
        onVote={handleVote}
        onMorePress={() => {
          setSelectedPost(item);
          setActionSheetVisible(true);
        }}
      />
    );
  };

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
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        extraData={userVotes}
        ListHeaderComponent={
          <FeedHeader
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            timeFilter={timeFilter}
            setTimeFilter={handleTimeFilterChange}
            location={location}
            locationError={locationError}
            queryError={queryError}
            locationRadius={locationRadius}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
          />
        }
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
          bottom: (Device.deviceType === 2 || Device.deviceType === 'TABLET') ? insets.bottom + 80 : insets.bottom + 5,
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
          zIndex: 100,
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
      />
    </AppBackground>
  );
}
