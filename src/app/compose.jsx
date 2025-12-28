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
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, User, UserX, MapPin } from "lucide-react-native";
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../config/theme';
import { useAuth } from '../services/auth/useAuth';
import { supabase } from '../adapters/supabaseClient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Button, Card, Heading, Body, Caption, Modal } from '../ui/components/ui';
import PhotoPicker from '../ui/components/PhotoPicker';
import { compressImages } from '../services/storage/imageCompression';
import { uploadPhotos } from '../services/storage/photoUpload';
import { useCreatePostMutation } from '../services/posts/useCreatePost';
import { useEditPostMutation } from '../services/posts/usePostActions';
import CelebrationOverlay from '../ui/components/CelebrationOverlay';

export default function CreatePost() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { user, profile } = useAuth();
  const params = useLocalSearchParams();
  const isEditMode = params.mode === 'edit';
  const initialPost = params.post ? JSON.parse(params.post) : null;

  const createPostMutation = useCreatePostMutation();
  const editPostMutation = useEditPostMutation();

  const [content, setContent] = useState(initialPost?.content || '');
  const [isAnonymous, setIsAnonymous] = useState(initialPost?.is_anonymous || false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Locating...');
  // Standardize photos to always be array of URL strings
  const [photos, setPhotos] = useState(() => {
    if (!initialPost?.photos) return [];
    return initialPost.photos.map(p => {
      // Handle both object format {photo_url: "..."} and string format
      if (typeof p === 'string') return p;
      if (p && typeof p === 'object' && p.photo_url) return p.photo_url;
      console.warn('Invalid photo format:', p);
      return null;
    }).filter(Boolean); // Remove any null values
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [moderationError, setModerationError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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

  // Use profile's anonymous setting as initial state (only for new posts)
  useEffect(() => {
    if (profile && !isEditMode) {
      setIsAnonymous(profile.is_anonymous);
    }
  }, [profile, isEditMode]);

  useEffect(() => {
    loadLocationPreference();
    getCurrentLocation();
  }, []);

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
          // Prioritize name (e.g. "University of Tokyo"), then city, then region
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

  const handleCreatePost = async () => {
    Keyboard.dismiss();

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
      return;
    }

    if (content.trim().length > 200) {
      Alert.alert('Error', 'Post content must be 200 characters or less.');
      return;
    }

    if (!location && !isEditMode) {
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
      
      // Validate and separate photos
      // Existing photos: already uploaded (start with http/https)
      const existingPhotos = photos.filter(p => 
        typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://'))
      );
      
      // New photos: local URIs (typically start with file://)
      const newPhotoUris = photos.filter(p => 
        typeof p === 'string' && 
        !p.startsWith('http://') && 
        !p.startsWith('https://') &&
        p.length > 0
      );
      
      console.log('[Compose] Photos state length:', photos.length);
      console.log('[Compose] Photos state types:', photos.map(p => typeof p));
      console.log('[Compose] Photos state values:', photos);
      console.log('[Compose] Existing photos:', existingPhotos);
      console.log('[Compose] New photo URIs to upload:', newPhotoUris);
      console.log('[Compose] New photo URI types:', newPhotoUris.map(p => typeof p));

      if (newPhotoUris.length > 0) {
        // Compress images (compressImages expects array of URI strings)
        console.log('Starting compression...');
        const compressed = await compressImages(newPhotoUris, {
          maxWidth: 1920,
          quality: 0.8,
        });
        
        console.log('Compression complete, uploading...');
        // Upload compressed images
        const compressedUris = compressed.map(img => img.uri);
        const { urls, errors } = await uploadPhotos(user.id, compressedUris);
        
        if (errors.length > 0) {
          console.error('Photo upload errors:', errors);
          Alert.alert('Warning', 'Some photos failed to upload. Continue anyway?', [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Continue', onPress: () => submitPost([...existingPhotos, ...urls]) },
          ]);
          return;
        }
        
        photoUrls = [...existingPhotos, ...urls];
      } else {
        photoUrls = existingPhotos;
      }

      await submitPost(photoUrls);

    } catch (error) {
      console.error('Error creating/editing post:', error);

      // Check for content moderation error
      if (error.message && error.message.includes('prohibited content')) {
        setModerationError(error.message);
      } else {
        Alert.alert('Error', `Failed to ${isEditMode ? 'save' : 'create'} post. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitPost = async (photoUrls) => {
    try {
      if (isEditMode) {
        await editPostMutation.mutateAsync({
          postId: initialPost.id,
          content: content.trim(),
          isAnonymous,
          photos: photoUrls,
        });
        setSuccessMessage("Post updated successfully");
      } else {
        console.log('[Compose] Creating post with photos:', photoUrls);
        await createPostMutation.mutateAsync({
          userId: user.id,
          content: content.trim(),
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          locationName: showLocation ? locationName : null,
          userNickname: profile?.nickname,
          userIsAnonymous: isAnonymous,
          photos: photoUrls,
        });
        console.log('[Compose] Post created successfully, showing confetti');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowCelebration(true);
        console.log('[Compose] Celebration state set to:', true);
      }
    } catch (error) {
      console.error('[Compose] Error in submitPost:', error);
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

        <CelebrationOverlay
          visible={showCelebration}
          onComplete={() => {
            setShowCelebration(false);
            router.back();
          }}
        />

        {/* Moderation Error Modal */}
        <Modal
          visible={!!moderationError}
          onClose={() => setModerationError(null)}
          title="Post Rejected"
          message={moderationError}
          actions={[
            {
              text: 'OK',
              onPress: () => setModerationError(null),
              style: 'primary'
            }
          ]}
        />

        {/* Success Modal */}
        <Modal
          visible={!!successMessage}
          onClose={() => {
            setSuccessMessage(null);
            router.back();
          }}
          title="Success"
          message={successMessage}
          actions={[
            {
              text: 'OK',
              onPress: () => {
                setSuccessMessage(null);
                router.back();
              },
              style: 'primary'
            }
          ]}
        />

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
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>

              <Heading variant="h2">{isEditMode ? 'Edit Post' : 'Create Post'}</Heading>

              <Button
                variant="primary"
                size="small"
                onPress={handleCreatePost}
                disabled={loading || !content.trim() || isOverLimit}
                style={{ minWidth: 80 }}
              >
                {loading ? 'Saving...' : (isEditMode ? 'Save' : 'Post')}
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

                  {/* Location Display */}
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
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
