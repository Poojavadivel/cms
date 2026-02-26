/**
 * ChatbotWidget.styles.js
 * Styles for ChatbotWidget component - Popup Card Layout
 */

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    popupContainer: {
        position: 'absolute',
        bottom: 160, // Above FAB (90) + FAB height (60) + spacing (10)
        right: 16,
        left: 16, // Full width with margins
        maxWidth: 380,
        height: 380, // Fixed height for mobile
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        flex: 1,
        marginLeft: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 8,
    },
    welcomeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    welcomeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 12,
        marginBottom: 6,
    },
    welcomeText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 16,
    },
    suggestionsContainer: {
        width: '100%',
    },
    suggestionsTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
    },
    suggestionChip: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 6,
    },
    suggestionText: {
        fontSize: 11,
        color: '#3B82F6',
        fontWeight: '600',
    },
    messagesList: {
        padding: 12,
    },
    messageBubble: {
        marginBottom: 8,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    bubbleContent: {
        maxWidth: '85%',
        padding: 10,
        borderRadius: 12,
    },
    botBubble: {
        backgroundColor: '#F1F5F9',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: 4,
    },
    systemBubble: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
    },
    messageText: {
        fontSize: 13,
        color: '#1E293B',
        lineHeight: 18,
    },
    userText: {
        color: '#FFFFFF',
    },
    messageTime: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 3,
        marginLeft: 4,
    },
    userMessageTime: {
        marginRight: 4,
        marginLeft: 0,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    input: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: '#1E293B',
        maxHeight: 80,
        marginRight: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#E2E8F0',
    },
});

