import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MessageCircle, MapPin } from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import AppBackground from "../../components/AppBackground";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import {
  useUserProfileQuery,
  useUserPostsQuery,
  useFollowStatusQuery,
  useFollowMutation,
  useUnfollowMutation,
} from "../../utils/queries/follows";
import { useProfileStatsQuery } from "../../utils/queries/profile";
import { useCreateChatMutation } from "../../utils/queries/chats";

export default function UserProfileScreen() {
  const { id: targetUserId } = useLocalSearchParams();
  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data: targetProfile, isLoading: profileLoading } =
    useUserProfileQuery(targetUserId);
  const { data: targetPosts, isLoading: postsLoading } =
    useUserPostsQuery(targetUserId);
  const { data: targetStats } = useProfileStatsQuery(targetUserId);
  const { data: isFollowing, isLoading: followStatusLoading } =
    useFollowStatusQuery(user?.id, targetUserId);

  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();
  const createChatMutation = useCreateChatMutation();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  if (!user) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppBackground>
    );
  }

  const isOwnProfile = user.id === targetUserId;

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync({
          followerId: user.id,
          followingId: targetUserId,
        });
      } else {
        await followMutation.mutateAsync({
          followerId: user.id,
          followingId: targetUserId,
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleMessage = async () => {
    try {
      const chat = await createChatMutation.mutateAsync({
        user1Id: user.id,
        user2Id: targetUserId,
      });
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const displayName =
    targetProfile?.is_anonymous
      ? "Anonymous"
      : targetProfile?.nickname || "User";

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Poppins_600SemiBold",
            fontSize: 20,
            color: colors.text,
            flex: 1,
          }}
        >
          Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {profileLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Profile Header */}
            <View style={{ padding: 20, alignItems: "center" }}>
              {/* Avatar */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.primary + "20",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 32,
                    color: colors.primary,
                  }}
                >
                  {displayName[0].toUpperCase()}
                </Text>
              </View>

              {/* Name */}
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 24,
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                {displayName}
              </Text>

              {/* Bio */}
              {targetProfile?.bio && !targetProfile?.is_anonymous && (
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  {targetProfile.bio}
                </Text>
              )}

              {/* Stats */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 32,
                  marginBottom: 20,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 20,
                      color: colors.text,
                    }}
                  >
                    {targetStats?.postCount || 0}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    Posts
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/user/followers/${targetUserId}`)}
                  style={{ alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 20,
                      color: colors.text,
                    }}
                  >
                    {targetStats?.followerCount || 0}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    Followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/user/following/${targetUserId}`)}
                  style={{ alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 20,
                      color: colors.text,
                    }}
                  >
                    {targetStats?.followingCount || 0}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    Following
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                  <TouchableOpacity
                    onPress={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    style={{
                      flex: 1,
                      backgroundColor: isFollowing ? colors.border : colors.primary,
                      paddingVertical: 12,
                      borderRadius: 24,
                      alignItems: "center",
                    }}
                  >
                    {followMutation.isPending || unfollowMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          fontFamily: "Poppins_600SemiBold",
                          fontSize: 16,
                          color: isFollowing ? colors.text : "#FFFFFF",
                        }}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleMessage}
                    disabled={createChatMutation.isPending}
                    style={{
                      backgroundColor: colors.card,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {createChatMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <MessageCircle size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* User's Posts */}
            <View style={{ paddingHorizontal: 16 }}>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                  marginBottom: 16,
                }}
              >
                Posts
              </Text>

              {postsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : targetPosts && targetPosts.length > 0 ? (
                targetPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    onPress={() =>
                      router.push({
                        pathname: `/post/${post.id}`,
                        params: { post: JSON.stringify(post) },
                      })
                    }
                    style={{
                      backgroundColor: colors.card,
                      padding: 16,
                      borderRadius: 16,
                      marginBottom: 12,
                    }}
                  >
                    {/* Post Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {formatTime(post.created_at)}
                      </Text>
                    </View>

                    {/* Post Content */}
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 15,
                        color: colors.text,
                        lineHeight: 22,
                        marginBottom: 8,
                      }}
                    >
                      {post.content}
                    </Text>

                    {/* Location */}
                    {post.location_name && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <MapPin size={12} color={colors.textSecondary} />
                        <Text
                          style={{
                            fontFamily: "Poppins_400Regular",
                            fontSize: 12,
                            color: colors.textSecondary,
                            marginLeft: 4,
                          }}
                        >
                          {post.location_name}
                        </Text>
                      </View>
                    )}

                    {/* Stats */}
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: 13,
                          color: colors.textSecondary,
                        }}
                      >
                        {post.score || 0} votes
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: 13,
                          color: colors.textSecondary,
                        }}
                      >
                        {post.comment_count || 0} comments
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  No posts yet
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </AppBackground>
  );
}
