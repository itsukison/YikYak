import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// Retry configuration with exponential backoff
const retryConfig = {
  retry: 3, // Retry failed requests up to 3 times
  retryDelay: (attemptIndex) => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * 2 ** attemptIndex, 30000);
  },
};

// Error handling
const shouldRetry = (failureCount, error) => {
  // Don't retry if we've exceeded max attempts
  if (failureCount >= 3) return false;

  // Don't retry on authentication errors
  if (error?.message?.includes("JWT") || error?.message?.includes("auth")) {
    return false;
  }

  // Don't retry on rate limit errors (409)
  if (error?.code === "23505" || error?.message?.includes("rate limit")) {
    return false;
  }

  // Retry on network errors and 5xx errors
  return true;
};

// Create query client with production-ready defaults
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache configuration
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

        // Retry configuration
        retry: shouldRetry,
        retryDelay: retryConfig.retryDelay,

        // Error handling
        throwOnError: false, // Don't throw errors to error boundaries by default

        // Network mode
        networkMode: "offlineFirst", // Try cache first when offline

        // Refetch configuration
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnReconnect: true, // Refetch when reconnecting
        refetchOnMount: false, // Don't refetch on mount if data exists
      },
      mutations: {
        // Retry configuration for mutations
        retry: 1, // Only retry once for mutations
        retryDelay: 1000,

        // Network mode
        networkMode: "online", // Only run mutations when online
      },
    },
  });
};

// Create async storage persister for offline support
export const createPersister = () => {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "REACT_QUERY_OFFLINE_CACHE",
    throttleTime: 1000, // Throttle saves to once per second
  });
};

// Cache size management
export const clearOldCache = async (queryClient) => {
  try {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    // Remove queries older than 1 hour
    const oneHourAgo = Date.now() - 1000 * 60 * 60;

    queries.forEach((query) => {
      const state = query.state;
      if (state.dataUpdatedAt < oneHourAgo) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });

    console.log("Old cache cleared successfully");
  } catch (error) {
    console.error("Error clearing old cache:", error);
  }
};

// Export default instance
export const queryClient = createQueryClient();
