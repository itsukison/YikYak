import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, MapPin, User, UserX } from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { router } from "expo-router";
import { useTheme } from "../utils/theme";
import { useAuth } from "../utils/auth/useAuth";
import { supabase } from "../utils/supabase";
import AppBackground from "../components/AppBackground";
import KeyboardAvoidingAnimatedView from "../components/KeyboardAvoidingAnimatedView";
import * as Location from 'expo-location';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const focusedPadding = 12;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

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
    if (Platform.OS === "web") {
      return;
    }
    animateTo(focusedPadding);
  };

  const handleInputBlur = () => {
    if (Platform.OS === "web") {
      return;
    }
    animateTo(insets.bottom + focusedPadding);
  };

  // Get real user data from auth
  const { user, profile } = useAuth();
  
  // Use profile's anonymous setting as initial state
  React.useEffect(() => {
    if (profile) {
      setIsAnonymous(profile.is_anonymous);
    }
  }, [profile]);

  React.useEffect(() => {
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

    if (content.trim().length > 500) {
      Alert.alert('Error', 'Post content must be 500 characters or less.');
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
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          location_name: 'University of Tokyo', // You could use reverse geocoding here
        })
        .select()
        .single();

      if (error) throw error;
      
      Alert.alert('Success', 'Your post has been created!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  // If no user or profile, show loading (root layout will handle redirect)
  if (!user || !profile) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: colors.text }}>
            Loading...
          </Text>
        </View>
      </AppBackground>
    );
  }

  const characterCount = content.length;
  const maxCharacters = 500;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
              color: colors.text,
            }}
          >
            Create Post
          </Text>

          <TouchableOpacity
            onPress={handleCreatePost}
            disabled={loading || !content.trim() || isOverLimit}
            style={{
              backgroundColor: 
                loading || !content.trim() || isOverLimit 
                  ? colors.inputBackground 
                  : colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color: 
                  loading || !content.trim() || isOverLimit 
                    ? colors.textSecondary 
                    : "#FFFFFF",
              }}
            >
              {loading ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
          {/* Anonymous Toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isAnonymous ? (
                <UserX size={20} color={colors.textSecondary} />
              ) : (
                <User size={20} color={colors.primary} />
              )}
              <Text
                style={{
                  fontFamily: 'Poppins_500Medium',
                  fontSize: 16,
                  color: colors.text,
                  marginLeft: 12,
                }}
              >
                {isAnonymous ? 'Post anonymously' : `Post as ${profile?.nickname || 'User'}`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsAnonymous(!isAnonymous)}
              style={{
                width: 50,
                height: 30,
                borderRadius: 15,
                backgroundColor: isAnonymous ? colors.primary : colors.inputBackground,
                justifyContent: 'center',
                alignItems: isAnonymous ? 'flex-end' : 'flex-start',
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
            </TouchableOpacity>
          </View>

          {/* Location Display */}
          {location && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <MapPin size={20} color={colors.accent} />
              <Text
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginLeft: 12,
                }}
              >
                University of Tokyo • Visible to nearby students
              </Text>
            </View>
          )}

          {/* Text Input */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <TextInput
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 18,
                color: colors.text,
                textAlignVertical: 'top',
                flex: 1,
                minHeight: 120,
              }}
              placeholder="What's happening on campus?"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={content}
              onChangeText={setContent}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              maxLength={maxCharacters + 50} // Allow some overflow for warning
            />

            {/* Character Count */}
            <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
              <Text
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 12,
                  color: isOverLimit ? colors.error : colors.textSecondary,
                }}
              >
                {characterCount}/{maxCharacters}
              </Text>
            </View>
          </View>

          {/* Guidelines */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginTop: 16,
            }}
          >
            <Text
              style={{
                fontFamily: 'Poppins_500Medium',
                fontSize: 14,
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Guidelines:
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 12,
                color: colors.textSecondary,
                lineHeight: 18,
              }}
            >
              • Be respectful and kind to fellow students{'\n'}
              • No spam, harassment, or inappropriate content{'\n'}
              • Share university-related thoughts and experiences{'\n'}
              • Your post will be visible to students within 5km
            </Text>
          </View>
        </View>

        {/* Bottom Padding */}
        <Animated.View
          style={{
            paddingBottom: paddingAnimation,
          }}
        />
      </AppBackground>
    </KeyboardAvoidingAnimatedView>
  );
}