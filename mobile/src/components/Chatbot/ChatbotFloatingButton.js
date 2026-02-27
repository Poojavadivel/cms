/**
 * ChatbotFloatingButton.js
 * Floating action button to open/close chatbot
 * Globally available across all screens
 */

import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet, Platform, Text } from 'react-native';
import ChatbotWidget from './ChatbotWidget';

const ChatbotFloatingButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleToggle}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.logoText}>M</Text>
                    </View>
                    <View style={styles.pulse} />
                </TouchableOpacity>
            )}

            {/* Chatbot Widget */}
            <ChatbotWidget visible={isOpen} onClose={handleClose} />
        </>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 90, // Positioned above bottom navigation bar
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 1000,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    pulse: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3B82F6',
        opacity: 0.2,
        zIndex: -1,
    },
});

export default ChatbotFloatingButton;

