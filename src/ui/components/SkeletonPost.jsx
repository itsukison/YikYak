import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { useTheme } from "../../config/theme";

// Reusable skeleton box with shimmer animation
const SkeletonBox = ({ width, height, radius, delay = 0, style }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start animation after delay
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export default function SkeletonPost({ index = 0 }) {
  const { colors, radius, spacing } = useTheme();

  // Stagger animation delay for cascade effect
  const baseDelay = index * 100;

  return (
    <View
      style={{
        backgroundColor: "transparent",
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderLight,
      }}
    >
      {/* Header Section */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {/* Avatar Skeleton - 32px circle (small size) */}
          <SkeletonBox width={32} height={32} radius={16} delay={baseDelay} />

          {/* Author & Location Stack */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Author name skeleton */}
            <SkeletonBox
              width={120}
              height={16}
              radius={radius.small}
              delay={baseDelay + 50}
            />

            {/* Location skeleton */}
            <SkeletonBox
              width={80}
              height={12}
              radius={radius.small}
              delay={baseDelay + 100}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        {/* Time skeleton */}
        <SkeletonBox
          width={30}
          height={12}
          radius={radius.small}
          delay={baseDelay + 150}
          style={{ marginLeft: 8 }}
        />
      </View>

      {/* Content Text Skeleton - 3 lines */}
      <View style={{ marginBottom: spacing.lg }}>
        <SkeletonBox
          width="100%"
          height={14}
          radius={radius.small}
          delay={baseDelay + 200}
        />
        <SkeletonBox
          width="90%"
          height={14}
          radius={radius.small}
          delay={baseDelay + 250}
          style={{ marginTop: 8 }}
        />
        <SkeletonBox
          width="75%"
          height={14}
          radius={radius.small}
          delay={baseDelay + 300}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Actions Row Skeleton */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Vote pill skeleton */}
          <SkeletonBox
            width={80}
            height={32}
            radius={radius.pill}
            delay={baseDelay + 350}
          />

          {/* Comment pill skeleton */}
          <SkeletonBox
            width={60}
            height={32}
            radius={radius.pill}
            delay={baseDelay + 400}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Repost button skeleton */}
          <SkeletonBox
            width={32}
            height={32}
            radius={16}
            delay={baseDelay + 450}
          />

          {/* More button skeleton */}
          <SkeletonBox
            width={32}
            height={32}
            radius={16}
            delay={baseDelay + 500}
          />
        </View>
      </View>
    </View>
  );
}
