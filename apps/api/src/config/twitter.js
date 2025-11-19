import { TwitterApi } from 'twitter-api-v2';
import config from './env.js';
import logger from '../utils/logger.js';

let twitterClient = null;

/**
 * Initialize Twitter API v2 client
 * Uses OAuth 2.0 Bearer Token authentication for app-only access
 */
function initializeTwitterClient() {
  try {
    if (!config.twitter.bearerToken) {
      logger.warn('Twitter Bearer Token not configured, Twitter polling will be disabled');
      return null;
    }

    // Create client with bearer token (app-only authentication)
    twitterClient = new TwitterApi(config.twitter.bearerToken);

    // Get read-only client
    const readOnlyClient = twitterClient.readOnly;

    logger.info('Twitter API client initialized successfully');
    return readOnlyClient;
  } catch (error) {
    logger.error('Failed to initialize Twitter client', {
      error: error.message,
      code: error.code
    });
    throw new Error(`Twitter client initialization failed: ${error.message}`);
  }
}

/**
 * Test Twitter API connection with a simple API call
 */
async function testTwitterConnection() {
  try {
    if (!twitterClient) {
      logger.warn('Twitter client not initialized, skipping connection test');
      return false;
    }

    // Test with a simple search query to verify credentials
    // Using a minimal query to avoid hitting rate limits
    const readOnlyClient = twitterClient.readOnly;
    const result = await readOnlyClient.v2.search('test', {
      max_results: 10,
      'tweet.fields': ['created_at']
    });

    logger.info('Twitter API connection test successful', {
      resultsCount: result.data?.data?.length || 0,
      rateLimit: result.rateLimit ? {
        limit: result.rateLimit.limit,
        remaining: result.rateLimit.remaining,
        reset: new Date(result.rateLimit.reset * 1000).toISOString()
      } : 'unknown'
    });

    return true;
  } catch (error) {
    logger.error('Twitter API connection test failed', {
      error: error.message,
      code: error.code,
      data: error.data
    });
    return false;
  }
}

/**
 * Get the Twitter client instance
 */
function getTwitterClient() {
  if (!twitterClient) {
    logger.warn('Twitter client not initialized');
    return null;
  }
  return twitterClient.readOnly;
}

/**
 * Handle Twitter API rate limiting with exponential backoff
 * @param {Function} apiCall - The API call to execute
 * @param {number} maxRetries - Maximum number of retries
 */
async function withRateLimitRetry(apiCall, maxRetries = 3) {
  let retries = 0;
  let delay = 1000; // Start with 1 second delay

  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      // 403 = Authentication/Authorization error (don't retry)
      if (error.code === 403) {
        logger.error('Twitter API authentication failed (403)', {
          error: error.message,
          hint: 'Bearer Token may be invalid or expired. Update TWITTER_BEARER_TOKEN in Railway environment variables.'
        });
        throw new Error('Twitter authentication failed: Invalid or expired Bearer Token');
      }

      // 429 = Rate limit error (retry with backoff)
      if (error.code === 429 || error.rateLimit) {
        retries++;
        const resetTime = error.rateLimit?.reset
          ? new Date(error.rateLimit.reset * 1000)
          : new Date(Date.now() + delay);

        logger.warn(`Twitter rate limit hit, retry ${retries}/${maxRetries}`, {
          resetTime: resetTime.toISOString(),
          delay: delay
        });

        if (retries >= maxRetries) {
          throw new Error('Twitter rate limit exceeded after maximum retries');
        }

        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Double the delay for next retry
      } else {
        // Other errors, throw immediately
        logger.error('Twitter API error', {
          code: error.code,
          error: error.message
        });
        throw error;
      }
    }
  }
}

export {
  initializeTwitterClient,
  testTwitterConnection,
  getTwitterClient,
  withRateLimitRetry
};

export default {
  initializeTwitterClient,
  testTwitterConnection,
  getTwitterClient,
  withRateLimitRetry
};
