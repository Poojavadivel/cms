/**
 * bot/aiService.js
 * Core AI service for OpenAI-compatible API calls with retries and circuit breaker
 */

const config = require('./config');
const { createLogger } = require('../../utils/apiLogger');
const { circuitIsOpen, recordFailureAndMaybeTripCircuit, recordSuccess, metrics } = require('./circuitBreaker');
const { sleep } = require('./utils');

/**
 * Call OpenAI-compatible API with retry logic and circuit breaker
 * @param {Array} messages - Array of message objects with role and content
 * @param {number} temperature - Temperature for response generation
 * @param {number} initialMaxTokens - Initial max tokens for completion
 * @param {object} loggerOptions - Options for API logger
 * @returns {Promise<string>} AI-generated response text
 */
async function callGeminiChatWithRetries(
  messages, 
  temperature = config.DEFAULT_TEMPERATURE, 
  initialMaxTokens = config.DEFAULT_MAX_COMPLETION_TOKENS, 
  loggerOptions = {}
) {
  metrics.calls += 1;
  
  // Initialize logger
  const logger = createLogger();
  logger.startRequest({
    apiProvider: 'openai-compatible',
    apiUrl: config.API_URL,
    model: config.MODEL_NAME,
    messages: messages,
    temperature: temperature,
    maxTokens: initialMaxTokens,
    ...loggerOptions
  });
  
  if (circuitIsOpen()) { 
    metrics.failures += 1;
    await logger.logCircuitBreaker('Circuit breaker is open');
    throw new Error("Circuit breaker is open; aborting call to API");
  }
  
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array");
  }

  let attempt = 0;
  let maxTokens = Number(initialMaxTokens) || config.DEFAULT_MAX_COMPLETION_TOKENS;
  maxTokens = Math.min(maxTokens, config.MAX_COMPLETION_TOKENS_MAX);

  while (attempt <= config.MAX_RETRIES) {
    attempt += 1;
    const cid = `attempt_${attempt}_${Date.now().toString(36)}`;
    
    try {
      console.debug(`[${cid}] Calling OpenAI-compatible API with model: ${config.MODEL_NAME}, maxTokens=${maxTokens}`);
      
      const requestBody = {
        model: config.MODEL_NAME,
        messages: messages,
        max_tokens: Math.floor(maxTokens),
        temperature: temperature
      };

      const response = await fetch(config.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Extract content from OpenAI-compatible response format
      const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning_content;

      if (content && String(content).trim()) {
        metrics.successes += 1;
        recordSuccess();
        
        // Log successful API call
        await logger.logSuccess(data, {
          responseContent: String(content).trim(),
          costPerToken: 0.00002 // Update with your actual pricing
        });
        
        return String(content).trim();
      }

      // Handle empty response - increase tokens and retry
      if ((!content || !String(content).trim()) && maxTokens < config.MAX_COMPLETION_TOKENS_MAX) {
        const newTokens = Math.min(config.MAX_COMPLETION_TOKENS_MAX, Math.floor(maxTokens * 2));
        console.warn(`[${cid}] API returned empty output. Increasing maxTokens ${maxTokens} -> ${newTokens} and retrying (attempt ${attempt}/${config.MAX_RETRIES}).`);
        metrics.emptyResponses += 1;
        metrics.retries += 1;
        
        // Log retry
        await logger.logRetry(attempt, `Empty response, increasing tokens to ${newTokens}`);
        
        maxTokens = newTokens;
        await sleep(config.RETRY_BACKOFF_BASE_MS * attempt);
        continue;
      }

      console.error(`[${cid}] API returned no usable text.`);
      metrics.failures += 1;
      recordFailureAndMaybeTripCircuit();
      
      const error = new Error("API returned empty/whitespace response content.");
      await logger.logError(error);
      throw error;
      
    } catch (err) {
      // Check if it's a rate limit or server error
      const errorMessage = err.message || String(err);
      const isRateLimitError = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit");
      const isServerError = errorMessage.includes("500") || errorMessage.includes("503") || errorMessage.includes("internal error");
      const transient = isRateLimitError || isServerError;

      console.error(`[${cid}] API error:`, errorMessage);

      if (!transient || attempt > config.MAX_RETRIES) {
        metrics.failures += 1;
        recordFailureAndMaybeTripCircuit();
        await logger.logError(err, { retryCount: attempt - 1 });
        throw err;
      }

      metrics.retries += 1;
      await logger.logRetry(attempt, errorMessage);
      
      const backoffMs = config.RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      console.warn(`[${cid}] Transient error detected. Backing off ${backoffMs}ms and retrying (attempt ${attempt}/${config.MAX_RETRIES})`);
      await sleep(backoffMs);
      continue;
    }
  }

  metrics.failures += 1;
  recordFailureAndMaybeTripCircuit();
  const error = new Error("Exceeded retry attempts calling API");
  await logger.logError(error, { retryCount: config.MAX_RETRIES });
  throw error;
}

module.exports = {
  callGeminiChatWithRetries
};
