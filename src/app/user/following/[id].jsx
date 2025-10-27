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
import AppBackground from "../../../components/AppBackground";
import EmptyState from "../../../components/EmptyState";
import { useTheme } from "../../../utils/theme";
import { useAuth } from "../../../utils/auth/useAuth";
import {
  useFollowingQuery,
  useFollowStatusQuery,
  useFollowMutation,
  useUnfollowMutation,
} from "../../../utils/queries/follows";
import { Heading, Body, Card, Avatar, Button } from "../../../components/ui";

export default function FollowingScreen() {
  const { id: userId } = useLocalSearchParams();
  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data: following, isLoading } = useFollowingQuery(userId);
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

  const renderFollowing = ({ item }) => {
    const followingUser = item.following;
    const displayName = followingUser.is_anonymous
      ? "Anonymous"
      : followingUser.nickname || "User";
    const isOwnProfile = user.id === followingUser.id;

    return (
      <FollowingItem
        followingUser={followingUser}
        displayName={displayName}
        isOwnProfile={isOwnProfile}
        currentUserId={user.id}
        onFollowToggle={handleFollowToggle}
        colors={colors}
        router={router}
        followMutation={followMutation}
        unfollowMutation={unfollowMutation}
      />
    );
  };

  if (isLoading) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppBackground>
    );
  }

  if (!following || following.length === 0) {
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
          <Heading variant="h2" style={{ flex: 1 }}>Following</Heading>
        </View>

        <EmptyState
          Icon={Users}
          title="Not Following Anyone"
          description="This user isn't following anyone yet."
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
        <Heading variant="h2" style={{ flex: 1 }}>Following</Heading>
      </View>

      {/* Following List */}
      <FlatList
        data={following}
        renderItem={renderFollowing}
        keyExtractor={(item) => item.following_id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
      />
    </AppBackground>
  );
}

// Separate component to handle individual follow status
function FollowingItem({
  followingUser,
  displayName,
  isOwnProfile,
  currentUserId,
  onFollowToggle,
  colors,
  router,
  followMutation,
  unfollowMutation,
}) {
  const { data: isFollowing, isLoading: followStatusLoading } =
    useFollowStatusQuery(currentUserId, followingUser.id);

  return (
    <Card
      interactive
      onPress={() => router.push(`/user/${followingUser.id}`)}
      style={{ marginHorizontal: 20, marginBottom: 12 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              onFollowToggle(followingUser.id, isFollowing);
            }}
            disabled={
              followMutation.isPending ||
              unfollowMutation.isPending ||
              followStatusLoading
            }
            style={{ minWidth: 90 }}
          >
            {followMutation.isPending ||
            unfollowMutation.isPending ||
            followStatusLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.text : "#FFFFFF"} />
            ) : (
              isFollowing ? "Following" : "Follow"
            )}
          </Button>
        )}
      </View>
    </Card>
  );
}




