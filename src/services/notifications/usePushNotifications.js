import { useState, useEffect, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from '../auth/useAuth';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export function usePushNotifications() {
    const { user, updateProfile } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        if (!user) return;

        registerForPushNotificationsAsync().then(token => {
            setExpoPushToken(token);
            if (token) {
                // Save token to user profile
                // Note: This assumes 'push_token' column exists in 'users' table
                updateProfile({ push_token: token }).catch(err => {
                    console.warn("Failed to update push token:", err);
                });
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("Notification response received:", response);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [user]);

    return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            // Get the project ID from Expo config if available, otherwise undefined (loops up automatically)
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            console.log("Expo Push Token:", token);
        } catch (e) {
            console.error("Error fetching push token:", e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

// Helper functions for settings page
export async function checkPushPermissions() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
}

export async function requestPushPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

export async function openAppSettings() {
    if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
    } else {
        Linking.openSettings();
    }
}
