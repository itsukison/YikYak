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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { router } from 'expo-router';
import { useTheme } from '../utils/theme';
import { useAuth } from '../utils/auth/useAuth';
import { supabase } from '../utils/supabase';
import * as Location from 'expo-location';
import { Button, Card, Heading, Body, Caption } from '../components/ui';
import PhotoPicker from '../components/PhotoPicker';
import { compressImages } from '../services/storage/imageCompression';
import { uploadPhotos } from '../services/storage/photoUpload';
import { useCreatePostMutation } from '../utils/queries/posts';

export default function CreatePost() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { user, profile } = useAuth();
  const createPostMutation = useCreatePostMutation();

  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
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

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
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
      // Step 1: Compress and upload photos if any
      let photoUrls = [];
      if (photos.length > 0) {
        const compressed = await compressImages(photos, {
          maxWidth: 1920,
          quality: 0.8,
        });

        const compressedUris = compressed.map(img => img.uri);
        const { urls, errors } = await uploadPhotos(user.id, compressedUris);

        if (errors.length > 0) {
          console.error('Photo upload errors:', errors);
          Alert.alert('Warning', 'Some photos failed to upload. Continue anyway?', [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Continue', onPress: () => createPostWithMutation(urls) },
          ]);
          return;
        }

        photoUrls = urls;
      }

      await createPostWithMutation(photoUrls);

    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createPostWithMutation = async (photoUrls) => {
    try {
      await createPostMutation.mutateAsync({
        userId: user.id,
        content: content.trim(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationName: 'University of Tokyo',
        userNickname: profile?.nickname,
        userIsAnonymous: isAnonymous,
        photos: photoUrls,
      });

      Alert.alert('Success', 'Your post has been created!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      throw error;
    }
  };

  const characterCount = content.length;
  const maxCharacters = 200;
  const isOverLimit = characterCount > maxCharacters;
  const isNearLimit = characterCount >= 180;

  // Handle loading and auth states
  const showLoading = !user || !profile;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {showLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Body>Loading...</Body>
          </View>
        ) : (
          <>
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
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>

              <Heading variant="h2">Create Post</Heading>

              <Button
                variant="primary"
                size="small"
                onPress={handleCreatePost}
                disabled={loading || !content.trim() || isOverLimit}
                style={{ minWidth: 80 }}
              >
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </View>

            {/* Content */}
            <ScrollView style={{ flex: 1 }}>
              <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                {/* Text Input - Main Focus */}
                <TextInput
                  style={{
                    fontSize: 24,
                    color: colors.text,
                    textAlignVertical: 'top',
                    minHeight: 150,
                    fontWeight: '400',
                    marginBottom: 24,
                  }}
                  placeholder="What's happening?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  value={content}
                  onChangeText={setContent}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  maxLength={maxCharacters}
                  autoFocus
                />

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

                {/* Photo Picker */}
                <View style={{ marginBottom: 24 }}>
                  <PhotoPicker photos={photos} onPhotosChange={setPhotos} />
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
                        <MaterialIcons
                          name={isAnonymous ? "person-off" : "person"}
                          size={20}
                          color={colors.textSecondary}
                        />
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
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
