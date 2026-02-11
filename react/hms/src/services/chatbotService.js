/**
 * Chatbot Service
 * Handles all chatbot API calls - send messages, get conversations, get history
 */

import axios from 'axios';
import logger from './loggerService';

const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev-2.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers['x-auth-token'] = token;
  return config;
});

/**
 * Send a chat message to the bot
 * @param {string} message - The user's message
 * @param {string} conversationId - Optional conversation ID (chatId)
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<string>} - Bot's reply
 */
const sendChatMessage = async (message, conversationId = null, metadata = null) => {
  try {
    console.log('🤖 [sendChatMessage] Sending:', message);

    logger.apiRequest('POST', '/bot/chat');

    const payload = {
      message,
      ...(conversationId && { chatId: conversationId }),
      ...(metadata && { metadata }),
    };

    const response = await api.post('/bot/chat', payload);
    logger.apiResponse('POST', '/bot/chat', response.status, response.data);

    console.log('🤖 [sendChatMessage] Response:', response.data);

    // Parse response - backend can return different formats
    if (response.data) {
      const data = response.data;

      // Format 1: { success: true, reply: "..." }
      if (data.reply) {
        return data.reply;
      }

      // Format 2: { success: true, message: "..." }
      if (data.message) {
        return data.message;
      }

      // Format 3: { success: true, data: { reply: "..." } }
      if (data.data && data.data.reply) {
        return data.data.reply;
      }

      // Format 4: { success: true, response: "..." }
      if (data.response) {
        return data.response;
      }

      // Format 5: Direct string response
      if (typeof data === 'string') {
        return data;
      }
    }

    return 'No response from server.';
  } catch (error) {
    logger.apiError('POST', '/bot/chat', error);
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

    logger.apiRequest('GET', '/bot/chats');
    const response = await api.get('/bot/chats');
    logger.apiResponse('GET', '/bot/chats', response.status, response.data);

    console.log('🤖 [getConversations] Response:', response.data);

    // Parse response
    if (response.data) {
      const data = response.data;

      // Format 1: { success: true, chats: [...] }
      if (data.chats && Array.isArray(data.chats)) {
        return data.chats;
      }

      // Format 2: { success: true, conversations: [...] }
      if (data.conversations && Array.isArray(data.conversations)) {
        return data.conversations;
      }

      // Format 3: { success: true, data: [...] }
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }

      // Format 4: Direct array
      if (Array.isArray(data)) {
        return data;
      }
    }

    return [];
  } catch (error) {
    logger.apiError('GET', '/bot/chats', error);
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

    logger.apiRequest('GET', `/bot/chats/${conversationId}`);
    const response = await api.get(`/bot/chats/${conversationId}`);
    logger.apiResponse('GET', `/bot/chats/${conversationId}`, response.status, response.data);

    console.log('🤖 [getConversationMessages] Response:', response.data);

    // Parse response
    if (response.data) {
      const data = response.data;

      // Format 1: { success: true, messages: [...] }
      if (data.messages && Array.isArray(data.messages)) {
        return data.messages;
      }

      // Format 2: { success: true, data: [...] }
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }

      // Format 3: { success: true, chat: { messages: [...] } }
      if (data.chat && Array.isArray(data.chat.messages)) {
        return data.chat.messages;
      }

      // Format 4: Direct array
      if (Array.isArray(data)) {
        return data;
      }
    }

    return [];
  } catch (error) {
    logger.apiError('GET', `/bot/chats/${conversationId}`, error);
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

    logger.apiRequest('DELETE', `/bot/chats/${conversationId}`);
    const response = await api.delete(`/bot/chats/${conversationId}`);
    logger.apiResponse('DELETE', `/bot/chats/${conversationId}`, response.status, response.data);

    return response.data?.success === true;
  } catch (error) {
    logger.apiError('DELETE', `/bot/chats/${conversationId}`, error);
    console.error('❌ [deleteConversation] Error:', error);
    return false;
  }
};

/**
 * Send feedback for a chatbot message
 * @param {string} messageId - The message ID
 * @param {string} type - Feedback type (like, dislike, helpful, not-helpful)
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<boolean>} - Success status
 */
const sendChatbotFeedback = async (messageId, type, conversationId) => {
  try {
    console.log('🤖 [sendChatbotFeedback] Sending feedback:', { messageId, type, conversationId });

    logger.apiRequest('POST', '/bot/chat/feedback');
    const response = await api.post('/bot/chat/feedback', {
      messageId,
      type,
      conversationId,
    });
    logger.apiResponse('POST', '/bot/chat/feedback', response.status, response.data);

    return response.data?.success === true;
  } catch (error) {
    logger.apiError('POST', '/bot/chat/feedback', error);
    console.error('❌ [sendChatbotFeedback] Error:', error);
    return false;
  }
};

const chatbotService = {
  sendMessage: sendChatMessage, // Alias for consistency
  sendChatMessage,
  getConversations,
  getConversationMessages,
  deleteConversation,
  sendChatbotFeedback,
};

export default chatbotService;
