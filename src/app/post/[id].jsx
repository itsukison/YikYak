import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import AppBackground from "../../components/AppBackground";
import { useTheme } from "../../utils/theme";
import { useAuth } from "../../utils/auth/useAuth";
import {
  useCommentsQuery,
  useCommentVotesQuery,
  useCreateCommentMutation,
  useVoteCommentMutation,
} from "../../utils/queries/comments";

export default function PostDetailScreen() {
  const { id: postId, post: postJson } = useLocalSearchParams();
  const { isDark, colors } = useTheme();
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

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    if (userVotes) {
      setLocalVotes(userVotes);
    }
  }, [userVotes]);

  if (!fontsLoaded) {
    return null;
  }

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
            Post
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Post Card */}
          <View
            style={{
              backgroundColor: colors.card,
              marginHorizontal: 16,
              marginTop: 16,
              padding: 16,
              borderRadius: 20,
            }}
          >
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
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  {displayName}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                {formatTime(post.created_at)}
              </Text>
            </View>

            {/* Post Content */}
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
                color: colors.text,
                lineHeight: 24,
                marginBottom: 12,
              }}
            >
              {post.content}
            </Text>

            {/* Location */}
            {post.location_name && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginLeft: 4,
                  }}
                >
                  {post.location_name} • {formatDistance(post.distance)}
                </Text>
              </View>
            )}

            {/* Post Stats */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ArrowBigUp size={20} color={colors.primary} />
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 14,
                    color: colors.text,
                    marginLeft: 4,
                  }}
                >
                  {post.score || 0}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                {post.comment_count || 0} comments
              </Text>
            </View>
          </View>

          {/* Comments Section */}
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
                color: colors.text,
                marginBottom: 16,
              }}
            >
              Comments
            </Text>

            {commentsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : comments && comments.length > 0 ? (
              comments.map((commentItem) => {
                const userVote = localVotes[commentItem.id];
                const displayScore = commentItem.score + (userVote || 0) - (userVotes?.[commentItem.id] || 0);

                return (
                  <View
                    key={commentItem.id}
                    style={{
                      backgroundColor: colors.card,
                      padding: 12,
                      borderRadius: 16,
                      marginBottom: 12,
                    }}
                  >
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
                        <Text
                          style={{
                            fontFamily: "Poppins_600SemiBold",
                            fontSize: 14,
                            color: colors.text,
                          }}
                        >
                          {commentItem.author_nickname}
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {formatTime(commentItem.created_at)}
                      </Text>
                    </View>

                    {/* Comment Content */}
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 14,
                        color: colors.text,
                        lineHeight: 20,
                        marginBottom: 8,
                      }}
                    >
                      {commentItem.content}
                    </Text>

                    {/* Comment Votes */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleVoteComment(commentItem.id, 1)}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ArrowBigUp
                          size={18}
                          color={userVote === 1 ? colors.primary : colors.textSecondary}
                          fill={userVote === 1 ? colors.primary : "transparent"}
                        />
                      </TouchableOpacity>
                      <Text
                        style={{
                          fontFamily: "Poppins_600SemiBold",
                          fontSize: 13,
                          color: colors.text,
                        }}
                      >
                        {displayScore}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleVoteComment(commentItem.id, -1)}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ArrowBigDown
                          size={18}
                          color={userVote === -1 ? "#FF3B30" : colors.textSecondary}
                          fill={userVote === -1 ? "#FF3B30" : "transparent"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 20,
                }}
              >
                No comments yet. Be the first to comment!
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
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
              backgroundColor: colors.card,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontFamily: "Poppins_400Regular",
              fontSize: 15,
              color: colors.text,
              marginRight: 8,
            }}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            onPress={handleCreateComment}
            disabled={!comment.trim() || createCommentMutation.isPending}
            style={{
              backgroundColor: comment.trim() ? colors.primary : colors.border,
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
