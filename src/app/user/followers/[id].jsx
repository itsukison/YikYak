import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppBackground from "../../../ui/components/AppBackground";
import EmptyState from "../../../ui/components/EmptyState";
import { useTheme } from "../../../config/theme";
import { useAuth } from "../../../services/auth/useAuth";
import {
  useFollowersQuery,
  useFollowStatusQuery,
  useFollowMutation,
  useUnfollowMutation,
} from "../../../services/user/useFollows";
import { Heading, Body, Card, Avatar, Button } from "../../../ui/components/ui";
import SkeletonBox from "../../../ui/components/SkeletonBox";

export default function FollowersScreen() {
  const { id: userId } = useLocalSearchParams();
  const { isDark, colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: followers, isLoading } = useFollowersQuery(userId);
  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();

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

  const handleFollowToggle = async (targetUserId, isFollowing) => {
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

  const renderFollower = ({ item, index }) => {
    const followerUser = item.follower;
    const displayName = followerUser.is_anonymous
      ? "Anonymous"
      : followerUser.nickname || "User";
    const isOwnProfile = user.id === followerUser.id;
    const isLastItem = index === followers.length - 1;

    return (
      <FollowerItem
        followerUser={followerUser}
        displayName={displayName}
        isOwnProfile={isOwnProfile}
        currentUserId={user.id}
        onFollowToggle={handleFollowToggle}
        colors={colors}
        radius={radius}
        router={router}
        followMutation={followMutation}
        unfollowMutation={unfollowMutation}
        isLastItem={isLastItem}
      />
    );
  };

  if (isLoading) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        {/* Header Skeleton */}
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <SkeletonBox width={48} height={48} radius={24} style={{ marginRight: 12 }} />
          <SkeletonBox width={150} height={32} radius={8} />
        </View>
        <FlatList
          data={[...Array(8)]}
          renderItem={() => (
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
              <SkeletonBox width={48} height={48} radius={24} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <SkeletonBox width={120} height={16} radius={4} />
              </View>
              <SkeletonBox width={90} height={32} radius={16} />
            </View>
          )}
          keyExtractor={(_, i) => `skeleton-${i}`}
        />
      </AppBackground>
    );
  }

  if (!followers || followers.length === 0) {
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
          <Heading variant="h2" style={{ flex: 1 }}>Followers</Heading>
        </View>

        <EmptyState
          Icon={Users}
          title="No Followers"
          description="This user doesn't have any followers yet."
        />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
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
        <Heading variant="h2" style={{ flex: 1 }}>Followers</Heading>
      </View>

      {/* Followers List */}
      <FlatList
        data={followers}
        renderItem={renderFollower}
        keyExtractor={(item) => item.follower_id}
      />
    </AppBackground>
  );
}

// Separate component to handle individual follow status
function FollowerItem({
  followerUser,
  displayName,
  isOwnProfile,
  currentUserId,
  onFollowToggle,
  colors,
  radius,
  router,
  followMutation,
  unfollowMutation,
  isLastItem,
}) {
  const { data: isFollowing, isLoading: followStatusLoading } =
    useFollowStatusQuery(currentUserId, followerUser.id);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/user/${followerUser.id}`)}
      style={{
        backgroundColor: colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderLight,
      }}
      activeOpacity={0.7}
    >
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
      }}>
        {/* Avatar */}
        <Avatar
          name={displayName}
          size="medium"
          style={{ marginRight: 12 }}
        />

        {/* User Info */}
        <View style={{ flex: 1 }}>
          <Body weight="semibold">{displayName}</Body>
        </View>

        {/* Follow Button */}
        {!isOwnProfile && (
          <Button
            variant={isFollowing ? "ghost" : "primary"}
            size="small"
            onPress={(e) => {
              e.stopPropagation();
              onFollowToggle(followerUser.id, isFollowing);
            }}
            disabled={
              followMutation.isPending ||
              unfollowMutation.isPending ||
              followStatusLoading
            }
            style={{
              minWidth: 90,
              backgroundColor: isFollowing ? 'transparent' : colors.primary,
              borderWidth: isFollowing ? 1 : 0,
              borderColor: isFollowing ? colors.border : 'transparent',
              borderRadius: radius.pill,
            }}
          >
            {followMutation.isPending ||
              unfollowMutation.isPending ||
              followStatusLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.text : colors.primaryText} />
            ) : (
              <Body weight="medium" style={{ color: isFollowing ? colors.text : colors.primaryText }}>
                {isFollowing ? "Following" : "Follow"}
              </Body>
            )}
          </Button>
        )}
      </View>
    </TouchableOpacity>
  );
}




