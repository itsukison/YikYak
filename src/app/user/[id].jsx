import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
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
import { Heading, Body, Caption, Card, Avatar, Button } from "../../components/ui";

export default function UserProfileScreen() {
  const { id: targetUserId } = useLocalSearchParams();
  const { isDark, colors, radius } = useTheme();
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
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ 
            marginRight: 12,
            width: 48,
            height: 48,
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Heading variant="h2" style={{ flex: 1 }}>Profile</Heading>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {profileLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Profile Header */}
            <Card style={{ margin: 20, alignItems: "center" }}>
              {/* Avatar */}
              <Avatar 
                name={displayName}
                size="xlarge"
                style={{ marginBottom: 16 }}
              />

              {/* Name */}
              <Heading variant="h2" style={{ marginBottom: 8 }}>
                {displayName}
              </Heading>

              {/* Bio */}
              {targetProfile?.bio && !targetProfile?.is_anonymous && (
                <Body variant="small" color="secondary" style={{ textAlign: "center", marginBottom: 20 }}>
                  {targetProfile.bio}
                </Body>
              )}

              {/* Stats */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 32,
                  marginBottom: 20,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  width: '100%',
                  justifyContent: 'space-around',
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Heading variant="h3">{targetStats?.postCount || 0}</Heading>
                  <Caption color="secondary">Posts</Caption>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/user/followers/${targetUserId}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3">
                    {targetStats?.followerCount || 0}
                  </Heading>
                  <Caption color="secondary">Followers</Caption>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/user/following/${targetUserId}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3">
                    {targetStats?.followingCount || 0}
                  </Heading>
                  <Caption color="secondary">Following</Caption>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                  <Button
                    variant={isFollowing ? "ghost" : "primary"}
                    onPress={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    style={{ flex: 1 }}
                  >
                    {followMutation.isPending || unfollowMutation.isPending ? (
                      <ActivityIndicator size="small" color={isFollowing ? colors.text : "#FFFFFF"} />
                    ) : (
                      isFollowing ? "Following" : "Follow"
                    )}
                  </Button>

                  <TouchableOpacity
                    onPress={handleMessage}
                    disabled={createChatMutation.isPending}
                    style={{
                      backgroundColor: colors.accentSubtle,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 48,
                    }}
                  >
                    {createChatMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <MaterialIcons name="chat-bubble" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {/* User's Posts */}
            <View style={{ paddingHorizontal: 20 }}>
              <Heading variant="h3" style={{ marginBottom: 16 }}>
                Posts
              </Heading>

              {postsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : targetPosts && targetPosts.length > 0 ? (
                targetPosts.map((post) => (
                  <Card
                    key={post.id}
                    interactive
                    onPress={() =>
                      router.push({
                        pathname: `/post/${post.id}`,
                        params: { post: JSON.stringify(post) },
                      })
                    }
                    style={{ marginBottom: 12 }}
                  >
                    {/* Post Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Caption color="secondary">
                        {formatTime(post.created_at)}
                      </Caption>
                    </View>

                    {/* Post Content */}
                    <Body style={{ lineHeight: 22, marginBottom: 8 }}>
                      {post.content}
                    </Body>

                    {/* Location */}
                    {post.location_name && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <MaterialIcons name="place" size={12} color={colors.textSecondary} />
                        <Caption color="secondary" style={{ marginLeft: 4 }}>
                          {post.location_name}
                        </Caption>
                      </View>
                    )}

                    {/* Stats */}
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <Caption color="secondary">
                        {post.score || 0} votes
                      </Caption>
                      <Caption color="secondary">
                        {post.comment_count || 0} comments
                      </Caption>
                    </View>
                  </Card>
                ))
              ) : (
                <Caption color="secondary" style={{ textAlign: "center", marginTop: 20 }}>
                  No posts yet
                </Caption>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </AppBackground>
  );
}
