import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { ArrowUp, ArrowDown, MessageCircle, Repeat, MoreHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../config/theme';
import { useLanguageStore } from '../../../services/i18n/languageStore';
import { Body } from '../ui/Text';

/**
 * Post actions component with vote pill, comment count, repost, and more button
 */
export default function PostActions({
  post,
  userVote,
  onVote,
  onMorePress
}) {
  const { colors, radius } = useTheme();
  const { t } = useLanguageStore();

  const handleRepost = (e) => {
    e.stopPropagation();
    if (String(post.id).startsWith("temp_")) {
      Alert.alert(t('please_wait'), t('home_post_uploading'));
      return;
    }
    router.push({
      pathname: `/share/${post.id}`,
      params: { post: JSON.stringify(post) }
    });
  };

  const handleMore = (e) => {
    e.stopPropagation();
    onMorePress();
  };

  return (
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
              onVote(post.id, 'up');
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
              color={userVote === 'up' ? colors.primary : colors.text}
            />
            <Body weight="bold" style={{ marginLeft: 4, color: userVote === 'up' ? colors.primary : userVote === 'down' ? colors.error : colors.text, fontSize: 12 }}>
              {post.score || 0}
            </Body>
          </TouchableOpacity>

          <View style={{ width: 1, height: 16, backgroundColor: colors.border }} />

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onVote(post.id, 'down');
            }}
            style={{
              paddingHorizontal: 8,
              height: "100%",
              justifyContent: "center",
            }}
          >
            <ArrowDown
              size={16}
              color={userVote === 'down' ? colors.error : colors.text}
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
        {/* Repost Button */}
        <TouchableOpacity
          onPress={handleRepost}
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

        {/* More Button */}
        <TouchableOpacity
          onPress={handleMore}
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
          <MoreHorizontal size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
