import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../services/auth/useAuth';
import { supabase } from '../adapters/supabaseClient';
import { usePeriodicSync } from '../services/chat/useMessageSync';
import { useTrackPresence } from '../services/presence/usePresence';
import { usePendingMessages, useUpdateLastSeen } from '../services/chat/usePendingMessages';
import { usePushNotifications } from '../services/notifications/usePushNotifications';
import { useOfflineQueue } from '../services/chat/useOfflineQueue';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3000, // Throttle saves to every 3 seconds
});

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Enable periodic sync for authenticated users (every 30 seconds)
  usePeriodicSync(30000);

  // Track user's online presence
  useTrackPresence(user?.id, {
    deviceId: 'mobile', // Could be more specific if needed
  });

  // Sync pending messages when user comes online
  usePendingMessages(user?.id, !!user);

  // Update last seen timestamp when app goes to background
  useUpdateLastSeen(user?.id);

  // Initialize Push Notifications
  usePushNotifications();

  // Process offline message queue
  useOfflineQueue();

  // Deep link handler for email verification
  useEffect(() => {
    // Parse URL parameters
    const parseUrlParams = (url) => {
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        return {
          token_hash: params.get('token_hash'),
          type: params.get('type'),
          error: params.get('error'),
          error_description: params.get('error_description'),
        };
      } catch (error) {
        console.error('Error parsing URL:', error);
        return {};
      }
    };

    // Handle deep link
    const handleDeepLink = async (url) => {
      if (!url) return;

      console.log('Deep link received:', url);

      // Check if it's an auth callback
      if (url.includes('auth/callback')) {
        const { token_hash, type, error, error_description } = parseUrlParams(url);

        if (error) {
          Alert.alert(
            'Verification Error',
            error_description || 'Failed to verify email. Please try again.'
          );
          return;
        }

        if (token_hash && type === 'email') {
          try {
            console.log('Verifying OTP with token hash');
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash,
              type: 'email',
            });

            if (verifyError) {
              console.error('OTP verification error:', verifyError);
              Alert.alert(
                'Verification Failed',
                verifyError.message || 'Failed to verify your email. The link may have expired.'
              );
            } else {
              console.log('Email verified successfully! Redirecting to onboarding...');
              // Session will be established automatically
              // The auth routing logic below will handle navigation to onboarding
              Alert.alert(
                'Email Verified! ✅',
                'Your email has been verified. Complete your profile to continue.',
                [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
              );
            }
          } catch (error) {
            console.error('Unexpected error during verification:', error);
            Alert.alert(
              'Error',
              'An unexpected error occurred. Please try again.'
            );
          }
        }
      }
    };

    // Handle deep link on app launch (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep link while app is running (warm start)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Auth routing logic
  useEffect(() => {
    if (loading) return;

    const currentPath = segments.join('/');
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'school-selection' || segments[0] === 'verify-email';
    const onOnboardingScreen = segments[0] === 'onboarding';
    const inProtectedRoute = segments[0] === '(tabs)' || segments[0] === 'create-post' || segments[0] === 'home';

    console.log('Auth routing:', {
      user: !!user,
      profile: !!profile,
      onboarding_completed: profile?.onboarding_completed,
      currentPath,
      segments
    });

    // Not authenticated - redirect to login (except for index and auth screens)
    if (!user && !inAuthGroup && !onOnboardingScreen && segments[0] !== 'index' && segments[0] !== '') {
      console.log('Redirecting to login: no user');
      router.replace('/login');
      return;
    }

    // Authenticated but profile not loaded yet - wait (don't redirect)
    if (user && !profile && !inAuthGroup) {
      console.log('Waiting for profile to load');
      return;
    }

    // Authenticated but onboarding not completed - redirect to onboarding (but NOT if already on onboarding)
    if (user && profile && !profile.onboarding_completed && !onOnboardingScreen) {
      console.log('Redirecting to onboarding: profile incomplete');
      router.replace('/onboarding');
      return;
    }

    // Authenticated and onboarded but still on auth/onboarding screens - redirect to home
    if (user && profile?.onboarding_completed && (inAuthGroup || onOnboardingScreen)) {
      console.log('Redirecting to home: onboarding complete');
      router.replace('/(tabs)/home');
      return;
    }
  }, [user, profile, loading, segments]);

  // Show loading while checking auth
  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="school-selection" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create-post" />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    // Hide splash screen after a short delay
    setTimeout(() => {
      SplashScreen.hideAsync();
      setIsReady(true);
    }, 100);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}