import logger from './logger.js';

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = () => true,
    onRetry = null,
    context = 'operation'
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!retryCondition(error)) {
        logger.warn(`${context} failed with non-retryable error`, {
          error: error.message,
          attempt: attempt + 1
        });
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxRetries) {
        logger.error(`${context} failed after ${maxRetries + 1} attempts`, {
          error: error.message,
          totalAttempts: maxRetries + 1
        });
        throw error;
      }

      // Log retry attempt
      logger.warn(`${context} failed, retrying...`, {
        error: error.message,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        nextRetryIn: delay
      });

      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(error, attempt);
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next retry (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is a network/timeout error that should be retried
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
export function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNRESET') return true;
  if (error.code === 'ETIMEDOUT') return true;
  if (error.code === 'ECONNREFUSED') return true;
  if (error.code === 'ENOTFOUND') return true;
  if (error.code === 'ENETUNREACH') return true;

  // Fetch errors
  if (error.message?.includes('fetch failed')) return true;
  if (error.message?.includes('network')) return true;
  if (error.message?.includes('timeout')) return true;

  // HTTP 5xx errors (server errors)
  if (error.status >= 500 && error.status < 600) return true;

  // HTTP 429 (rate limit) - might want to retry with longer delay
  if (error.status === 429) return true;

  // Supabase specific errors
  if (error.message?.includes('Connection')) return true;
  if (error.message?.includes('PostgreSQL')) return true;

  return false;
}

/**
 * Retry function specifically for database operations
 * @param {Function} fn - The async database function to retry
 * @param {string} context - Context for logging
 * @returns {Promise} - Result of the database operation
 */
export async function retryDatabaseOperation(fn, context = 'database operation') {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryCondition: isRetryableError,
    context,
    onRetry: async (error, attempt) => {
      // Could send alert on final retry
      if (attempt === 2) {
        logger.error(`Database operation failing repeatedly: ${context}`, {
          error: error.message,
          attempt: attempt + 1
        });
      }
    }
  });
}

/**
 * Retry function specifically for API calls
 * @param {Function} fn - The async API function to retry
 * @param {string} context - Context for logging
 * @returns {Promise} - Result of the API call
 */
export async function retryApiCall(fn, context = 'API call') {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error) => {
      // Don't retry 4xx errors (except 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        return false;
      }
      return isRetryableError(error);
    },
    context
  });
}

export default {
  retryWithBackoff,
  retryDatabaseOperation,
  retryApiCall,
  isRetryableError
};
