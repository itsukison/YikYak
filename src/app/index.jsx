import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../utils/auth/useAuth';

export default function Index() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (!profile?.onboarding_completed) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [user, profile, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FFCC00" />
    </View>
  );
}