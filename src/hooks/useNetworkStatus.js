import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Hook to monitor network connectivity status
 * Returns isOnline, isInternetReachable, and connection type
 */
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState({
    isOnline: true,
    isInternetReachable: true,
    type: "unknown",
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isOnline: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type,
      });
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isOnline: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
}

/**
 * Simple hook that returns just the online status
 */
export function useIsOnline() {
  const { isOnline, isInternetReachable } = useNetworkStatus();
  return isOnline && isInternetReachable;
}
