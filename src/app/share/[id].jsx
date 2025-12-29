import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
    Animated,
    KeyboardAvoidingView,
    ScrollView,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X, User, UserX, ChevronDown, MapPin } from "lucide-react-native";
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../config/theme';
import { useAuth } from '../../services/auth/useAuth';
import * as Location from 'expo-location';
import { Button, Heading, Body, Caption, Avatar } from '../../ui/components/ui';
import { useCreatePostMutation } from '../../services/posts/useCreatePost';
import { usePostQuery } from '../../services/posts/usePosts';
import CelebrationOverlay from '../../ui/components/CelebrationOverlay';
import * as Haptics from 'expo-haptics';

export default function RepostScreen() {
    const params = useLocalSearchParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const passedPost = params.post ? JSON.parse(params.post) : null;

    const insets = useSafeAreaInsets();
    const { colors, radius, isDark, spacing } = useTheme();
    const { user, profile } = useAuth();
    const createPostMutation = useCreatePostMutation();
    
    // Only fetch if post wasn't passed (e.g., direct URL access)
    const { data: fetchedPost, isLoading: isLoadingPost, error: postError } = usePostQuery(id, {
        enabled: !passedPost && !!id
    });
    
    const originalPost = passedPost || fetchedPost;

    // console.log("RepostScreen Debug:", { id, originalPost, error: postError, isLoading: isLoadingPost });

    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationName, setLocationName] = useState('Locating...');
    const [showLocation, setShowLocation] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const focusedPadding = 12;

    // Animation for keyboard
    const paddingAnimation = useRef(new Animated.Value(insets.bottom + focusedPadding)).current;

    const handleInputFocus = () => {
        if (Platform.OS === 'web') return;
        Animated.timing(paddingAnimation, {
            toValue: focusedPadding,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleInputBlur = () => {
        if (Platform.OS === 'web') return;
        Animated.timing(paddingAnimation, {
            toValue: insets.bottom + focusedPadding,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    // Get location on mount
    useEffect(() => {
        loadLocationPreference();
        getCurrentLocation();
    }, []);

    // Use profile's anonymous setting as initial state
    useEffect(() => {
        if (profile) {
            setIsAnonymous(profile.is_anonymous);
        }
    }, [profile]);

    const loadLocationPreference = async () => {
        try {
            const saved = await AsyncStorage.getItem('post_show_location_preference');
            if (saved !== null) {
                setShowLocation(JSON.parse(saved));
            }
        } catch (e) {
            console.warn("Failed to load location preference", e);
        }
    };

    const toggleLocationPreference = async () => {
        const newValue = !showLocation;
        setShowLocation(newValue);
        try {
            await AsyncStorage.setItem('post_show_location_preference', JSON.stringify(newValue));
        } catch (e) {
            console.warn("Failed to save location preference", e);
        }
    };

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission',
                    'Location access is required to create location-based posts.',
                    [{ text: 'OK' }]
                );
                setLocationName('Unknown Location');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            // Reverse geocode to get location name
            try {
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude
                });

                if (reverseGeocode && reverseGeocode.length > 0) {
                    const address = reverseGeocode[0];
                    const name = address.name || address.city || address.region || 'Unknown Location';
                    setLocationName(name);
                } else {
                    setLocationName('Unknown Location');
                }
            } catch (geoError) {
                console.error('Error reverse geocoding:', geoError);
                setLocationName('Unknown Location');
            }

        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to get your location. Please try again.');
            setLocationName('Unknown Location');
        }
    };

    const handleRepost = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please add your thoughts before reposting.');
            return;
        }

        if (content.trim().length > 200) {
            Alert.alert('Error', 'Post content must be 200 characters or less.');
            return;
        }

        if (!location) {
            Alert.alert('Error', 'Location is required to create a post.');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to create a post.');
            return;
        }

        setLoading(true);

        try {
            await createPostMutation.mutateAsync({
                userId: user.id,
                content: content.trim(),
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                locationName: showLocation ? locationName : null,
                userNickname: profile?.nickname,
                userIsAnonymous: isAnonymous,
                photos: [],
                repostOf: parseInt(id),
            });

            // Success! Show celebration animation with confetti
            if (Platform.OS !== 'web' && Haptics) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setShowCelebration(true);
            // Navigation handled by celebration onComplete callback
        } catch (error) {
            console.error('Error creating repost:', error);
            Alert.alert('Error', 'Failed to share post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const characterCount = content.length;
    const maxCharacters = 200;
    const isOverLimit = characterCount > maxCharacters;
    const isNearLimit = characterCount >= 180;

    // Only show full loading for user/profile (essential for form)
    // Post can load progressively in the UI
    const showFullLoading = !user || !profile || !id;

    if (showFullLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                
                {/* Header skeleton */}
                <View style={{ 
                    paddingTop: insets.top, 
                    paddingHorizontal: 20, 
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border 
                }}>
                    <View style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
                        <Caption color="secondary">Loading...</Caption>
                    </View>
                </View>
                
                {/* Content skeleton */}
                <View style={{ padding: 20 }}>
                    <View style={{ 
                        height: 100, 
                        backgroundColor: colors.surface, 
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Caption color="secondary">Loading post...</Caption>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <StatusBar style={isDark ? 'light' : 'dark'} />

                {/* Header */}
                <View
                    style={{
                        paddingTop: insets.top,
                        paddingHorizontal: 20,
                        paddingBottom: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 48,
                            height: 48,
                            justifyContent: 'center',
                            alignItems: 'flex-start'
                        }}
                    >
                        <X size={24} color={colors.text} />
                    </TouchableOpacity>

                    <Heading variant="h2">Repost</Heading>

                    <Button
                        variant="primary"
                        size="small"
                        onPress={handleRepost}
                        disabled={loading || !content.trim() || isOverLimit}
                        style={{ minWidth: 80 }}
                    >
                        {loading ? 'Posting...' : 'Repost'}
                    </Button>
                </View>

                {/* Content */}
                <ScrollView style={{ flex: 1 }}>
                    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>

                        {/* Text Input */}
                        <TextInput
                            style={{
                                fontSize: 20,
                                color: colors.text,
                                textAlignVertical: 'top',
                                minHeight: 60,
                                fontWeight: '400',
                                marginBottom: 24,
                            }}
                            placeholder="What's on your mind?"
                            placeholderTextColor={colors.textTertiary}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            maxLength={maxCharacters}
                            autoFocus
                        />

                        {/* Quoted Post */}
                        {isLoadingPost && !originalPost ? (
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: radius.card,
                                    padding: 16,
                                    marginBottom: 24,
                                    backgroundColor: colors.surface,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 80,
                                }}
                            >
                                <Caption color="secondary">Loading original post...</Caption>
                            </View>
                        ) : originalPost ? (
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: radius.card,
                                    padding: 16,
                                    marginBottom: 24,
                                    backgroundColor: colors.surface,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: colors.surfaceElevated,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 8,
                                            borderWidth: 1,
                                            borderColor: colors.border
                                        }}
                                    >
                                        {(originalPost.is_anonymous) ? (
                                            <UserX size={14} color={colors.textSecondary} />
                                        ) : (
                                            <User size={14} color={colors.textSecondary} />
                                        )}
                                    </View>
                                    <Body weight="bold" style={{ fontSize: 14 }}>
                                        {originalPost.users?.is_anonymous ? 'Anonymous' : originalPost.users?.nickname || 'Unknown'}
                                    </Body>
                                    <Caption color="secondary" style={{ marginLeft: 8 }}>
                                        {new Date(originalPost.created_at).toLocaleDateString()}
                                    </Caption>
                                </View>
                                <Body style={{ fontSize: 14, color: colors.textSecondary }}>
                                    {originalPost.content}
                                </Body>
                            </View>
                        ) : (
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: radius.card,
                                    padding: 16,
                                    marginBottom: 24,
                                    backgroundColor: colors.surface,
                                }}
                            >
                                <Caption color="secondary" style={{ textAlign: 'center' }}>
                                    Post not found or unavailable
                                </Caption>
                                {postError && (
                                    <Caption color="secondary" style={{ marginTop: 8, textAlign: 'center', fontSize: 11 }}>
                                        {postError.message || "Unknown error"}
                                    </Caption>
                                )}
                            </View>
                        )}

                        {/* Character Count */}
                        <View style={{ alignItems: 'flex-end', marginBottom: 24 }}>
                            <Caption
                                style={{
                                    color: isOverLimit ? colors.error : isNearLimit ? colors.error : colors.textSecondary
                                }}
                            >
                                {characterCount}/{maxCharacters}
                            </Caption>
                        </View>

                        {/* Options Section */}
                        <View style={{ gap: 20 }}>
                            {/* Anonymous Toggle */}
                            <TouchableOpacity
                                onPress={() => setIsAnonymous(!isAnonymous)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 12,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 20,
                                            backgroundColor: colors.surfaceElevated,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 12
                                        }}
                                    >
                                        {isAnonymous ? (
                                            <UserX size={20} color={colors.textSecondary} />
                                        ) : (
                                            <User size={20} color={colors.textSecondary} />
                                        )}
                                    </View>
                                    <View>
                                        <Body weight="medium">
                                            {isAnonymous ? 'Anonymous' : 'Public'}
                                        </Body>
                                        <Caption color="secondary">
                                            {isAnonymous ? 'Your identity is hidden' : `Posting as ${profile?.nickname || 'User'}`}
                                        </Caption>
                                    </View>
                                </View>

                                <View
                                    style={{
                                        width: 50,
                                        height: 30,
                                        borderRadius: 15,
                                        backgroundColor: isAnonymous ? colors.surface : colors.primary,
                                        justifyContent: 'center',
                                        alignItems: isAnonymous ? 'flex-start' : 'flex-end',
                                        paddingHorizontal: 2,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: 13,
                                            backgroundColor: '#FFFFFF',
                                            shadowColor: colors.shadow,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 4,
                                            elevation: 4,
                                        }}
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Location Toggle */}
                            {location && (
                                <TouchableOpacity
                                    onPress={toggleLocationPreference}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 12,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                backgroundColor: colors.surface,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 12
                                            }}
                                        >
                                            <MapPin size={20} color={colors.textSecondary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Body weight="medium">Location</Body>
                                            <Caption color="secondary">
                                                {showLocation
                                                    ? `${locationName} • Visible to nearby`
                                                    : 'Hidden • Post still appears nearby'}
                                            </Caption>
                                        </View>
                                    </View>

                                    {/* Toggle Switch */}
                                    <View
                                        style={{
                                            width: 50,
                                            height: 30,
                                            borderRadius: 15,
                                            backgroundColor: showLocation ? colors.primary : colors.surface,
                                            justifyContent: 'center',
                                            alignItems: showLocation ? 'flex-end' : 'flex-start',
                                            paddingHorizontal: 2,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: 13,
                                                backgroundColor: '#FFFFFF',
                                                shadowColor: colors.shadow,
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                elevation: 4,
                                            }}
                                        />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                    </View>
                </ScrollView>

                {/* Bottom Padding */}
                <Animated.View
                    style={{
                        paddingBottom: paddingAnimation,
                    }}
                />
            </View>

            {/* Celebration Overlay */}
            <CelebrationOverlay
                visible={showCelebration}
                onComplete={() => {
                    setShowCelebration(false);
                    router.back();
                }}
            />
        </KeyboardAvoidingView>
    );
}
