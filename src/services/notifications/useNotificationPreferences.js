import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notification_preferences';
const DEFAULT_PREFERENCES = {
  enabled: true,
  types: { votes: true, comments: true, follows: true, messages: true }
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleType = async (type) => {
    await updatePreferences({
      types: { ...preferences.types, [type]: !preferences.types[type] }
    });
  };

  const toggleEnabled = async () => {
    await updatePreferences({
      enabled: !preferences.enabled
    });
  };

  return {
    preferences,
    loading,
    updatePreferences,
    toggleType,
    toggleEnabled
  };
}
