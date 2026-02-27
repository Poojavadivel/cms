/**
 * mobileChatbotService.js
 * Chatbot service for React Native - handles API communication with backend bot
 * Ported from web chatbotService.js
 */

import authService from './authService';
import { API_BASE_URL } from './apiConstants';

/**
 * Send a chat message to the bot
 * @param {string} message - The user's message
 * @param {string} conversationId - Optional conversation ID (chatId)
 * @param {object} metadata - Optional metadata (e.g., userRole)
 * @returns {Promise<string>} - Bot's reply
 */
const sendChatMessage = async (message, conversationId = null, metadata = null) => {
    try {
        console.log('🤖 [sendChatMessage] Sending:', message);

        const payload = {
            message,
            ...(conversationId && { chatId: conversationId }),
            ...(metadata && { metadata }),
        };

        const response = await authService.post('/bot/chat', payload);
        console.log('🤖 [sendChatMessage] Response:', response);

        // Parse response - backend can return different formats
        if (response) {
            // Format 1: { success: true, reply: "..." }
            if (response.reply) return response.reply;

            // Format 2: { success: true, message: "..." }
            if (response.message) return response.message;

            // Format 3: { success: true, data: { reply: "..." } }
            if (response.data && response.data.reply) return response.data.reply;

            // Format 4: { success: true, response: "..." }
            if (response.response) return response.response;

            // Format 5: Direct string response
            if (typeof response === 'string') return response;
        }

        return 'No response from server.';
    } catch (error) {
        console.error('❌ [sendChatMessage] Error:', error);
        throw error;
    }
};

/**
 * Get list of conversations (chat history)
 * @returns {Promise<Array>} - List of conversations
 */
const getConversations = async () => {
    try {
        console.log('🤖 [getConversations] Fetching conversations...');

        const response = await authService.get('/bot/chats');
        console.log('🤖 [getConversations] Response:', response);

        // Parse response
        if (response) {
            // Format 1: { success: true, chats: [...] }
            if (response.chats && Array.isArray(response.chats)) {
                return response.chats;
            }

            // Format 2: { success: true, conversations: [...] }
            if (response.conversations && Array.isArray(response.conversations)) {
                return response.conversations;
            }

            // Format 3: { success: true, data: [...] }
            if (response.data && Array.isArray(response.data)) {
                return response.data;
            }

            // Format 4: Direct array
            if (Array.isArray(response)) {
                return response;
            }
        }

        return [];
    } catch (error) {
        console.error('❌ [getConversations] Error:', error);
        return [];
    }
};

/**
 * Get messages for a specific conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Array>} - List of messages
 */
const getConversationMessages = async (conversationId) => {
    try {
        if (!conversationId) {
            throw new Error('conversationId is required');
        }

        console.log('🤖 [getConversationMessages] Fetching messages for:', conversationId);

        const response = await authService.get(`/bot/chats/${conversationId}`);
        console.log('🤖 [getConversationMessages] Response:', response);

        // Parse response
        if (response) {
            // Format 1: { success: true, messages: [...] }
            if (response.messages && Array.isArray(response.messages)) {
                return response.messages;
            }

            // Format 2: { success: true, data: [...] }
            if (response.data && Array.isArray(response.data)) {
                return response.data;
            }

            // Format 3: { success: true, chat: { messages: [...] } }
            if (response.chat && Array.isArray(response.chat.messages)) {
                return response.chat.messages;
            }

            // Format 4: Direct array
            if (Array.isArray(response)) {
                return response;
            }
        }

        return [];
    } catch (error) {
        console.error('❌ [getConversationMessages] Error:', error);
        return [];
    }
};

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteConversation = async (conversationId) => {
    try {
        if (!conversationId) {
            throw new Error('conversationId is required');
        }

        console.log('🤖 [deleteConversation] Deleting:', conversationId);

        const response = await authService.delete(`/bot/chats/${conversationId}`);
        return response?.success === true;
    } catch (error) {
        console.error('❌ [deleteConversation] Error:', error);
        return false;
    }
};

const mobileChatbotService = {
    sendMessage: sendChatMessage,
    sendChatMessage,
    getConversations,
    getConversationMessages,
    deleteConversation,
};

export default mobileChatbotService;
