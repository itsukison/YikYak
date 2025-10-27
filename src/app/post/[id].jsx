import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  Send,
  MapPin,
} from "lucide-react-native";
import AppBackground from "../../components/AppBackground";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import {
  useCommentsQuery,
  useCommentVotesQuery,
  useCreateCommentMutation,
  useVoteCommentMutation,
} from "../../utils/queries/comments";
import { Heading, Body, Caption, Card } from "../../components/ui";

export default function PostDetailScreen() {
  const { id: postId, post: postJson } = useLocalSearchParams();
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [comment, setComment] = useState("");
  const [localVotes, setLocalVotes] = useState({});

  // Parse post data from params
  const post = postJson ? JSON.parse(postJson) : null;

  const { data: comments, isLoading: commentsLoading } = useCommentsQuery(postId);
  const { data: userVotes } = useCommentVotesQuery(postId, user?.id);
  const createCommentMutation = useCreateCommentMutation();
  const voteCommentMutation = useVoteCommentMutation();

  useEffect(() => {
    if (userVotes) {
      setLocalVotes(userVotes);
    }
  }, [userVotes]);

  if (!user || !post) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppBackground>
    );
  }

  const handleCreateComment = async () => {
    if (!comment.trim()) return;

    const commentText = comment.trim();
    setComment("");

    try {
      await createCommentMutation.mutateAsync({
        postId,
        userId: user.id,
        content: commentText,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      setComment(commentText);
    }
  };

  const handleVoteComment = async (commentId, voteType) => {
    const currentVote = localVotes[commentId];
    const newVote = currentVote === voteType ? 0 : voteType;

    // Optimistic update
    setLocalVotes((prev) => ({
      ...prev,
      [commentId]: newVote === 0 ? undefined : newVote,
    }));

    try {
      if (newVote === 0) {
        // Remove vote
        await voteCommentMutation.mutateAsync({
          userId: user.id,
          commentId,
          voteType: 0,
          postId,
        });
      } else {
        await voteCommentMutation.mutateAsync({
          userId: user.id,
          commentId,
          voteType: newVote,
          postId,
        });
      }
    } catch (error) {
      console.error("Error voting on comment:", error);
      // Revert on error
      setLocalVotes((prev) => ({
        ...prev,
        [commentId]: currentVote,
      }));
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

  const displayName = post.is_anonymous ? "Anonymous" : post.author_nickname || "User";

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
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
          <Heading variant="h2" style={{ flex: 1 }}>Post</Heading>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Post Card */}
          <Card style={{ marginHorizontal: 20, marginTop: 20 }}>
            {/* Post Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  if (!post.is_anonymous && post.user_id) {
                    router.push(`/user/${post.user_id}`);
                  }
                }}
                disabled={post.is_anonymous}
              >
                <Body weight="semibold">{displayName}</Body>
              </TouchableOpacity>
              <Caption color="secondary">{formatTime(post.created_at)}</Caption>
            </View>

            {/* Post Content */}
            <Body style={{ lineHeight: 24, marginBottom: 12 }}>
              {post.content}
            </Body>

            {/* Location */}
            {post.location_name && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <MapPin size={14} color={colors.textSecondary} />
                <Caption color="secondary" style={{ marginLeft: 4 }}>
                  {post.location_name} • {formatDistance(post.distance)}
                </Caption>
              </View>
            )}

            {/* Post Stats */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ArrowBigUp size={20} color={colors.primary} strokeWidth={2} />
                <Body weight="semibold" variant="small" style={{ marginLeft: 4 }}>
                  {post.score || 0}
                </Body>
              </View>
              <Caption color="secondary">
                {post.comment_count || 0} comments
              </Caption>
            </View>
          </Card>

          {/* Comments Section */}
          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <Heading variant="h3" style={{ marginBottom: 16 }}>
              Comments
            </Heading>

            {commentsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : comments && comments.length > 0 ? (
              comments.map((commentItem) => {
                const userVote = localVotes[commentItem.id];
                const displayScore = commentItem.score;

                return (
                  <Card key={commentItem.id} style={{ marginBottom: 12 }}>
                    {/* Comment Header */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (!commentItem.author.is_anonymous && commentItem.user_id) {
                            router.push(`/user/${commentItem.user_id}`);
                          }
                        }}
                        disabled={commentItem.author.is_anonymous}
                      >
                        <Body weight="semibold" variant="small">
                          {commentItem.author_nickname}
                        </Body>
                      </TouchableOpacity>
                      <Caption color="secondary">
                        {formatTime(commentItem.created_at)}
                      </Caption>
                    </View>

                    {/* Comment Content */}
                    <Body variant="small" style={{ lineHeight: 20, marginBottom: 8 }}>
                      {commentItem.content}
                    </Body>

                    {/* Comment Votes */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleVoteComment(commentItem.id, 1)}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ArrowBigUp
                          size={18}
                          color={userVote === 1 ? colors.accent : colors.textSecondary}
                          fill={userVote === 1 ? colors.accent : "transparent"}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                      <Caption weight="semibold">
                        {displayScore}
                      </Caption>
                      <TouchableOpacity
                        onPress={() => handleVoteComment(commentItem.id, -1)}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ArrowBigDown
                          size={18}
                          color={userVote === -1 ? colors.error : colors.textSecondary}
                          fill={userVote === -1 ? colors.error : "transparent"}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })
            ) : (
              <Caption color="secondary" style={{ textAlign: "center", marginTop: 20 }}>
                No comments yet. Be the first to comment!
              </Caption>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              backgroundColor: colors.inputBackground,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.text,
              marginRight: 12,
              minHeight: 48,
            }}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            onPress={handleCreateComment}
            disabled={!comment.trim() || createCommentMutation.isPending}
            style={{
              backgroundColor: comment.trim() ? colors.primary : colors.border,
              width: 48,
              height: 48,
              borderRadius: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <Send size={20} color={colors.primaryText} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
