/**
 * bot/config.js
 * Enterprise-grade configuration management for chatbot system
 * Centralizes all environment variables and constants
 */

const config = {
  // OpenAI-compatible API Configuration
  API_KEY: process.env.OPENAI_API_KEY || "sk-do-e9Ea0Pjt1cSZ2HWIBarUzy4AD5i6OeMiA7pwooPIJOSD3oqdxby60s5ogW",
  API_URL: process.env.OPENAI_API_URL || "https://inference.do-ai.run/v1/chat/completions",
  MODEL_NAME: process.env.AI_MODEL || "openai-gpt-oss-120b",

  // Retry and Timeout Configuration
  MAX_RETRIES: Number(process.env.MAX_RETRIES ?? 3),
  DEFAULT_MAX_COMPLETION_TOKENS: Number(process.env.MAX_COMPLETION_TOKENS ?? 1500),
  MAX_COMPLETION_TOKENS_MAX: Number(process.env.MAX_COMPLETION_TOKENS_MAX ?? 7500),
  RETRY_BACKOFF_BASE_MS: Number(process.env.RETRY_BACKOFF_BASE_MS ?? 500),

  // Circuit Breaker Configuration
  CIRCUIT_BREAKER_FAILURES: Number(process.env.CIRCUIT_BREAKER_FAILURES ?? 6),
  CIRCUIT_BREAKER_COOLDOWN_MS: Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS ?? 60000),

  // AI Model Configuration
  DEFAULT_TEMPERATURE: Number(process.env.TEMPERATURE ?? 1),
  
  // Response Configuration
  GREETING_RESPONSES: [
    "Hello! How can I assist you today?",
    "Hi there! What can I help you with?",
    "Hey! I'm here to help. What do you need?",
    "Hello! How may I help you today?",
    "Hi! What brings you here today?",
  ],
  
  THANK_YOU_RESPONSES: [
    "You're welcome! Let me know if you need anything else.",
    "Happy to help! Feel free to ask if you have more questions.",
    "My pleasure! Anything else I can assist with?",
  ],

  // Validation
  validate() {
    if (!this.API_KEY) {
      console.warn("[bot/config] WARNING: API key missing. Please set OPENAI_API_KEY in .env file.");
      return false;
    }
    return true;
  }
};

// Validate on load
config.validate();

module.exports = config;
