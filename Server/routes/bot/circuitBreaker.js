/**
 * bot/circuitBreaker.js
 * Circuit breaker pattern implementation to prevent cascading failures
 */

const config = require('./config');

// In-memory circuit breaker state
const circuitBreaker = {
  failures: 0,
  state: "CLOSED", // CLOSED, OPEN
  openedAt: null
};

// In-memory metrics
const metrics = {
  calls: 0,
  successes: 0,
  failures: 0,
  emptyResponses: 0,
  retries: 0,
  circuitBreakersTripped: 0
};

/**
 * Check if circuit breaker is open
 * @returns {boolean} true if circuit is open
 */
function circuitIsOpen() {
  if (circuitBreaker.state === "OPEN") {
    const now = Date.now();
    if (now - circuitBreaker.openedAt > config.CIRCUIT_BREAKER_COOLDOWN_MS) {
      circuitBreaker.state = "CLOSED";
      circuitBreaker.failures = 0;
      circuitBreaker.openedAt = null;
      console.warn("[circuit] Circuit breaker cooled down; moving to CLOSED.");
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Record failure and potentially trip the circuit breaker
 */
function recordFailureAndMaybeTripCircuit() {
  circuitBreaker.failures += 1;
  if (circuitBreaker.failures >= config.CIRCUIT_BREAKER_FAILURES) {
    circuitBreaker.state = "OPEN";
    circuitBreaker.openedAt = Date.now();
    metrics.circuitBreakersTripped += 1;
    console.error("[circuit] Circuit breaker TRIPPED due to repeated failures.");
  }
}

/**
 * Reset circuit breaker on success
 */
function recordSuccess() {
  circuitBreaker.failures = 0;
  circuitBreaker.state = "CLOSED";
}

module.exports = {
  circuitBreaker,
  metrics,
  circuitIsOpen,
  recordFailureAndMaybeTripCircuit,
  recordSuccess
};
