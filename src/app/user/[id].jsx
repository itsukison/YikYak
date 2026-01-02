import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MessageCircle, MoreVertical, MapPin, ArrowUp, ArrowDown, Repeat, Share } from "lucide-react-native";
import AppBackground from "../../ui/components/AppBackground";
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import {
  useUserProfileQuery,
  useUserPostsQuery,
  useProfileStatsQuery,
} from "../../services/user/useUser";
import {
  useFollowStatusQuery,
  useFollowMutation,
  useUnfollowMutation,
} from "../../services/user/useFollows";
import { useCreateChatMutation } from "../../services/chat/useChatActions";
import { useVotePostMutation } from "../../services/posts/usePostActions";
import { useUserVotesQuery } from "../../services/posts/usePosts";
import { useBlockStatusQuery } from "../../services/user/useUserActions";
import UserActionSheet from "../../ui/components/UserActionSheet";
import { Heading, Body, Caption, Card, Avatar, Button } from "../../ui/components/ui";

export default function UserProfileScreen() {
  const { id: targetUserId } = useLocalSearchParams();
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const { data: targetProfile, isLoading: profileLoading } =
    useUserProfileQuery(targetUserId);
  const { data: targetPosts, isLoading: postsLoading } =
    useUserPostsQuery(targetUserId);
  const { data: targetStats } = useProfileStatsQuery(targetUserId);
  const { data: isFollowing, isLoading: followStatusLoading } =
    useFollowStatusQuery(user?.id, targetUserId);
  const { data: isBlocked } = useBlockStatusQuery(user?.id, targetUserId);

  const { data: userVotes } = useUserVotesQuery(user?.id);

  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();
  const createChatMutation = useCreateChatMutation();
  const votePostMutation = useVotePostMutation();

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
      router.push({
        pathname: `/chat/${chat.id}`,
        params: {
          otherUserId: targetUserId,
          otherUserNickname: targetProfile?.nickname,
          otherUserIsAnonymous: targetProfile?.is_anonymous ? 'true' : 'false'
        }
      });
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleVotePost = async (postId, voteType) => {
    const currentVote = userVotes?.[postId];
    const newVote = currentVote === voteType ? null : voteType;

    try {
      await votePostMutation.mutateAsync({
        userId: user.id,
        postId,
        voteType: newVote,
      });
    } catch (error) {
      console.error("Error voting on post:", error);
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
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Heading variant="h2" style={{ flex: 1 }}>
          {isOwnProfile ? "My Posts" : "Profile"}
        </Heading>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {profileLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Profile Header - Only show for other users */}
            {!isOwnProfile && (
              <View style={{ margin: 20 }}>
                {/* Top Section: Avatar + Name + Stats */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  {/* Avatar */}
                  <Avatar
                    name={displayName}
                    source={!targetProfile?.is_anonymous && targetProfile?.avatar_url ? { uri: targetProfile.avatar_url } : null}
                    size="xlarge"
                  />

                  {/* Right Column: Name + Stats */}
                  <View style={{ flex: 1, marginLeft: 20, justifyContent: "center" }}>
                    {/* Name */}
                    <Body weight="bold" style={{ marginBottom: 8, fontSize: 18 }}>
                      {displayName}
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
                      <View style={{ alignItems: "center" }}>
                        <Heading variant="h3" style={{ fontSize: 16 }}>{targetStats?.postCount || 0}</Heading>
                        <Caption color="secondary" style={{ fontSize: 12 }}>Posts</Caption>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push(`/user/followers/${targetUserId}`)}
                        style={{ alignItems: "center" }}
                      >
                        <Heading variant="h3" style={{ fontSize: 16 }}>
                          {targetStats?.followerCount || 0}
                        </Heading>
                        <Caption color="secondary" style={{ fontSize: 12 }}>Followers</Caption>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => router.push(`/user/following/${targetUserId}`)}
                        style={{ alignItems: "center" }}
                      >
                        <Heading variant="h3" style={{ fontSize: 16 }}>
                          {targetStats?.followingCount || 0}
                        </Heading>
                        <Caption color="secondary" style={{ fontSize: 12 }}>Following</Caption>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Bio */}
                {targetProfile?.bio && !targetProfile?.is_anonymous && (
                  <Body variant="small" color="secondary" style={{ textAlign: "left", marginBottom: 16 }}>
                    {targetProfile.bio}
                  </Body>
                )}

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 4 }}>
                    <Button
                      variant={isFollowing ? "ghost" : "primary"}
                      size="small"
                      onPress={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      style={{
                        flex: 1,
                        borderRadius: radius.pill,
                        paddingVertical: 8, // Reduced padding
                        height: 40, // Fixed height for smaller look
                      }}
                      textStyle={{
                        fontSize: 14, // Smaller text
                      }}
                    >
                      {followMutation.isPending || unfollowMutation.isPending ? (
                        <ActivityIndicator size="small" color={isFollowing ? colors.text : "#FFFFFF"} />
                      ) : (
                        isFollowing ? "Following" : "Follow"
                      )}
                    </Button>

                    <TouchableOpacity
                      onPress={() => setShowActionSheet(true)}
                      style={{
                        backgroundColor: colors.surface,
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <MoreVertical size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* User's Posts */}
            <View style={{ paddingHorizontal: 20, marginTop: isOwnProfile ? 20 : 0 }}>
              {!isOwnProfile && (
                <Heading variant="h3" style={{ marginBottom: 16 }}>
                  Posts
                </Heading>
              )}

              {postsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : targetPosts && targetPosts.length > 0 ? (
                targetPosts.map((post) => {
                  const userPostVote = userVotes?.[post.id];

                  return (
                    <TouchableOpacity
                      key={post.id}
                      onPress={() =>
                        router.push({
                          pathname: `/post/${post.id}`,
                          params: { post: JSON.stringify(post) },
                        })
                      }
                      style={{
                        marginBottom: 24,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                        paddingBottom: 24
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
                        <Caption color="secondary">
                          {formatTime(post.created_at)}
                        </Caption>
                      </View>

                      {/* Post Content */}
                      <Body style={{ lineHeight: 22, marginBottom: 12 }}>
                        {post.content}
                      </Body>

                      {/* Location */}
                      {post.location_name && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <MapPin size={12} color={colors.textSecondary} />
                          <Caption color="secondary" style={{ marginLeft: 4 }}>
                            {post.location_name}
                          </Caption>
                        </View>
                      )}

                      {/* Stats/Actions - New Design */}
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
                                handleVotePost(post.id, 'up');
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
                                color={userPostVote === 'up' ? colors.primary : colors.text}
                              />
                              <Body weight="bold" style={{ marginLeft: 4, color: userPostVote === 'up' ? colors.primary : colors.text, fontSize: 12 }}>
                                Vote
                              </Body>
                            </TouchableOpacity>

                            <View style={{ width: 1, height: 16, backgroundColor: colors.border }} />

                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleVotePost(post.id, 'down');
                              }}
                              style={{
                                paddingHorizontal: 8,
                                height: "100%",
                                justifyContent: "center",
                              }}
                            >
                              <ArrowDown
                                size={16}
                                color={userPostVote === 'down' ? colors.error : colors.text}
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
                          {/* Repost Button (Placeholder) */}
                          <TouchableOpacity
                            onPress={(e) => e.stopPropagation()}
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

                          {/* Share Button (Placeholder) */}
                          <TouchableOpacity
                            onPress={(e) => e.stopPropagation()}
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
                            <Share size={16} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Caption color="secondary" style={{ textAlign: "center", marginTop: 20 }}>
                  No posts yet
                </Caption>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* User Action Sheet */}
      {!isOwnProfile && (
        <UserActionSheet
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          targetUser={targetProfile}
          isBlocked={isBlocked}
          onChatPress={handleMessage}
        />
      )}
    </AppBackground>
  );
}
