import React, { useEffect, useRef } from 'react';
import { View, Dimensions, StyleSheet, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { Check } from "lucide-react-native";
import { useTheme } from '../../config/theme';
import { Heading, Body } from './ui';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 60; // Increased slightly for better density

const Particle = ({ index }) => {
    const { colors } = useTheme();

    // Randomize initial properties
    const angle = Math.random() * Math.PI * 2;
    const velocity = 200 + Math.random() * 300; // Increased speed
    const size = 8 + Math.random() * 6;
    const isRectangle = Math.random() > 0.5;
    const width = size;
    const height = isRectangle ? size * (0.4 + Math.random() * 0.4) : size; // Varied aspect ratio

    // Animation values
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const rotateX = useRef(new Animated.Value(0)).current;
    const rotateY = useRef(new Animated.Value(0)).current;
    const rotateZ = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0)).current;

    // Colors from the theme
    const particleColors = [
        colors.primary,    // Neon Green
        colors.secondary,  // Darker Green
        '#FFFFFF',        // White
        colors.primary,    // More Neon Green
        '#FFD700',        // Gold
        '#FF69B4',        // Hot Pink (for contrast)
        '#00BFFF',        // Deep Sky Blue (for contrast)
    ];
    const color = particleColors[index % particleColors.length];

    useEffect(() => {
        const delay = Math.random() * 200;
        const duration = 2000 + Math.random() * 1000;

        // Physics targets
        const endX = Math.cos(angle) * (velocity * 0.8) + (Math.random() * 100 - 50); // Add some spread
        const endY = Math.sin(angle) * (velocity * 0.8) + 500; // Stronger gravity

        // Rotation targets (multiple spins)
        const spinCount = 2 + Math.random() * 4;

        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                // Scale in
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 6,
                    useNativeDriver: true, // Native driver supports transforms
                }),
                // Move X (Linearish with some easing)
                Animated.timing(translateX, {
                    toValue: endX,
                    duration: duration,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                // Move Y (Gravity)
                Animated.timing(translateY, {
                    toValue: endY,
                    duration: duration,
                    easing: Easing.bezier(0.3, 0.1, 0.4, 1),
                    useNativeDriver: true,
                }),
                // 3D Rotations (Tumbling)
                Animated.timing(rotateX, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateY, {
                    toValue: 1,
                    duration: duration * 0.8, // Sync slightly differently
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateZ, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                // Fade out at end
                Animated.sequence([
                    Animated.delay(duration * 0.7),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: duration * 0.3,
                        useNativeDriver: true,
                    })
                ])
            ])
        ]).start();
    }, []);

    // Interpolate rotations
    const rotX = rotateX.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${360 * (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2)}deg`]
    });
    const rotY = rotateY.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${360 * (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2)}deg`]
    });
    const rotZ = rotateZ.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${360 * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random())}deg`]
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: width,
                height: height,
                backgroundColor: color,
                borderRadius: isRectangle ? 2 : width / 2,
                opacity: opacity,
                transform: [
                    { translateX: translateX },
                    { translateY: translateY },
                    { rotateX: rotX },
                    { rotateY: rotY },
                    { rotateZ: rotZ },
                    { scale: scale },
                    { perspective: 1000 } // Important for 3D effect
                ],
            }}
        />
    );
};

export default function CelebrationOverlay({ visible, onComplete }) {
    const { colors, isDark } = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;
    const hasCompleted = useRef(false);

    useEffect(() => {
        if (visible) {
            hasCompleted.current = false;
            // Fade in background
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Scale up success icon
            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.2,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                })
            ]).start();

            // Auto dismiss after animation
            const timeout = setTimeout(() => {
                handleComplete();
            }, 3000); // Slightly longer to enjoy the fall

            return () => clearTimeout(timeout);
        }
    }, [visible]);

    const handleComplete = () => {
        if (hasCompleted.current) return;
        hasCompleted.current = true;

        Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            // Always call onComplete, even if animation was interrupted
            if (onComplete) {
                onComplete();
            }
        });
    };

    if (!visible) return null;

    return (
        <TouchableWithoutFeedback onPress={handleComplete}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        opacity: opacity,
                    },
                ]}
            >
                {/* Particles */}
                <View style={{ position: 'absolute', left: SCREEN_WIDTH / 2, top: SCREEN_HEIGHT / 2 - 150 }} pointerEvents="none">
                    {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
                        <Particle key={i} index={i} />
                    ))}
                </View>

                {/* Success Icon & Text */}
                <Animated.View style={{ alignItems: 'center', transform: [{ scale: scale }] }} pointerEvents="none">
                    <View
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 24,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.3,
                            shadowRadius: 20,
                            elevation: 10,
                        }}
                    >
                        <Check size={60} color={colors.primaryText} />
                    </View>
                    <Heading variant="h2" style={{ marginBottom: 8, textAlign: 'center' }}>
                        Posted!
                    </Heading>
                    <Body style={{ color: colors.textSecondary, textAlign: 'center' }}>
                        Your post is now live.
                    </Body>
                </Animated.View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
