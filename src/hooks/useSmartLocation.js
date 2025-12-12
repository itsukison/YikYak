import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Smart location hook with caching and distance-based refetch
 * Only refetches location if user has moved significantly
 */
export function useSmartLocation(options = {}) {
  const {
    significantDistance = 1000, // 1km default
    cacheKey = "lastKnownLocation",
    autoUpdate = true,
  } = options;

  const [location, setLocation] = useState(null);
  const [cachedLocation, setCachedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUsingCached, setIsUsingCached] = useState(false);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Load cached location
  const loadCachedLocation = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedLocation = JSON.parse(cached);
        setCachedLocation(parsedLocation);
        setLocation(parsedLocation);
        setIsUsingCached(true);
        return parsedLocation;
      }
    } catch (err) {
      console.error("Failed to load cached location:", err);
    }
    return null;
  }, [cacheKey]);

  // Get fresh location with smart caching
  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      // Get current location with timeout
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Location timeout")), 5000)
      );

      const freshLocation = await Promise.race([
        locationPromise,
        timeoutPromise,
      ]);

      // Check if location has changed significantly
      if (cachedLocation?.coords) {
        const distance = calculateDistance(
          cachedLocation.coords.latitude,
          cachedLocation.coords.longitude,
          freshLocation.coords.latitude,
          freshLocation.coords.longitude
        );

        // If distance is small, use cached location (save battery)
        if (distance < significantDistance) {
          console.log(
            `Location unchanged (${Math.round(distance)}m), using cache`
          );
          setIsLoading(false);
          return cachedLocation;
        }

        console.log(
          `Location changed by ${Math.round(distance)}m, updating cache`
        );
      }

      // Update cache and state
      await AsyncStorage.setItem(cacheKey, JSON.stringify(freshLocation));
      setLocation(freshLocation);
      setCachedLocation(freshLocation);
      setIsUsingCached(false);
      setIsLoading(false);

      return freshLocation;
    } catch (err) {
      console.error("Error getting location:", err);
      setError(err.message);
      setIsLoading(false);

      // Fall back to cached location if available
      if (cachedLocation) {
        console.log("Using cached location due to error");
        return cachedLocation;
      }

      throw err;
    }
  }, [cachedLocation, calculateDistance, cacheKey, significantDistance]);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      // Load cached location first
      await loadCachedLocation();

      // Then get fresh location if auto-update is enabled
      if (autoUpdate) {
        try {
          await refreshLocation();
        } catch (err) {
          // Error is already handled in refreshLocation
        }
      }
    };

    initialize();
  }, [autoUpdate, loadCachedLocation, refreshLocation]);

  return {
    location,
    isLoading,
    error,
    isUsingCached,
    refreshLocation,
    hasSignificantlyMoved: (newLat, newLon) => {
      if (!location?.coords) return true;
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        newLat,
        newLon
      );
      return distance >= significantDistance;
    },
  };
}

