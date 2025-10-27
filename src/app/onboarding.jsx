import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../utils/auth/useAuth';
import { useTheme } from '../utils/theme';
import { supabase } from '../utils/supabase';
import { Button, Input, Card, Section } from '../components/ui';
import { Heading, Body, Caption } from '../components/ui/Text';
import AppBackground from '../components/AppBackground';

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
  const { colors, spacing, radius } = useTheme();

  const validateUsername = (value) => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  const checkUsernameAvailability = async (value) => {
    if (!value || validateUsername(value)) return false;
    
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .ilike('username', value)
        .maybeSingle();
      
      setCheckingUsername(false);
      
      if (error) {
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
      setCheckingUsername(false);
      setUsernameError('Error checking username availability');
      return false;
    }
  };

  const handleComplete = async () => {
    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
      setError(usernameValidation);
      return;
    }

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

    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);
    setError('');

    const optimisticProfile = {
      ...profile,
      username: username.toLowerCase().trim(),
      nickname: nickname.trim(),
      bio: bio.trim() || null,
      is_anonymous: isAnonymous,
      onboarding_completed: true,
    };
    
    setProfile(optimisticProfile);

    const { data, error: updateError } = await updateProfile({
      username: username.toLowerCase().trim(),
      nickname: nickname.trim(),
      bio: bio.trim() || null,
      is_anonymous: isAnonymous,
      onboarding_completed: true,
    });

    if (updateError) {
      if (user?.id) {
        await fetchProfile(user.id);
      }
      setError(updateError.message || 'Failed to update profile');
      setLoading(false);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    
    const randomUsername = `user_${Math.random().toString(36).substring(2, 10)}`;
    
    const optimisticProfile = {
      ...profile,
      username: randomUsername,
      nickname: 'Anonymous User',
      bio: null,
      is_anonymous: true,
      onboarding_completed: true,
    };
    
    setProfile(optimisticProfile);
    
    const { error: updateError } = await updateProfile({
      username: randomUsername,
      nickname: 'Anonymous User',
      bio: null,
      is_anonymous: true,
      onboarding_completed: true,
    });

    if (updateError) {
      if (user?.id) {
        await fetchProfile(user.id);
      }
      setError(updateError.message || 'Failed to update profile');
      setLoading(false);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing["5xl"],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Section spacing="large">
            <Heading variant="h1" style={{ textAlign: 'center', marginBottom: spacing.md }}>
              Welcome to HearSay Japan
            </Heading>
            <Body color="secondary" style={{ textAlign: 'center' }}>
              Let's set up your profile
            </Body>
          </Section>

          {/* Form */}
          <Section spacing="default">
            <Input
              label="Username *"
              placeholder="e.g., tokyo_student"
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
              error={usernameError && !checkingUsername ? usernameError : ''}
            />
            {checkingUsername && (
              <Caption color="secondary" style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
                Checking availability...
              </Caption>
            )}
            {!usernameError && !checkingUsername && username && (
              <Caption color="tertiary" style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
                Your unique identifier (3-20 characters)
              </Caption>
            )}

            <View>
              <Input
                label="Nickname *"
                placeholder="Enter your nickname"
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
              <Caption color="tertiary" style={{ textAlign: 'right', marginTop: -spacing.md, marginBottom: spacing.lg }}>
                {nickname.length}/20
              </Caption>
            </View>

            <View>
              <Input
                label="Bio (optional)"
                placeholder="Tell us about yourself..."
                value={bio}
                onChangeText={setBio}
                maxLength={150}
                multiline
              />
              <Caption color="tertiary" style={{ textAlign: 'right', marginTop: -spacing.md, marginBottom: spacing.lg }}>
                {bio.length}/150
              </Caption>
            </View>

            <Card padding="default" style={{ marginBottom: spacing["2xl"] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <Body weight="medium" style={{ marginBottom: spacing.xs }}>
                    Anonymous Mode
                  </Body>
                  <Caption color="secondary">
                    Hide your identity in posts
                  </Caption>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: colors.border, true: colors.primarySubtle }}
                  thumbColor={isAnonymous ? colors.primary : '#FFFFFF'}
                />
              </View>
            </Card>

            {error ? (
              <Body style={{ textAlign: 'center', marginBottom: spacing.lg, color: colors.error }}>
                {error}
              </Body>
            ) : null}

            <Button
              variant="primary"
              fullWidth
              onPress={handleComplete}
              loading={loading}
              disabled={loading}
            >
              Get Started
            </Button>

            <TouchableOpacity
              style={{ padding: spacing.md, alignItems: 'center' }}
              onPress={handleSkip}
              disabled={loading}
            >
              <Body color="secondary">
                Skip for now
              </Body>
            </TouchableOpacity>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
