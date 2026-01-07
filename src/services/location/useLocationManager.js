import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguageStore } from '../i18n/languageStore';

// Platform-specific imports for native modules
// On mobile: use native expo modules
// On web: these will be null and we'll use browser APIs
const Location = Platform.OS === 'web' ? null : require('expo-location');

/**
 * Hook to manage location permissions, fetching, and caching
 * Provides location state and helper functions for home feed
 */
export function useLocationManager() {
  const { t } = useLanguageStore();
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [locationError, setLocationError] = useState(null);
  const [isLocationPrimerVisible, setIsLocationPrimerVisible] = useState(false);

  // Load location on mount (cached + fresh)
  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    // 1. Try cached location first for fast load
    try {
      const cached = await AsyncStorage.getItem('lastKnownLocation');
      if (cached) {
        const parsedLocation = JSON.parse(cached);
        console.log("Using cached location:", parsedLocation);
        setLocation(parsedLocation);
      }
    } catch (e) {
      console.error("Failed to load cached location", e);
    }

    // 2. Then fetch fresh location
    getLocationPermission();
  };

  const getLocationPermission = async (skipPrimer = false) => {
    try {
      setLocationError(null);

      // Platform-specific location handling
      if (Platform.OS === 'web') {
        // Web: Use browser geolocation API
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }

        setIsLocationPrimerVisible(false);
        // Browser will show its own permission prompt
      } else {
        // Native: Use expo-location (original behavior unchanged)
        if (!Location) {
          throw new Error('Location module not available');
        }

        // Show primer for first-time users
        if (!skipPrimer) {
          try {
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
            console.log('Permission status:', existingStatus);
            if (existingStatus === 'undetermined') {
              setIsLocationPrimerVisible(true);
              return;
            }
          } catch (permissionError) {
            console.error('Error checking location permission status:', permissionError);
            // If permission check fails, skip primer and proceed to request permission
            // This prevents the screen from freezing
          }
        }

        setIsLocationPrimerVisible(false);

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError(t('home_location_permission_denied'));
          Alert.alert(
            t('home_location_permission_title'),
            t('home_location_permission_msg'),
            [{ text: t('ok') }]
          );
          return;
        }
      }

      // Fetch location with timeout (platform-specific)
      let currentLocation;
      if (Platform.OS === 'web') {
        // Web: Use browser geolocation
        const position = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Location timeout")), 5000);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeout);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeout);
              reject(err);
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 0,
            }
          );
        });
        currentLocation = position;
      } else {
        // Native: Use expo-location
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Location timeout")), 5000)
        );
        currentLocation = await Promise.race([locationPromise, timeoutPromise]);
      }

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(coords);

      // Cache for next time
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(coords));

    } catch (error) {
      console.error("Error getting location:", error);
      if (!location) {
        setLocationError(error.message);
        Alert.alert(t('error'), t('home_failed_to_get_location'));
      }
      // If we have cached location, silently fail
    }
  };

  return {
    location,
    locationError,
    isLocationPrimerVisible,
    setIsLocationPrimerVisible,
    loadLocation,
    getLocationPermission,
  };
}
