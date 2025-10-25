import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Users } from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
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

export default function FollowingScreen() {
  const { id: userId } = useLocalSearchParams();
  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data: following, isLoading } = useFollowingQuery(userId);
  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();

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
            Following
          </Text>
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
          Following
        </Text>
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
    <TouchableOpacity
      onPress={() => router.push(`/user/${followingUser.id}`)}
      style={{
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary + "20",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 20, color: colors.primary }}>
          {displayName[0].toUpperCase()}
        </Text>
      </View>

      {/* User Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Poppins_600SemiBold",
            fontSize: 16,
            color: colors.text,
          }}
        >
          {displayName}
        </Text>
      </View>

      {/* Follow Button */}
      {!isOwnProfile && (
        <TouchableOpacity
          onPress={() => onFollowToggle(followingUser.id, isFollowing)}
          disabled={
            followMutation.isPending ||
            unfollowMutation.isPending ||
            followStatusLoading
          }
          style={{
            backgroundColor: isFollowing ? colors.border : colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            minWidth: 90,
            alignItems: "center",
          }}
        >
          {followMutation.isPending ||
          unfollowMutation.isPending ||
          followStatusLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 14,
                color: isFollowing ? colors.text : "#FFFFFF",
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}




