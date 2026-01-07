import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../config/theme';
import { Avatar } from '../ui';
import { Body, Caption } from '../ui/Text';
import { formatTimeAgo } from '../../../utils/formatters';

/**
 * Post header component with avatar, name, location, and time
 */
export default function PostHeader({ post }) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start", // Align to top for better multi-line handling
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            if (!post.is_anonymous && post.user_id) {
              router.push(`/user/${post.user_id}`);
            }
          }}
          disabled={post.is_anonymous}
        >
          <Avatar
            name={post.is_anonymous ? "Anonymous" : post.author_nickname || "Unknown"}
            source={!post.is_anonymous && post.author_avatar_url ? { uri: post.author_avatar_url } : null}
            size="small" // 40px
            style={{ marginRight: 12 }} // Gap 12px
          />
        </TouchableOpacity>

        {/* Text Stack */}
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (!post.is_anonymous && post.user_id) {
                router.push(`/user/${post.user_id}`);
              }
            }}
            disabled={post.is_anonymous}
          >
            <Body weight="bold" style={{ color: colors.text, lineHeight: 20 }}>
              {post.is_anonymous ? "Anonymous" : post.author_nickname || "Unknown"}
            </Body>
          </TouchableOpacity>

          {/* Location */}
          {post.location_name && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <MapPin size={12} color={colors.textTertiary} />
              <Caption color="tertiary" style={{ marginLeft: 2 }}>
                {post.location_name}
              </Caption>
            </View>
          )}
        </View>
      </View>

      {/* Time (Top Right) */}
      <Caption color="secondary" style={{ marginLeft: 8 }}>
        {formatTimeAgo(post.created_at)}
      </Caption>
    </View>
  );
}
