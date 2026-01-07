import React from 'react';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../config/theme';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';

/**
 * Main post card component that combines header, content, and actions
 */
export default function PostCard({
  post,
  userVote,
  onVote,
  onMorePress,
}) {
  const { colors } = useTheme();

  const navigateToPost = () => {
    router.push({
      pathname: `/post/${post.id}`,
      params: { post: JSON.stringify(post) },
    });
  };

  return (
    <TouchableOpacity
      key={post.id}
      onPress={navigateToPost}
      activeOpacity={1} // No dimming on press
      style={{
        backgroundColor: "transparent",
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderLight,
      }}
    >
      <PostHeader post={post} />
      <PostContent post={post} onPress={navigateToPost} />
      <PostActions
        post={post}
        userVote={userVote}
        onVote={onVote}
        onMorePress={onMorePress}
      />
    </TouchableOpacity>
  );
}
