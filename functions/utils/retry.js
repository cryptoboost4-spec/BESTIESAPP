/**
 * Retry utility for external API calls and operations
 * Provides exponential backoff retry logic with configurable attempts
 */

const functions = require('firebase-functions');

/**
 * Retry an operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {number} options.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried (default: retry all errors)
 * @param {string} options.operationName - Name of operation for logging (optional)
 * @returns {Promise<any>} Result of the operation
 */
async function retryOperation(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    operationName = 'operation',
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 0) {
        functions.logger.info(`✅ ${operationName} succeeded on attempt ${attempt + 1}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        functions.logger.warn(`❌ ${operationName} failed with non-retryable error:`, error.message);
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt >= maxRetries) {
        functions.logger.error(`❌ ${operationName} failed after ${attempt + 1} attempts:`, error.message);
        throw error;
      }

      // Log retry attempt
      functions.logger.warn(
        `⚠️ ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
        error.message
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  // Should never reach here, but just in case
  throw lastError;
}

/**
 * Check if an error is retryable (network errors, timeouts, rate limits)
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED') {
    return true;
  }

  // HTTP errors that are retryable
  if (error.statusCode) {
    // 429 = Too Many Requests (rate limit)
    // 500-599 = Server errors
    // 408 = Request Timeout
    if (error.statusCode === 429 || 
        error.statusCode === 408 ||
        (error.statusCode >= 500 && error.statusCode < 600)) {
      return true;
    }
  }

  // Twilio errors
  if (error.code === 20003 || // Unreachable destination
      error.code === 20429 || // Too Many Requests
      error.code === 21608) { // Queue overflow
    return true;
  }

  // Stripe errors
  if (error.type === 'StripeConnectionError' ||
      error.type === 'StripeAPIError' && error.statusCode >= 500) {
    return true;
  }

  // SendGrid errors
  if (error.code === 'ETIMEDOUT' || 
      error.code === 'ECONNRESET' ||
      error.response?.statusCode >= 500) {
    return true;
  }

  // Firebase errors
  if (error.code === 'deadline-exceeded' ||
      error.code === 'unavailable' ||
      error.code === 'resource-exhausted') {
    return true;
  }

  return false;
}

/**
 * Retry wrapper specifically for external API calls
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Result of the operation
 */
async function retryApiCall(fn, options = {}) {
  return retryOperation(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    shouldRetry: isRetryableError,
    ...options,
  });
}

/**
 * Retry wrapper for Firestore operations
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Result of the operation
 */
async function retryFirestoreOperation(fn, options = {}) {
  return retryOperation(fn, {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    shouldRetry: (error) => {
      // Retry on network errors and resource exhaustion
      return error.code === 'deadline-exceeded' ||
             error.code === 'unavailable' ||
             error.code === 'resource-exhausted' ||
             error.code === 'aborted';
    },
    ...options,
  });
}

module.exports = {
  retryOperation,
  retryApiCall,
  retryFirestoreOperation,
  isRetryableError,
};

