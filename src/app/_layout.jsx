import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../utils/auth/useAuth';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentPath = segments.join('/');
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'onboarding';
    const inProtectedRoute = segments[0] === '(tabs)' || segments[0] === 'create-post' || segments[0] === 'home';

    console.log('Auth routing:', { user: !!user, profile: !!profile, currentPath, segments });

    // Not authenticated - redirect to login (except for index and auth screens)
    if (!user && !inAuthGroup && segments[0] !== 'index' && segments[0] !== '') {
      console.log('Redirecting to login: no user');
      router.replace('/login');
      return;
    }

    // Authenticated but profile not loaded yet - wait (don't redirect)
    if (user && !profile && !inAuthGroup) {
      console.log('Waiting for profile to load');
      return;
    }

    // Authenticated but onboarding not completed - redirect to onboarding
    if (user && profile && !profile.onboarding_completed && segments[0] !== 'onboarding') {
      console.log('Redirecting to onboarding: profile incomplete');
      router.replace('/onboarding');
      return;
    }

    // Authenticated and onboarded but still on auth screens - redirect to home
    if (user && profile?.onboarding_completed && inAuthGroup) {
      console.log('Redirecting to home: already authenticated');
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
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
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
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
