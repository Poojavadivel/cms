import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // This listener is fired whenever a user taps on or interacts with a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification Response:', response);
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, []);

    // Function to schedule a local notification
    const scheduleAppointmentNotification = async (title, body, seconds = 2) => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    // channelId is often required for Android to show notifications correctly
                    channelId: Platform.OS === 'android' ? 'default' : undefined,
                },
                trigger: {
                    type: 'timeInterval',
                    seconds: seconds,
                    repeats: false,
                },
            });
            return true;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return false;
        }
    };

    return (
        <NotificationContext.Provider value={{
            scheduleAppointmentNotification,
            expoPushToken,
            notification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Helper function to get permissions
async function registerForPushNotificationsAsync() {
    let token;

    // Skip if running in Expo Go or not on a physical device for push tokens
    if (!Device.isDevice) {
        console.log('ℹ️ [Notification] Skipping push token registration: Not a physical device');
        return;
    }

    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('ℹ️ [Notification] Permission not granted for notifications');
            return;
        }

        // Only try to get push token if NOT in Expo Go (which removed support in SDK 53)
        // Check for Expo Go via Constants if available, or just catch the unavoidable error
        try {
            const expoToken = await Notifications.getExpoPushTokenAsync();
            token = expoToken.data;
            console.log('✅ [Notification] Push Token:', token);
        } catch (tokenError) {
            console.log('ℹ️ [Notification] Push tokens not supported in this environment (likely Expo Go):', tokenError.message);
        }
    } catch (error) {
        console.warn('⚠️ [Notification] Failed to register for push notifications:', error.message);
    }

    return token;
}
