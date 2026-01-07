import React from 'react';
import { View } from 'react-native';
import { User, UserX, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../config/theme';
import { useLanguageStore } from '../../../services/i18n/languageStore';
import { Body, Caption } from '../ui/Text';
import PhotoGrid from '../PhotoGrid';
import { formatTimeAgo } from '../../../utils/formatters';

/**
 * Post content component with text, photos, and repost content
 */
export default function PostContent({ post, onPress }) {
  const { colors, radius, spacing } = useTheme();
  const { t } = useLanguageStore();

  return (
    <>
      {/* Repost Content */}
      {post.repost_of && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.card,
            padding: 12,
            marginBottom: spacing.md,
            backgroundColor: colors.surface,
          }}
        >
          {post.reposted_post_content ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceElevated,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                >
                  {post.reposted_post_is_anonymous ? (
                    <UserX size={12} color={colors.textSecondary} />
                  ) : (
                    <User size={12} color={colors.textSecondary} />
                  )}
                </View>
                <Body weight="bold" style={{ fontSize: 13 }}>
                  {post.reposted_post_is_anonymous ? "Anonymous" : post.reposted_post_author || "Unknown"}
                </Body>
                <Caption color="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  {formatTimeAgo(post.reposted_post_created_at)}
                </Caption>
              </View>
              <Body style={{ fontSize: 14, color: colors.textSecondary }}>
                {post.reposted_post_content}
              </Body>
            </>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "left", padding: spacing.sm, opacity: 0.6 }}>
              <Trash2 size={16} color={colors.textSecondary} />
              <Body style={{ marginLeft: 8, color: colors.textSecondary }}>
                {t('home_post_deleted')}
              </Body>
            </View>
          )}
        </View>
      )}

      {/* Post Content */}
      <Body style={{ marginBottom: post.photos?.length > 0 ? spacing.sm : spacing.lg }}>
        {post.content}
      </Body>

      {/* Post Photos */}
      {
        post.photos && post.photos.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <PhotoGrid photos={post.photos} onPress={onPress} />
          </View>
        )
      }
    </>
  );
}
