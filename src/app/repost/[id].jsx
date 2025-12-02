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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../utils/theme';
import { useAuth } from '../../utils/auth/useAuth';
import * as Location from 'expo-location';
import { Button, Heading, Body, Caption, Avatar } from '../../components/ui';
import { useCreatePostMutation, usePostQuery } from '../../utils/queries/posts';

export default function RepostScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { colors, radius, isDark, spacing } = useTheme();
    const { user, profile } = useAuth();
    const createPostMutation = useCreatePostMutation();
    const { data: originalPost, isLoading: isLoadingPost } = usePostQuery(id);

    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const focusedPadding = 12;

    const paddingAnimation = useRef(
        new Animated.Value(insets.bottom + focusedPadding)
    ).current;

    const animateTo = (value) => {
        Animated.timing(paddingAnimation, {
            toValue: value,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleInputFocus = () => {
        if (Platform.OS === 'web') {
            return;
        }
        animateTo(focusedPadding);
    };

    const handleInputBlur = () => {
        if (Platform.OS === 'web') {
            return;
        }
        animateTo(insets.bottom + focusedPadding);
    };

    // Use profile's anonymous setting as initial state
    useEffect(() => {
        if (profile) {
            setIsAnonymous(profile.is_anonymous);
        }
    }, [profile]);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission',
                    'Location access is required to create location-based posts.',
                    [{ text: 'OK' }]
                );
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to get your location. Please try again.');
        }
    };

    const handleRepost = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter some content for your repost.');
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
                locationName: 'University of Tokyo', // Ideally fetch this
                userNickname: profile?.nickname,
                userIsAnonymous: isAnonymous,
                repostOf: id,
            });

            Alert.alert('Success', 'Reposted successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error creating repost:', error);
            Alert.alert('Error', 'Failed to create repost. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const characterCount = content.length;
    const maxCharacters = 200;
    const isOverLimit = characterCount > maxCharacters;
    const isNearLimit = characterCount >= 180;

    // Handle loading and auth states
    const showLoading = !user || !profile || isLoadingPost;

    if (showLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <Body>Loading...</Body>
            </View>
        );
    }

    if (!originalPost) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <Body>Post not found</Body>
                <Button variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }}>Go Back</Button>
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
                        <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <Heading variant="h2">New Post</Heading>

                    <Button
                        variant="primary"
                        size="small"
                        onPress={handleRepost}
                        disabled={loading || !content.trim() || isOverLimit}
                        style={{ minWidth: 80 }}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </Button>
                </View>

                {/* Content */}
                <ScrollView style={{ flex: 1 }}>
                    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>

                        {/* User Info (Current User) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
                                <MaterialIcons
                                    name={isAnonymous ? "person-off" : "person"}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </View>
                            <View>
                                <Body weight="bold">
                                    {isAnonymous ? 'Anonymous' : profile?.nickname || 'User'}
                                </Body>
                                <TouchableOpacity onPress={() => setIsAnonymous(!isAnonymous)}>
                                    <Caption color="secondary" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {isAnonymous ? 'Hidden Identity' : 'Public Identity'} <MaterialIcons name="keyboard-arrow-down" size={14} />
                                    </Caption>
                                </TouchableOpacity>
                            </View>
                        </View>


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
                                    <MaterialIcons
                                        name={originalPost.is_anonymous ? "person-off" : "person"}
                                        size={14}
                                        color={colors.textSecondary}
                                    />
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
                            {/* Location Display */}
                            {location && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
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
                                        <MaterialIcons name="place" size={20} color={colors.textSecondary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Body weight="medium">Location</Body>
                                        <Caption color="secondary">
                                            University of Tokyo • Visible to nearby students
                                        </Caption>
                                    </View>
                                </View>
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
        </KeyboardAvoidingView>
    );
}
