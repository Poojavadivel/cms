/**
 * ChatbotWidget.jsx - Flutter Design Match
 * Exact replica of Flutter's ChatbotWidget.dart design
 * 
 * Features matching Flutter:
 * - White header with title
 * - Simple conversation list icon
 * - Handshake welcome screen
 * - Clean message bubbles
 * - Voice + text input at bottom
 * - Sidebar with conversation history
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MdClose, MdSend, MdMic, MdMicNone, MdListAlt, 
  MdFullscreen, MdFullscreenExit, MdAddCircleOutline,
  MdDeleteOutline, MdHandshake, MdGraphicEq 
} from 'react-icons/md';
import chatbotService from '../../services/chatbotService';
import './ChatbotWidget-Flutter.css';

const ChatbotWidget = ({ onClose, onToggleSize, isMaximized = false, userRole = 'doctor' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('New Chat');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize
  useEffect(() => {
    initConversation();
    initVoiceRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

        const msgs = await chatbotService.getConversationMessages(convoId);
        setMessages(msgs.map(normalizeMessage));
      } else {
        setConversationTitle('New Chat');
      }
    } catch (error) {
      setMessages([{
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

    return {
      id: msg.id || msg._id || msg.messageId || Date.now(),
      sender,
      text,
      time,
    };
  };

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
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          // Microphone permission denied
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      setIsVoiceSupported(true);
    } else {
      setIsVoiceSupported(false);
    }
  };

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
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            sender: 'bot',
            text: botReply,
            time: new Date(),
          },
        ]);
        setTypingMessage('');
        setIsSending(false);
        scrollToBottom();
      }
    }, 20);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const isNewConversation = conversationId === null;

    setMessages(prev => [
      ...prev,
      { sender: 'user', text, time: new Date() },
      { sender: 'bot', text: '', time: new Date(), loading: true },
    ]);

    setInput('');
    setIsSending(true);
    scrollToBottom();

    try {
      const reply = await chatbotService.sendMessage(text, conversationId, {
        source: 'web',
        userRole,
      });

      if (isNewConversation) {
        const convos = await chatbotService.getConversations();
        setConversations(convos);
        
        if (convos.length > 0) {
          const newConvo = convos[0];
          setConversationId(newConvo.id || newConvo.chatId);
          setConversationTitle(newConvo.title || text.substring(0, 30) + '...');
        }
      }

      startTypingAnimation(reply || 'No response from server.');
    } catch (error) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          sender: 'system',
          text: 'Failed to send message. Please try again.',
          time: new Date(),
        },
      ]);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (convoId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

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
      // Error handled silently
    }
  };

  return (
    <div className={`flutter-chatbot-widget ${isMaximized ? 'maximized' : 'minimized'}`}>
      {/* Header - White background like Flutter */}
      <div className="flutter-chatbot-header">
        <h2 className="flutter-chat-title">{conversationTitle}</h2>
        <div className="flutter-header-actions">
          <button
            className={`flutter-icon-btn ${showSidebar ? 'active' : ''}`}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Conversation History"
          >
            <MdListAlt size={20} />
          </button>
          <button
            className="flutter-icon-btn"
            onClick={onToggleSize}
            title={isMaximized ? 'Restore Size' : 'Maximize'}
          >
            {isMaximized ? <MdFullscreenExit size={20} /> : <MdFullscreen size={20} />}
          </button>
          <button className="flutter-icon-btn close" onClick={onClose} title="Close">
            <MdClose size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area with Sidebar */}
      <div className="flutter-chat-body">
        {/* Main Messages */}
        <div className="flutter-messages">
          {isLoading ? (
            <div className="flutter-loading">
              <div className="flutter-spinner"></div>
              <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flutter-welcome">
              <MdHandshake size={80} className="flutter-welcome-icon" />
              <h3>Hello!</h3>
              <p>Enter a query about a patient, staff member, or procedure to start a new chat.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flutter-message ${msg.sender}`}>
                  <div className="flutter-message-bubble">
                    {msg.loading ? (
                      <div className="flutter-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : typingMessage && idx === messages.length - 1 ? (
                      <p>{typingMessage}</p>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Sidebar Overlay */}
        {showSidebar && (
          <>
            <div className="flutter-sidebar-overlay" onClick={() => setShowSidebar(false)} />
            <div className="flutter-sidebar">
              <div className="flutter-sidebar-header">
                <h3>Conversation History</h3>
                <div className="flutter-sidebar-actions">
                  <button onClick={handleNewChat} title="Start new conversation">
                    <MdAddCircleOutline size={24} />
                  </button>
                  <button onClick={() => setShowSidebar(false)} title="Close">
                    <MdClose size={24} />
                  </button>
                </div>
              </div>
              <div className="flutter-sidebar-divider" />
              <div className="flutter-sidebar-content">
                {conversations.length === 0 ? (
                  <div className="flutter-sidebar-empty">
                    <p>No previous chat</p>
                  </div>
                ) : (
                  conversations.map((convo) => {
                    const convoId = convo.id || convo._id || convo.chatId;
                    const isSelected = convoId === conversationId;
                    return (
                      <div
                        key={convoId}
                        className={`flutter-conversation-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectConversation(convo)}
                      >
                        <div className="flutter-conversation-info">
                          <p className="flutter-conversation-title">{convo.title || 'Untitled'}</p>
                          {convo.snippet && (
                            <p className="flutter-conversation-snippet">{convo.snippet}</p>
                          )}
                        </div>
                        <button
                          className="flutter-delete-btn"
                          onClick={(e) => handleDeleteConversation(convoId, e)}
                          title="Delete conversation"
                        >
                          <MdDeleteOutline size={20} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Input Area - Flutter Style */}
      <div className="flutter-input-area">
        {/* Voice Button */}
        {isVoiceSupported && (
          <button
            className={`flutter-voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleVoiceRecording}
            disabled={isSending || showSidebar}
            title={isRecording ? 'Stop Recording' : 'Voice Input'}
          >
            {isRecording ? <MdMic size={22} /> : <MdMicNone size={22} />}
          </button>
        )}

        {/* Text Input */}
        <input
          type="text"
          className={`flutter-text-input ${isRecording ? 'recording' : ''}`}
          placeholder={isRecording ? 'Listening...' : 'Type a medical inquiry...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending || showSidebar || isRecording}
        />

        {isRecording && (
          <div className="flutter-recording-indicator">
            <MdGraphicEq size={20} />
          </div>
        )}

        {/* Send Button */}
        <button
          className="flutter-send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || isSending || showSidebar || isRecording}
          title="Send Message"
        >
          <MdSend size={22} />
        </button>
      </div>
    </div>
  );
};

export default ChatbotWidget;
