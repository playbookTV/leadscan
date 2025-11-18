import snoowrap from 'snoowrap';
import config from './env.js';
import logger from '../utils/logger.js';

let redditClient = null;

/**
 * Initialize Reddit API client
 * Uses OAuth 2.0 with refresh token for app-only authentication
 */
function initializeRedditClient() {
  try {
    if (!config.reddit.clientId || !config.reddit.clientSecret) {
      logger.warn('Reddit credentials not configured, Reddit polling will be disabled');
      return null;
    }

    redditClient = new snoowrap({
      userAgent: config.reddit.userAgent,
      clientId: config.reddit.clientId,
      clientSecret: config.reddit.clientSecret,
      refreshToken: config.reddit.refreshToken
    });

    // Configure to respect rate limits
    redditClient.config({
      requestDelay: 1000, // 1 second between requests
      continueAfterRatelimitError: true,
      warnings: config.nodeEnv === 'development',
      debug: config.nodeEnv === 'development'
    });

    logger.info('Reddit API client initialized successfully');
    return redditClient;
  } catch (error) {
    logger.error('Failed to initialize Reddit client', {
      error: error.message,
      code: error.code
    });
    throw new Error(`Reddit client initialization failed: ${error.message}`);
  }
}

/**
 * Test Reddit API connection
 */
async function testRedditConnection() {
  try {
    if (!redditClient) {
      logger.warn('Reddit client not initialized, skipping connection test');
      return false;
    }

    // Test with simple API call
    const me = await redditClient.getMe();

    logger.info('Reddit API connection test successful', {
      username: me.name,
      karma: me.link_karma + me.comment_karma
    });

    return true;
  } catch (error) {
    logger.error('Reddit API connection test failed', {
      error: error.message,
      code: error.code
    });
    return false;
  }
}

/**
 * Get Reddit client instance
 */
function getRedditClient() {
  if (!redditClient) {
    logger.warn('Reddit client not initialized');
    return null;
  }
  return redditClient;
}

export {
  initializeRedditClient,
  testRedditConnection,
  getRedditClient
};

export default {
  initializeRedditClient,
  testRedditConnection,
  getRedditClient
};
