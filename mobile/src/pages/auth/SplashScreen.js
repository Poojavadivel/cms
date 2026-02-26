/**
 * SplashScreen.js
 * Splash/loading screen shown while checking auth state
 * Matches the web SplashScreen.jsx design
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <MaterialIcons name="local-hospital" size={48} color="#3B82F6" />
                </View>
                <Text style={styles.title}>MOVI HOSPITAL</Text>
                <Text style={styles.subtitle}>Healthcare Management System</Text>
                <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
            <Text style={styles.footer}>v1.0.0 • © 2024 MOVI HOSPITAL</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 32,
    },
    loader: {
        marginBottom: 12,
    },
    loadingText: {
        color: '#64748B',
        fontSize: 13,
    },
    footer: {
        position: 'absolute',
        bottom: 32,
        color: '#475569',
        fontSize: 12,
    },
});

export default SplashScreen;
