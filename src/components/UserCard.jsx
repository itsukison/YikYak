import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "../utils/theme";
import { Card, Avatar, Body, Caption, Badge } from "./ui";

/**
 * UserCard component for displaying user search results
 * Shows avatar, username, nickname, bio preview, and follow status
 */
export default function UserCard({ user, isFollowing, onPress }) {
  const { colors, radius, shadows, spacing } = useTheme();

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
      style={{
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        borderRadius: radius.card,
        backgroundColor: colors.surface,
        ...shadows.minimal,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.sm }}>
        {/* Avatar */}
        <Avatar
          name={displayName}
          size="medium"
          style={{ marginRight: spacing.md }}
        />

        {/* User Info */}
        <View style={{ flex: 1 }}>
          {/* Display Name */}
          <Body weight="bold" style={{ marginBottom: 2, color: colors.text }}>
            {displayName}
          </Body>

          {/* Username */}
          {username && (
            <Caption color="secondary" style={{ marginBottom: 4 }}>
              {username}
            </Caption>
          )}

          {/* Bio Preview */}
          {bioPreview && (
            <Caption
              color="tertiary"
              numberOfLines={1}
              style={{ marginBottom: spacing.sm }}
            >
              {bioPreview}
            </Caption>
          )}

          {/* Follow Status Badge */}
          {isFollowing !== undefined && (
            <View style={{ flexDirection: 'row' }}>
              <Badge
                variant={isFollowing ? "primary" : "ghost"}
                size="sm"
                style={{
                  borderRadius: radius.pill,
                  backgroundColor: isFollowing ? colors.primary : colors.ghost
                }}
              >
                {isFollowing ? "Following" : "Not Following"}
              </Badge>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
