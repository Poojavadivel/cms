/**
 * ChatbotFloatingButton.jsx
 * Floating button to open/close chatbot
 */

import React, { useState } from 'react';
import { MdSmartToy } from 'react-icons/md';
import ChatbotWidget from './ChatbotWidget';
import './ChatbotFloatingButton.css';

const ChatbotFloatingButton = ({ userRole = 'doctor' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMaximized(false);
  };

  const handleToggleSize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button className="chatbot-floating-btn" onClick={handleToggle} title="Ask Movi">
          <img src="/assets/chatbotimg.png" alt="Chatbot" className="chatbot-image" />
          <span className="chatbot-pulse"></span>
        </button>
      )}

      {/* Chatbot Widget */}
      {isOpen && (
        <ChatbotWidget
          onClose={handleClose}
          onToggleSize={handleToggleSize}
          isMaximized={isMaximized}
          userRole={userRole}
        />
      )}
    </>
  );
};

export default ChatbotFloatingButton;
