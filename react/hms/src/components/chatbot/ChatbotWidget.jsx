/**
 * ChatbotWidget.jsx
 * Enterprise-grade medical chatbot widget
 * 
 * Features:
 * - Real-time chat with backend bot service
 * - Conversation history management
 * - Typing animation for bot responses
 * - Maximize/minimize functionality
 * - Auto-scroll to latest messages
 * - Quick suggestions based on user role
 */

import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdMinimize, MdMaximize, MdSend, MdSmartToy, MdDelete, MdHistory, MdMic, MdMicOff } from 'react-icons/md';
import chatbotService from '../../services/chatbotService';
import AppointmentsTable from './AppointmentsTable';
import './ChatbotWidget.css';

// Generate unique ID for chatbot messages
const generateChatbotMessageId = () => {
  return `chatbot_msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
};

const ChatbotWidget = ({ onClose, onToggleSize, isMaximized = false, userRole = 'doctor' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('New Chat');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [typingMessage, setTypingMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

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

  // Initialize conversation and messages
  useEffect(() => {
    console.log('🚀🚀🚀 CHATBOT WIDGET MOUNTED - NEW CODE v2.0 🚀🚀🚀');
    initConversation();
    initVoiceRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initConversation = async () => {
    setIsLoading(true);
    try {
      const convos = await chatbotService.getConversations();
      setConversations(convos);

      if (convos.length > 0) {
        const firstConvo = convos[0];
        const convoId = firstConvo.id || firstConvo._id || firstConvo.chatId;
        setConversationId(convoId);
        setConversationTitle(firstConvo.title || 'Chat');

        // Load messages for this conversation
        const msgs = await chatbotService.getConversationMessages(convoId);
        setMessages(msgs.map(normalizeMessage));
      } else {
        // New conversation
        setConversationTitle('New Chat');
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      setMessages([{
        id: generateChatbotMessageId(),
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
      if (typeof rawTs === 'string') {
        time = new Date(rawTs);
      } else if (typeof rawTs === 'number') {
        time = new Date(rawTs);
      } else {
        time = new Date();
      }
    } catch {
      time = new Date();
    }

    const sender = (senderRaw.includes('bot') || senderRaw.includes('assistant'))
      ? 'bot'
      : (senderRaw.includes('user') ? 'user' : (senderRaw === '' ? 'bot' : senderRaw));

    // Check if text is JSON appointments data
    let messageType = 'text';
    let data = null;

    if (text && typeof text === 'string' && text.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(text.trim());
        if (parsed.type === 'appointments_table') {
          messageType = 'appointments_table';
          data = parsed.data;
        }
      } catch (e) {
        // Not JSON, keep as text
      }
    }

    // Generate truly unique ID
    const uniqueId = msg.id || msg._id || msg.messageId || generateChatbotMessageId();

    const normalized = {
      id: uniqueId,
      sender,
      time,
    };

    if (messageType === 'appointments_table') {
      normalized.messageType = messageType;
      normalized.data = data;
    } else {
      normalized.text = text;
    }

    return normalized;
  };

  // Initialize voice recognition
  const initVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      setIsVoiceSupported(true);
    } else {
      setIsVoiceSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }
  };

  // Toggle voice recording
  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setIsRecording(false);
      }
    }
  };

  const startTypingAnimation = (botReply) => {
    setTypingMessage('');
    let index = 0;
    
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (index < botReply.length) {
        setTypingMessage(botReply.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typingIntervalRef.current);
        setTypingMessage('');

        // Add complete message
        setMessages(prev => [
          ...prev.slice(0, -1), // Remove loading message
          {
            id: generateChatbotMessageId(),
            sender: 'bot',
            text: botReply,
            time: new Date(),
          },
        ]);
      }
    }, 20);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const isNewConversation = !conversationId;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: generateChatbotMessageId(),
        sender: 'user',
        text,
        time: new Date(),
      },
      {
        id: generateChatbotMessageId(),
        sender: 'bot',
        text: '',
        time: new Date(),
        loading: true,
      },
    ]);

    setInput('');
    setIsSending(true);

    try {
      const reply = await chatbotService.sendChatMessage(
        text,
        conversationId,
        { source: 'app', ts: new Date().toISOString() }
      );

      console.log('====== RECEIVED REPLY FROM BACKEND ======');
      console.log('Reply type:', typeof reply);
      console.log('Reply length:', reply?.length);
      console.log('First 100 chars:', reply?.substring(0, 100));

      // If first message, refresh conversation list
      if (isNewConversation) {
        const convos = await chatbotService.getConversations();
        setConversations(convos);

        if (convos.length > 0) {
          const newConvo = convos[0];
          setConversationId(newConvo.id || newConvo.chatId);
          setConversationTitle(newConvo.title || text.substring(0, 30) + '...');
        }
      }

      // Parse reply to check if it's structured data
      let parsedData = null;
      let messageType = 'text';

      if (reply && typeof reply === 'string' && reply.trim().startsWith('{')) {
        console.log('⚠️ Reply looks like JSON, attempting to parse...');
        try {
          parsedData = JSON.parse(reply.trim());
          console.log('✅ Successfully parsed reply JSON:', parsedData);
          if (parsedData.type === 'appointments_table') {
            messageType = 'appointments_table';
            console.log('🎯 Detected appointments_table type!');
          }
        } catch (e) {
          // Not JSON, treat as text
          console.error('❌ Failed to parse reply as JSON:', e);
          parsedData = null;
          messageType = 'text';
        }
      }

      // Add message based on type
      if (messageType === 'appointments_table' && parsedData) {
        console.log('🚀🚀🚀 Adding appointments table message to state 🚀🚀🚀');
        console.log('Message data:', parsedData.data);
        console.log('Appointments array:', parsedData.data?.appointments);
        console.log('Number of appointments:', parsedData.data?.appointments?.length);
        
        const appointmentMessage = {
          id: generateChatbotMessageId(),
          sender: 'bot',
          messageType: 'appointments_table',
          data: parsedData.data,
          time: new Date(),
        };
        
        console.log('📦 Complete message object being added:', appointmentMessage);
        
        // For appointments table, store structured data
        setMessages(prev => {
          const newMessages = [
            ...prev.slice(0, -1), // Remove loading message
            appointmentMessage,
          ];
          console.log('✅ Updated messages state, total messages:', newMessages.length);
          console.log('Last message:', newMessages[newMessages.length - 1]);
          return newMessages;
        });
      } else {
        console.log('📝 Adding text message, using typing animation');
        console.log('Reply text:', reply);
        // For regular text, use typing animation
        startTypingAnimation(reply || 'No response from server.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          id: generateChatbotMessageId(),
          sender: 'system',
          text: 'Failed to send message: ' + error.message,
          time: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleNewChat = () => {
    setConversationId(null);
    setConversationTitle('New Chat');
    setMessages([]);
    setShowSidebar(false);
  };

  const handleSelectConversation = async (convo) => {
    const convoId = convo.id || convo._id || convo.chatId;
    setConversationId(convoId);
    setConversationTitle(convo.title || 'Chat');
    setShowSidebar(false);
    setIsLoading(true);

    try {
      const msgs = await chatbotService.getConversationMessages(convoId);
      setMessages(msgs.map(normalizeMessage));
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (convoId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Delete this conversation?')) return;

    try {
      const success = await chatbotService.deleteConversation(convoId);
      if (success) {
        const convos = await chatbotService.getConversations();
        setConversations(convos);
        
        if (convoId === conversationId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render message content based on type
  const renderMessageContent = (msg, idx) => {
    console.log('====== renderMessageContent CALLED v3.0 ======');
    console.log('Message:', msg);
    console.log('Index:', idx);
    console.log('messageType:', msg.messageType);
    console.log('Has data:', !!msg.data);
    console.log('Has text:', !!msg.text);

    if (msg.loading) {
      return (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      );
    }

    if (typingMessage && idx === messages.length - 1 && msg.sender === 'bot') {
      return <p>{typingMessage}</p>;
    }

    // Check message type - PRIMARY PATH for appointments table
    if (msg.messageType === 'appointments_table' && msg.data) {
      console.log('🎯🎯🎯 Rendering AppointmentsTable from messageType 🎯🎯🎯');
      console.log('Appointments data:', msg.data);
      console.log('Appointments count:', msg.data.appointments?.length);
      
      try {
        return (
          <AppointmentsTable
            appointments={msg.data.appointments}
            date={msg.data.date}
          />
        );
      } catch (renderError) {
        console.error('❌ Error rendering AppointmentsTable:', renderError);
        return <p style={{color: 'red'}}>Error displaying appointments table: {renderError.message}</p>;
      }
    }

    // For bot messages with text, check if it's JSON (backward compatibility for loaded messages)
    if (msg.sender === 'bot' && msg.text && typeof msg.text === 'string') {
      const trimmed = msg.text.trim();
      console.log('Bot message, checking if JSON. First 50 chars:', trimmed.substring(0, 50));

      // Check if it's JSON starting with { and containing "appointments_table"
      if (trimmed.startsWith('{') && trimmed.includes('appointments_table')) {
        console.log('⚠️ Detected JSON in text field, attempting to parse...');
        try {
          const data = JSON.parse(trimmed);
          console.log('✅ Successfully parsed JSON:', data);

          // Render appointments table
          if (data.type === 'appointments_table' && data.data && Array.isArray(data.data.appointments)) {
            console.log('🎯🎯🎯 Rendering AppointmentsTable from JSON parsing 🎯🎯🎯');
            console.log('Appointments count:', data.data.appointments.length);
            return (
              <AppointmentsTable
                appointments={data.data.appointments}
                date={data.data.date}
              />
            );
          }
        } catch (error) {
          console.error('❌ Failed to parse appointments JSON:', error);
          // Fall through to default rendering
        }
      }

      // For HTML content (backward compatibility)
      if (trimmed.includes('<table') || trimmed.includes('<div class="chatbot-response">')) {
        return <div dangerouslySetInnerHTML={{ __html: msg.text }} />;
      }
    }

    // Default text rendering
    console.log('📝 Rendering as plain text');
    console.log('Text content:', msg.text);
    
    // If we're seeing JSON as text, highlight it as an error
    if (msg.text && typeof msg.text === 'string' && msg.text.trim().startsWith('{')) {
      return (
        <div style={{background: '#fff3cd', padding: '10px', borderRadius: '5px', border: '1px solid #ffc107'}}>
          <p style={{color: '#856404', fontWeight: 'bold', marginBottom: '5px'}}>⚠️ JSON detected but not rendered as table:</p>
          <pre style={{fontSize: '11px', overflow: 'auto', maxHeight: '200px'}}>{msg.text}</pre>
        </div>
      );
    }
    
    return <p>{msg.text}</p>;
  };

  return (
    <div className={`chatbot-widget ${isMaximized ? 'maximized' : 'minimized'}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-icon">
            <MdSmartToy size={24} />
          </div>
          <div className="chatbot-title">
            <h3>Medical Assistant</h3>
            <p>{conversationTitle}</p>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button onClick={() => setShowSidebar(!showSidebar)} title="Conversation History">
            <MdHistory size={20} />
          </button>
          <button onClick={onToggleSize} title={isMaximized ? 'Minimize' : 'Maximize'}>
            {isMaximized ? <MdMinimize size={20} /> : <MdMaximize size={20} />}
          </button>
          <button onClick={onClose} title="Close">
            <MdClose size={20} />
          </button>
        </div>
      </div>

      {/* Sidebar for conversations */}
      {showSidebar && (
        <div className="chatbot-sidebar">
          <div className="sidebar-header">
            <h4>Conversations</h4>
            <button onClick={handleNewChat} className="btn-new-chat">
              New Chat
            </button>
          </div>
          <div className="sidebar-content">
            {conversations.map((convo) => (
              <div
                key={convo.id || convo._id || convo.chatId}
                className={`conversation-item ${(convo.id || convo.chatId) === conversationId ? 'active' : ''}`}
                onClick={() => handleSelectConversation(convo)}
              >
                <div className="conversation-info">
                  <p className="conversation-title">{convo.title || 'Untitled'}</p>
                  <p className="conversation-date">
                    {new Date(convo.updatedAt || convo.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="btn-delete-conversation"
                  onClick={(e) => handleDeleteConversation(convo.id || convo.chatId, e)}
                >
                  <MdDelete size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chatbot-messages">
        {isLoading ? (
          <div className="chatbot-loading">
            <div className="loading-spinner"></div>
            <p>Loading conversation...</p>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <MdSmartToy size={48} />
                <h3>Welcome to Medical Assistant</h3>
                <p>Ask me anything about patients, appointments, or hospital operations.</p>
                
                <div className="quick-suggestions">
                  <p>Quick suggestions:</p>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              console.log(`🔄 Rendering message ${idx}:`, { 
                id: msg.id, 
                sender: msg.sender, 
                messageType: msg.messageType,
                hasData: !!msg.data,
                hasText: !!msg.text
              });
              
              return (
                <div key={msg.id || idx} className={`message ${msg.sender}`}>
                  <div className="message-content">
                    {renderMessageContent(msg, idx)}
                  </div>
                  {!msg.loading && (
                    <span className="message-time">{formatTime(msg.time)}</span>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="chatbot-input">
        <input
          type="text"
          placeholder={isRecording ? 'Listening...' : 'Type your message...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending || isRecording}
        />
        {isVoiceSupported && (
          <button 
            className={`btn-voice ${isRecording ? 'recording' : ''}`}
            onClick={toggleVoiceRecording}
            disabled={isSending}
            title={isRecording ? 'Stop Recording' : 'Voice Input'}
          >
            {isRecording ? <MdMicOff size={20} /> : <MdMic size={20} />}
          </button>
        )}
        <button onClick={sendMessage} disabled={!input.trim() || isSending || isRecording}>
          <MdSend size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatbotWidget;
