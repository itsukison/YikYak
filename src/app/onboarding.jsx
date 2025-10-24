import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../utils/auth/useAuth';
import { useTheme } from '../utils/theme';
import { supabase } from '../utils/supabase';

export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { updateProfile, user, profile, setProfile, fetchProfile } = useAuth();
  const { colors, isDark } = useTheme();

  // Validate username format
  const validateUsername = (value) => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  // Check username uniqueness (case-insensitive)
  const checkUsernameAvailability = async (value) => {
    if (!value || validateUsername(value)) return false;
    
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .ilike('username', value) // Case-insensitive match
        .maybeSingle(); // Returns null if not found, doesn't throw error
      
      setCheckingUsername(false);
      
      if (error) {
        console.error('Error checking username:', error);
        setUsernameError('Error checking username availability');
        return false;
      }
      
      if (data) {
        setUsernameError('Username is already taken');
        return false;
      }
      
      setUsernameError('');
      return true;
    } catch (error) {
      console.error('Error checking username:', error);
      setCheckingUsername(false);
      setUsernameError('Error checking username availability');
      return false;
    }
  };

  const handleComplete = async () => {
    // Validate username
    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
      setError(usernameValidation);
      return;
    }

    // Validate nickname
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (nickname.length > 20) {
      setError('Nickname must be 20 characters or less');
      return;
    }

    // Validate bio
    if (bio.length > 150) {
      setError('Bio must be 150 characters or less');
      return;
    }

    // Check username availability one final time
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);
    setError('');

    // Optimistically update profile state immediately (before database call)
    const optimisticProfile = {
      ...profile,
      username: username.toLowerCase().trim(),
      nickname: nickname.trim(),
      bio: bio.trim() || null,
      is_anonymous: isAnonymous,
      onboarding_completed: true,
    };
    
    console.log('Onboarding: Optimistically updating profile state');
    setProfile(optimisticProfile);

    // Then update the database
    console.log('Onboarding: Updating profile in database');
    const { data, error: updateError } = await updateProfile({
      username: username.toLowerCase().trim(),
      nickname: nickname.trim(),
      bio: bio.trim() || null,
      is_anonymous: isAnonymous,
      onboarding_completed: true,
    });

    console.log('Onboarding: Profile updated', { data, error: updateError });

    if (updateError) {
      // Revert optimistic update on error by refetching actual state
      console.error('Onboarding: Database update failed, reverting optimistic update');
      if (user?.id) {
        await fetchProfile(user.id);
      }
      setError(updateError.message || 'Failed to update profile');
      setLoading(false);
    } else {
      // Navigation will happen automatically due to optimistic update
      console.log('Onboarding: Success, navigating to home');
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    
    // Generate random username
    const randomUsername = `user_${Math.random().toString(36).substring(2, 10)}`;
    
    // Optimistically update profile state immediately (before database call)
    const optimisticProfile = {
      ...profile,
      username: randomUsername,
      nickname: 'Anonymous User',
      bio: null,
      is_anonymous: true,
      onboarding_completed: true,
    };
    
    console.log('Onboarding: Skip - Optimistically updating profile state');
    setProfile(optimisticProfile);
    
    // Then update the database
    const { error: updateError } = await updateProfile({
      username: randomUsername,
      nickname: 'Anonymous User',
      bio: null,
      is_anonymous: true,
      onboarding_completed: true,
    });

    if (updateError) {
      // Revert optimistic update on error by refetching actual state
      console.error('Onboarding: Skip - Database update failed, reverting optimistic update');
      if (user?.id) {
        await fetchProfile(user.id);
      }
      setError(updateError.message || 'Failed to update profile');
      setLoading(false);
    } else {
      // Navigation will happen automatically due to optimistic update
      console.log('Onboarding: Skip - Success, navigating to home');
      router.replace('/(tabs)/home');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFF9F3' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
            Welcome to YikYak Japan! 🎉
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
            Let's set up your profile
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
              Username *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7',
                  color: isDark ? '#FFFFFF' : '#1C1C1E'
                }
              ]}
              placeholder="e.g., tokyo_student"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'}
              value={username}
              onChangeText={(value) => {
                const lowercaseValue = value.toLowerCase();
                setUsername(lowercaseValue);
                const error = validateUsername(lowercaseValue);
                setUsernameError(error || '');
              }}
              onBlur={() => checkUsernameAvailability(username)}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {checkingUsername && (
              <Text style={[styles.helperText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93' }]}>
                Checking availability...
              </Text>
            )}
            {usernameError && !checkingUsername && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}
            {!usernameError && !checkingUsername && (
              <Text style={[styles.helperText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
                Your unique identifier (3-20 characters, letters, numbers, underscore)
              </Text>
            )}
          </View>

          {/* Nickname Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
              Nickname *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7',
                  color: isDark ? '#FFFFFF' : '#1C1C1E'
                }
              ]}
              placeholder="Enter your nickname"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'}
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
            />
            <Text style={[styles.charCount, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
              {nickname.length}/20
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
              Bio (optional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7',
                  color: isDark ? '#FFFFFF' : '#1C1C1E'
                }
              ]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'}
              value={bio}
              onChangeText={setBio}
              maxLength={150}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
              {bio.length}/150
            </Text>
          </View>

          <View style={[
            styles.switchContainer,
            { backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7' }
          ]}>
            <View style={styles.switchLabel}>
              <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                Anonymous Mode
              </Text>
              <Text style={[styles.switchDescription, { color: isDark ? 'rgba(255,255,255,0.6)' : '#8E8E93' }]}>
                Hide your identity in posts
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#767577', true: '#FFCC00' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={[styles.skipText, { color: isDark ? 'rgba(255,255,255,0.6)' : '#8E8E93' }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  switchDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  button: {
    height: 56,
    backgroundColor: '#FFCC00',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
});
