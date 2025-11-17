import OpenAI from 'openai';
import config from './env.js';
import logger from '../utils/logger.js';
import { getDatabase } from './database.js';

let openaiClient = null;
let dailyCostTracking = {
  date: new Date().toISOString().split('T')[0],
  totalCost: 0,
  requestCount: 0
};

// GPT-4o-mini pricing (as of 2024)
const PRICING = {
  'gpt-4o-mini': {
    input: 0.00015,  // per 1K tokens
    output: 0.0006   // per 1K tokens
  }
};

/**
 * Initialize OpenAI client with API key
 */
function initializeOpenAIClient() {
  try {
    if (!config.openai.apiKey) {
      logger.error('OpenAI API key not configured');
      throw new Error('OpenAI API key is required');
    }

    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
      maxRetries: 3,
      timeout: 30000 // 30 seconds
    });

    logger.info('OpenAI client initialized successfully', {
      model: config.openai.model,
      maxDailyCost: config.openai.maxDailyCost
    });

    return openaiClient;
  } catch (error) {
    logger.error('Failed to initialize OpenAI client', {
      error: error.message
    });
    throw new Error(`OpenAI client initialization failed: ${error.message}`);
  }
}

/**
 * Test OpenAI API connection
 */
async function testOpenAIConnection() {
  try {
    if (!openaiClient) {
      logger.warn('OpenAI client not initialized, skipping connection test');
      return false;
    }

    // Make a minimal API call to test connection
    const response = await openaiClient.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: 'You are a test.' },
        { role: 'user', content: 'Reply with OK' }
      ],
      max_tokens: 5
    });

    const cost = calculateCost(response.usage);

    logger.info('OpenAI API connection test successful', {
      model: response.model,
      tokensUsed: response.usage?.total_tokens,
      testCost: cost
    });

    return true;
  } catch (error) {
    logger.error('OpenAI API connection test failed', {
      error: error.message,
      type: error.type,
      code: error.code
    });
    return false;
  }
}

/**
 * Calculate the cost of an API call
 * @param {Object} usage - OpenAI usage object with prompt_tokens and completion_tokens
 */
function calculateCost(usage) {
  if (!usage) return 0;

  const model = config.openai.model;
  const pricing = PRICING[model];

  if (!pricing) {
    logger.warn('Unknown model pricing, using default', { model });
    return 0;
  }

  const inputCost = (usage.prompt_tokens / 1000) * pricing.input;
  const outputCost = (usage.completion_tokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return Math.round(totalCost * 10000) / 10000; // Round to 4 decimal places
}

/**
 * Track API costs and enforce daily limit
 * @param {number} cost - Cost of the current API call
 */
async function trackCost(cost) {
  const today = new Date().toISOString().split('T')[0];

  // Reset daily tracking if it's a new day
  if (dailyCostTracking.date !== today) {
    dailyCostTracking = {
      date: today,
      totalCost: 0,
      requestCount: 0
    };
  }

  dailyCostTracking.totalCost += cost;
  dailyCostTracking.requestCount += 1;

  // Log cost tracking
  logger.debug('OpenAI API cost tracked', {
    cost: cost,
    dailyTotal: dailyCostTracking.totalCost,
    dailyRequests: dailyCostTracking.requestCount,
    maxDailyCost: config.openai.maxDailyCost
  });

  // Store in database for long-term tracking
  try {
    const db = getDatabase();
    await db.from('polling_logs').insert({
      platform: 'openai',
      execution_time: 0,
      posts_fetched: 0,
      leads_created: 0,
      api_costs: cost,
      metadata: {
        model: config.openai.model,
        dailyTotal: dailyCostTracking.totalCost,
        dailyRequests: dailyCostTracking.requestCount
      }
    });
  } catch (error) {
    logger.error('Failed to store OpenAI cost in database', {
      error: error.message
    });
  }

  // Check if daily limit exceeded
  if (dailyCostTracking.totalCost >= config.openai.maxDailyCost) {
    const error = new Error('Daily OpenAI cost limit exceeded');
    logger.error('Daily OpenAI cost limit exceeded', {
      dailyTotal: dailyCostTracking.totalCost,
      limit: config.openai.maxDailyCost
    });
    throw error;
  }
}

/**
 * Make an OpenAI API call with cost tracking
 * @param {Object} params - OpenAI API parameters
 */
async function callOpenAI(params) {
  try {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    // Check daily cost before making the call
    if (dailyCostTracking.totalCost >= config.openai.maxDailyCost) {
      throw new Error('Daily OpenAI cost limit already exceeded');
    }

    // Make the API call
    const response = await openaiClient.chat.completions.create({
      model: config.openai.model,
      ...params
    });

    // Calculate and track cost
    const cost = calculateCost(response.usage);
    await trackCost(cost);

    // Return response with cost info
    return {
      ...response,
      cost: cost
    };
  } catch (error) {
    logger.error('OpenAI API call failed', {
      error: error.message,
      type: error.type
    });
    throw error;
  }
}

/**
 * Get current daily cost statistics
 */
function getDailyCostStats() {
  return {
    ...dailyCostTracking,
    remainingBudget: config.openai.maxDailyCost - dailyCostTracking.totalCost
  };
}

/**
 * Get the OpenAI client instance
 */
function getOpenAIClient() {
  if (!openaiClient) {
    logger.warn('OpenAI client not initialized');
    return null;
  }
  return openaiClient;
}

export {
  initializeOpenAIClient,
  testOpenAIConnection,
  callOpenAI,
  calculateCost,
  trackCost,
  getDailyCostStats,
  getOpenAIClient
};

export default {
  initializeOpenAIClient,
  testOpenAIConnection,
  callOpenAI,
  calculateCost,
  trackCost,
  getDailyCostStats,
  getOpenAIClient
};