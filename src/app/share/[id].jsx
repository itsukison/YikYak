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
import { X, User, UserX, ChevronDown, MapPin } from "lucide-react-native";
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../config/theme';
import { useAuth } from '../../services/auth/useAuth';
import * as Location from 'expo-location';
import { Button, Heading, Body, Caption, Avatar } from '../../ui/components/ui';
import { useCreatePostMutation } from '../../services/posts/useCreatePost';
import { usePostQuery } from '../../services/posts/usePosts';

export default function RepostScreen() {
    const params = useLocalSearchParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const insets = useSafeAreaInsets();
    const { colors, radius, isDark, spacing } = useTheme();
    const { user, profile } = useAuth();
    const createPostMutation = useCreatePostMutation();
    const { data: originalPost, isLoading: isLoadingPost, error: postError } = usePostQuery(id);

    // console.log("RepostScreen Debug:", { id, originalPost, error: postError, isLoading: isLoadingPost });

    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationName, setLocationName] = useState('Locating...');
    const focusedPadding = 12;

    // ... (animations)

    // ... (handlers)

    // ... (effects)

    // ... (location)

    // ... (repost logic)

    const characterCount = content.length;
    const maxCharacters = 200;
    const isOverLimit = characterCount > maxCharacters;
    const isNearLimit = characterCount >= 180;

    // Handle loading and auth states
    // Show loading if:
    // 1. User/Profile loading
    // 2. Post query loading
    // 3. ID is not yet ready (undefined/null)
    const showLoading = !user || !profile || isLoadingPost || !id;

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
                <Body>Post not found or unavailable.</Body>
                {postError && (
                    <Caption style={{ marginTop: 8, color: colors.error, textAlign: 'center', paddingHorizontal: 20 }}>
                        {postError.message || "Unknown error"}
                    </Caption>
                )}
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
                        <X size={24} color={colors.text} />
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
                                {isAnonymous ? (
                                    <UserX size={20} color={colors.textSecondary} />
                                ) : (
                                    <User size={20} color={colors.textSecondary} />
                                )}
                            </View>
                            <View>
                                <Body weight="bold">
                                    {isAnonymous ? 'Anonymous' : profile?.nickname || 'User'}
                                </Body>
                                <TouchableOpacity onPress={() => setIsAnonymous(!isAnonymous)}>
                                    <Caption color="secondary" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {isAnonymous ? 'Hidden Identity' : 'Public Identity'} <ChevronDown size={14} color={colors.textSecondary} />
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
                                        <MapPin size={20} color={colors.textSecondary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Body weight="medium">Location</Body>
                                        <Caption color="secondary">
                                            {locationName} • Visible to nearby students
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
