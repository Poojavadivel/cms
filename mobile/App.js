/**
 * App.js
 * Main application entry point for HMS Mobile
 * Equivalent to web App.js with NavigationContainer replacing BrowserRouter
 */

import 'react-native-gesture-handler';
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppProviders } from './src/provider';
import AppNavigator from './src/navigation/AppNavigator';
import ChatbotFloatingButton from './src/components/Chatbot/ChatbotFloatingButton';

export default function App() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
                <AppProviders>
                    <StatusBar style="light" />
                    <AppNavigator />
                    <ChatbotFloatingButton />
                </AppProviders>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
