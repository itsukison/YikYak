import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../services/auth/useAuth';
import { useTheme } from '../config/theme';

export default function WelcomeScreen() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // If user is authenticated, redirect them to the appropriate screen
      if (!profile?.onboarding_completed) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, profile, loading]);

  if (loading || user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { padding: spacing["2xl"] }]}>
        <View style={styles.heroSection}>
          <Text style={[styles.title, typography.hero, { color: colors.text }]}>
            HearSay
          </Text>
          <Text style={[styles.tagline, typography.bodyLarge, { color: colors.textSecondary }]}>
            The beat of your campus.
          </Text>
        </View>

        <View style={[styles.actionSection, { gap: spacing.md }]}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
              }
            ]}
            onPress={() => router.push('/school-selection')}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, typography.h3, { color: colors.primaryText }]}>
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderRadius: radius.pill,
              }
            ]}
            onPress={() => router.push('/login')}
            activeOpacity={0.6}
          >
            <Text style={[styles.secondaryButtonText, typography.bodyMedium, { color: colors.text }]}>
              I have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -2,
  },
  tagline: {
    textAlign: 'center',
  },
  actionSection: {
    width: '100%',
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '500',
  },
});