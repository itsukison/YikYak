import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Plus,
  TrendingUp,
  Clock,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  MapPin,
  School,
} from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import { usePostsQuery, useUserVotesQuery, useVotePostMutation } from "../../utils/queries/posts";
import { subscribeToNewPosts } from "../../utils/realtime";
import AppBackground from "../../components/AppBackground";
import * as Location from "expo-location";
import { router } from "expo-router";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { user, profile } = useAuth();
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'popular'
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  // Use profile radius (default to 5000 if not set)
  const locationRadius = profile?.location_radius || 5000;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  // Fetch posts from Supabase
  const { data: posts = [], isLoading, refetch } = usePostsQuery(
    location?.coords.latitude,
    location?.coords.longitude,
    locationRadius,
    activeTab,
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
    <TouchableOpacity
      key={post.id}
      onPress={navigateToPost}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: radius.card,
        padding: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Post Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
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
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color: colors.primary,
              }}
            >
              {post.is_anonymous ? "Anonymous" : post.author_nickname || "Unknown"}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
              color: colors.textSecondary,
              marginLeft: 8,
            }}
          >
            • {formatTimeAgo(post.created_at)}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MapPin size={12} color={colors.accent} />
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
              color: colors.textSecondary,
              marginLeft: 4,
            }}
          >
            {post.location_name || formatDistance(post.distance)}
          </Text>
        </View>
      </View>

      {/* Post Content */}
      <Text
        style={{
          fontFamily: "Poppins_400Regular",
          fontSize: 16,
          color: colors.text,
          lineHeight: 24,
          marginBottom: 16,
        }}
      >
        {post.content}
      </Text>

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
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: radius.button,
              backgroundColor:
                userVote === 1
                  ? colors.primarySubtle
                  : colors.inputBackground,
            }}
          >
            <ChevronUp
              size={18}
              color={
                userVote === 1 ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color:
                  userVote === 1 ? colors.primary : colors.textSecondary,
                marginLeft: 4,
              }}
            >
              {post.score || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleVote(post.id, -1);
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 8,
              marginLeft: 4,
            }}
          >
            <ChevronDown
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
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <MessageCircle size={16} color={colors.textSecondary} />
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              marginLeft: 6,
            }}
          >
            {post.comment_count || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  // If no user, show loading (root layout will handle redirect)
  if (!user) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: colors.text }}>
            Loading...
          </Text>
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
            <School size={28} color={colors.primary} strokeWidth={2} />
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 28,
                color: colors.text,
                marginLeft: 8,
              }}
            >
              Campus Feed
            </Text>
          </View>
          {location && (
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              Posts within {locationRadius / 1000}km
            </Text>
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
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 12,
                color: colors.error || "#D32F2F",
              }}
            >
              📍 {locationError}
            </Text>
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
            <Clock
              size={16}
              color={activeTab === "new" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color: activeTab === "new" ? "#FFFFFF" : colors.textSecondary,
                marginLeft: 6,
              }}
            >
              New
            </Text>
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
            <TrendingUp
              size={16}
              color={activeTab === "popular" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color:
                  activeTab === "popular" ? "#FFFFFF" : colors.textSecondary,
                marginLeft: 6,
              }}
            >
              Popular
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts Feed */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 160, // Account for fixed header
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
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
                color: colors.textSecondary,
              }}
            >
              Loading posts...
            </Text>
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
            <MessageCircle size={48} color={colors.accent} strokeWidth={1.5} />
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 20,
                color: colors.text,
                textAlign: "center",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No Posts Yet
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Be the first to share what's happening on campus! Tap the + button
              to create a post.
            </Text>
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
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </AppBackground>
  );
}
