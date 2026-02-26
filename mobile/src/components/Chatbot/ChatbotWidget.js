/**
 * ChatbotWidget.js
 * Main chatbot modal interface for React Native
 * Features: Message history, typing animation, quick suggestions
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import mobileChatbotService from '../../services/mobileChatbotService';
import authService from '../../services/authService';
import styles from './ChatbotWidget.styles';

// Generate unique message ID
const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const ChatbotWidget = ({ visible, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [conversationTitle, setConversationTitle] = useState('New Chat');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [userRole, setUserRole] = useState('doctor');

    const flatListRef = useRef(null);

    // Quick suggestions based on role
    const quickSuggestions = {
        doctor: [
            'Show patient appointments for today',
            'Find patient by name',
            'Recent lab reports',
            'Pending prescriptions',
        ],
        admin: [
            'Staff attendance summary',
            "Today's revenue report",
            'Bed occupancy status',
            'Appointment statistics',
        ],
        pharmacist: [
            'Low stock medicines',
            'Pending prescriptions',
            'Medicine expiry alerts',
            'Stock inventory summary',
        ],
        pathologist: [
            'Pending test reports',
            "Today's sample collection",
            'Critical test results',
            'Test turnaround time',
        ],
    };

    const suggestions = quickSuggestions[userRole] || quickSuggestions.doctor;

    useEffect(() => {
        if (visible) {
            initConversation();
        }
    }, [visible]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const initConversation = async () => {
        setIsLoading(true);
        try {
            // Get user role
            const user = await authService.getUser();
            if (user && user.role) {
                setUserRole(user.role.toLowerCase());
            }

            // Load conversations
            const convos = await mobileChatbotService.getConversations();

            if (convos.length > 0) {
                const firstConvo = convos[0];
                const convoId = firstConvo.id || firstConvo._id || firstConvo.chatId || firstConvo.sessionId;
                setConversationId(convoId);
                setConversationTitle(firstConvo.title || 'Chat');

                // Load messages
                const msgs = await mobileChatbotService.getConversationMessages(convoId);
                setMessages(msgs.map(normalizeMessage));
            } else {
                setConversationTitle('New Chat');
            }
        } catch (error) {
            console.error('Failed to initialize conversation:', error);
            setMessages([{
                id: generateMessageId(),
                sender: 'system',
                text: 'Failed to load conversation. Please try again.',
                time: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const normalizeMessage = (msg) => {
        const senderRaw = (msg.sender || msg.from || msg.role || '').toLowerCase();
        const text = msg.text || msg.message || msg.reply || msg.body || '';

        let time;
        try {
            const rawTs = msg.time || msg.timestamp || msg.createdAt || msg.ts || msg.created_at;
            time = rawTs ? new Date(rawTs) : new Date();
        } catch {
            time = new Date();
        }

        const sender = (senderRaw.includes('bot') || senderRaw.includes('assistant'))
            ? 'bot'
            : (senderRaw.includes('user') ? 'user' : (senderRaw === '' ? 'bot' : senderRaw));

        return {
            id: msg.id || msg._id || msg.messageId || generateMessageId(),
            sender,
            text,
            time,
        };
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isSending) return;

        const isNewConversation = !conversationId;

        // Add user message
        const userMsg = {
            id: generateMessageId(),
            sender: 'user',
            text,
            time: new Date(),
        };

        const loadingMsg = {
            id: generateMessageId(),
            sender: 'bot',
            text: '',
            time: new Date(),
            loading: true,
        };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setInput('');
        setIsSending(true);

        try {
            const reply = await mobileChatbotService.sendChatMessage(
                text,
                conversationId,
                { source: 'mobile', userRole, ts: new Date().toISOString() }
            );

            // If first message, refresh conversation list
            if (isNewConversation) {
                const convos = await mobileChatbotService.getConversations();
                if (convos.length > 0) {
                    const newConvo = convos[0];
                    setConversationId(newConvo.id || newConvo.chatId || newConvo.sessionId);
                    setConversationTitle(newConvo.title || text.substring(0, 30) + '...');
                }
            }

            // Replace loading message with actual reply
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: generateMessageId(),
                    sender: 'bot',
                    text: reply || 'No response from server.',
                    time: new Date(),
                },
            ]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: generateMessageId(),
                    sender: 'system',
                    text: 'Failed to send message: ' + error.message,
                    time: new Date(),
                },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
    };

    const formatTime = (time) => {
        return new Date(time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderMessage = ({ item }) => {
        if (item.loading) {
            return (
                <View style={styles.messageBubble}>
                    <View style={[styles.bubbleContent, styles.botBubble]}>
                        <ActivityIndicator size="small" color="#64748B" />
                    </View>
                </View>
            );
        }

        const isUser = item.sender === 'user';
        const isSystem = item.sender === 'system';

        return (
            <View style={[styles.messageBubble, isUser && styles.userMessage]}>
                <View style={[
                    styles.bubbleContent,
                    isUser ? styles.userBubble : (isSystem ? styles.systemBubble : styles.botBubble)
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser && styles.userText
                    ]}>{item.text}</Text>
                </View>
                <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
                    {formatTime(item.time)}
                </Text>
            </View>
        );
    };

    return (
        <>
            {visible && (
                <View style={styles.popupContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <MaterialIcons name="smart-toy" size={20} color="#3B82F6" />
                            <View style={styles.headerTitle}>
                                <Text style={styles.title}>Medical Assistant</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    <KeyboardAvoidingView
                        style={styles.content}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text style={styles.loadingText}>Loading...</Text>
                            </View>
                        ) : (
                            <>
                                {messages.length === 0 ? (
                                    <View style={styles.welcomeContainer}>
                                        <MaterialIcons name="smart-toy" size={48} color="#3B82F6" />
                                        <Text style={styles.welcomeTitle}>Welcome!</Text>
                                        <Text style={styles.welcomeText}>
                                            Ask me about patients, appointments, or operations.
                                        </Text>
                                        <View style={styles.suggestionsContainer}>
                                            {suggestions.slice(0, 2).map((suggestion, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.suggestionChip}
                                                    onPress={() => handleSuggestionClick(suggestion)}
                                                >
                                                    <Text style={styles.suggestionText} numberOfLines={1}>
                                                        {suggestion}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <FlatList
                                        ref={flatListRef}
                                        data={messages}
                                        renderItem={renderMessage}
                                        keyExtractor={item => item.id.toString()}
                                        contentContainerStyle={styles.messagesList}
                                        onContentSizeChange={scrollToBottom}
                                        showsVerticalScrollIndicator={false}
                                    />
                                )}
                            </>
                        )}

                        {/* Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type message..."
                                placeholderTextColor="#94A3B8"
                                value={input}
                                onChangeText={setInput}
                                maxLength={500}
                                editable={!isSending}
                            />
                            <TouchableOpacity
                                onPress={sendMessage}
                                disabled={!input.trim() || isSending}
                                style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
                            >
                                <MaterialIcons
                                    name="send"
                                    size={18}
                                    color={!input.trim() || isSending ? '#CBD5E1' : '#FFFFFF'}
                                />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            )}
        </>
    );
};

export default ChatbotWidget;
