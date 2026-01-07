import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ArrowUp, ArrowDown } from "lucide-react-native";
import { useTheme } from "../../../config/theme";
import { Body } from "../ui/Text";

/**
 * Reusable Vote Pill Component
 *
 * Displays upvote/downvote buttons with score count in a pill-shaped container.
 * Used for posts and comments.
 *
 * @param {number} score - Current vote score
 * @param {string|null} userVote - User's current vote ("up", "down", or null)
 * @param {Function} onVoteUp - Callback when upvote is pressed
 * @param {Function} onVoteDown - Callback when downvote is pressed
 * @param {boolean} disabled - Whether voting is disabled
 * @param {string} size - Size variant ("small" | "medium" | "large")
 * @param {boolean} showScore - Whether to show the score number (default: true)
 *
 * @example
 * <VotePill
 *   score={post.score}
 *   userVote={userVote}
 *   onVoteUp={() => handleVote('up')}
 *   onVoteDown={() => handleVote('down')}
 *   disabled={isVoting}
 * />
 */
export default function VotePill({
  score = 0,
  userVote = null,
  onVoteUp,
  onVoteDown,
  disabled = false,
  size = "medium",
  showScore = true,
}) {
  const { colors, radius } = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      height: 28,
      iconSize: 14,
      fontSize: 11,
      paddingHorizontal: 8,
    },
    medium: {
      height: 32,
      iconSize: 16,
      fontSize: 12,
      paddingHorizontal: 8,
    },
    large: {
      height: 36,
      iconSize: 18,
      fontSize: 14,
      paddingHorizontal: 10,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Color logic based on user vote
  const upvoteColor = userVote === "up" ? colors.primary : colors.text;
  const downvoteColor = userVote === "down" ? colors.error : colors.text;

  const scoreColor =
    userVote === "up"
      ? colors.primary
      : userVote === "down"
      ? colors.error
      : colors.text;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.border,
          height: config.height,
          paddingHorizontal: config.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {/* Upvote Button */}
      <TouchableOpacity
        onPress={onVoteUp}
        disabled={disabled}
        style={[
          styles.voteButton,
          {
            paddingHorizontal: config.paddingHorizontal,
          },
        ]}
        activeOpacity={0.6}
      >
        <ArrowUp size={config.iconSize} color={upvoteColor} />
        {showScore && (
          <Body
            weight="bold"
            style={{
              marginLeft: 4,
              color: scoreColor,
              fontSize: config.fontSize,
            }}
          >
            {score}
          </Body>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: colors.border,
          },
        ]}
      />

      {/* Downvote Button */}
      <TouchableOpacity
        onPress={onVoteDown}
        disabled={disabled}
        style={[
          styles.voteButton,
          {
            paddingHorizontal: config.paddingHorizontal,
          },
        ]}
        activeOpacity={0.6}
      >
        <ArrowDown size={config.iconSize} color={downvoteColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  divider: {
    width: 1,
    height: 16,
  },
});
