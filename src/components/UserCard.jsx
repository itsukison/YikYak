import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "../utils/theme";
import { Card, Avatar, Body, Caption, Badge } from "./ui";

/**
 * UserCard component for displaying user search results
 * Shows avatar, username, nickname, bio preview, and follow status
 */
export default function UserCard({ user, isFollowing, onPress }) {
  const { colors } = useTheme();

  if (!user) return null;

  const displayName = user.is_anonymous
    ? "Anonymous"
    : user.nickname || "User";
  
  const username = user.username ? `@${user.username}` : "";
  const bioPreview = user.bio && !user.is_anonymous 
    ? user.bio 
    : user.school_name || "";

  return (
    <Card
      interactive
      onPress={onPress}
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
          {/* Username */}
          {username && (
            <Caption color="secondary" style={{ marginBottom: 2 }}>
              {username}
            </Caption>
          )}

          {/* Display Name */}
          <Body weight="semibold" style={{ marginBottom: 4 }}>
            {displayName}
          </Body>

          {/* Bio Preview */}
          {bioPreview && (
            <Caption
              color="secondary"
              numberOfLines={1}
              style={{ marginBottom: 8 }}
            >
              {bioPreview}
            </Caption>
          )}

          {/* Follow Status Badge */}
          {isFollowing !== undefined && (
            <Badge
              variant={isFollowing ? "primary" : "ghost"}
              size="sm"
            >
              {isFollowing ? "Following" : "Not Following"}
            </Badge>
          )}
        </View>
      </View>
    </Card>
  );
}
