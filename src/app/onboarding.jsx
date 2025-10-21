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

export default function OnboardingScreen() {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { colors, isDark } = useTheme();

  const handleComplete = async () => {
    // Validation
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (nickname.length > 20) {
      setError('Nickname must be 20 characters or less');
      return;
    }

    if (bio.length > 150) {
      setError('Bio must be 150 characters or less');
      return;
    }

    setLoading(true);
    setError('');

    console.log('Onboarding: Updating profile with onboarding_completed=true');
    const { data, error: updateError } = await updateProfile({
      nickname: nickname.trim(),
      bio: bio.trim() || null,
      is_anonymous: isAnonymous,
      onboarding_completed: true,
    });

    console.log('Onboarding: Profile updated', { data, error: updateError });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || 'Failed to update profile');
    }
    // Don't manually navigate - let root layout handle it automatically
    // The profile state will update and trigger the routing logic
  };

  const handleSkip = async () => {
    setLoading(true);
    
    // Set default values
    const { error: updateError } = await updateProfile({
      nickname: 'Anonymous User',
      bio: null,
      is_anonymous: true,
      onboarding_completed: true,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message || 'Failed to update profile');
    }
    // Don't manually navigate - let root layout handle it automatically
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
