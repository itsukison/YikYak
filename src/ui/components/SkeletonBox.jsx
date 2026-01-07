import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
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

export default SkeletonBox;
