import express from 'express';
import { getTwitterClient } from '../config/twitter.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/diagnostics/twitter-quota
 * Check Twitter API rate limits and quota status
 */
router.get('/twitter-quota', async (req, res) => {
  try {
    const twitterClient = getTwitterClient();

    if (!twitterClient) {
      return res.status(503).json({
        timestamp: new Date().toISOString(),
        status: 'unavailable',
        error: 'Twitter client not initialized'
      });
    }

    const diagnostic = {
      timestamp: new Date().toISOString(),
      status: 'running',
      results: {}
    };

    // 1. Verify credentials
    try {
      const client = await twitterClient.v2.me();
      diagnostic.results.authentication = {
        status: 'success',
        username: client.data.username,
        userId: client.data.id
      };
    } catch (authError) {
      diagnostic.results.authentication = {
        status: 'failed',
        error: authError.message,
        code: authError.code
      };

      // If auth fails, return early
      diagnostic.status = 'failed';
      diagnostic.recommendation = 'Check Twitter API credentials in Railway environment variables';
      return res.status(401).json(diagnostic);
    }

    // 2. Check rate limit status for search endpoint
    try {
      const rateLimitResponse = await twitterClient.v2.get('tweets/search/recent', {
        query: 'test',
        max_results: 10
      }, {
        fullResponse: true
      });

      const headers = rateLimitResponse.headers;
      const rateLimit = {
        limit: parseInt(headers['x-rate-limit-limit']) || 0,
        remaining: parseInt(headers['x-rate-limit-remaining']) || 0,
        reset: headers['x-rate-limit-reset']
          ? new Date(parseInt(headers['x-rate-limit-reset']) * 1000).toISOString()
          : null
      };

      diagnostic.results.rateLimit = {
        status: 'success',
        ...rateLimit,
        percentageUsed: rateLimit.limit > 0
          ? Math.round(((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100)
          : 0
      };

      // Check for monthly cap headers
      if (headers['x-app-limit-24hour-limit']) {
        diagnostic.results.monthlyCap = {
          limit: parseInt(headers['x-app-limit-24hour-limit']),
          remaining: parseInt(headers['x-app-limit-24hour-remaining']),
          reset: new Date(parseInt(headers['x-app-limit-24hour-reset']) * 1000).toISOString()
        };
      }

      // Determine tier
      if (rateLimit.limit === 1) {
        diagnostic.results.tier = {
          name: 'FREE',
          cost: '$0/month',
          requestsPerWindow: '1 per 15 minutes',
          monthlyTweetCap: '500,000 tweets'
        };
      } else if (rateLimit.limit === 60) {
        diagnostic.results.tier = {
          name: 'BASIC',
          cost: '$200/month',
          requestsPerWindow: '60 per 15 minutes',
          monthlyTweetCap: '500,000 tweets'
        };
      } else if (rateLimit.limit >= 300) {
        diagnostic.results.tier = {
          name: 'PRO',
          cost: '$5,000/month',
          requestsPerWindow: `${rateLimit.limit} per 15 minutes`,
          monthlyTweetCap: '1,000,000 tweets'
        };
      }

    } catch (rateLimitError) {
      if (rateLimitError.code === 429) {
        diagnostic.results.rateLimit = {
          status: 'exhausted',
          error: 'Rate limit hit - all quota consumed',
          code: 429
        };
        diagnostic.status = 'rate_limited';
      } else {
        diagnostic.results.rateLimit = {
          status: 'failed',
          error: rateLimitError.message,
          code: rateLimitError.code
        };
      }
    }

    // 3. Try actual search
    try {
      const searchResult = await twitterClient.v2.search('developer', {
        max_results: 10
      });

      diagnostic.results.search = {
        status: 'success',
        resultsFound: searchResult.meta.result_count
      };
    } catch (searchError) {
      diagnostic.results.search = {
        status: 'failed',
        error: searchError.message,
        code: searchError.code
      };

      if (searchError.code === 429) {
        diagnostic.status = 'rate_limited';
      }
    }

    // 4. Generate recommendations
    diagnostic.recommendations = generateRecommendations(diagnostic.results);

    res.json(diagnostic);

  } catch (error) {
    logger.error('Twitter quota diagnostic failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Generate recommendations based on diagnostic results
 */
function generateRecommendations(results) {
  const recommendations = [];

  // Check if rate limited
  if (results.rateLimit?.status === 'exhausted' || results.search?.code === 429) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'Rate limit exhausted',
      action: 'Wait until rate limit resets',
      resetTime: results.rateLimit?.reset,
      alternative: 'Enable Reddit immediately (free, unlimited) - see /api/diagnostics/reddit-setup'
    });
  }

  // Check if on FREE tier with remaining quota
  if (results.tier?.name === 'FREE' && results.rateLimit?.remaining > 0) {
    recommendations.push({
      priority: 'INFO',
      issue: 'On FREE tier with limited quota',
      action: 'Current configuration (1 keyword/hour) is optimized for FREE tier',
      upgrade: 'Consider Twitter Basic ($200/mo) for 60x more requests if Reddit insufficient'
    });
  }

  // Check if monthly cap might be hit
  if (results.monthlyCap && results.monthlyCap.remaining === 0) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'Monthly tweet cap exhausted (500,000 tweets)',
      action: 'All searches will fail until monthly reset (December 1st)',
      immediate: 'Enable Reddit to restore lead discovery today'
    });
  }

  // Check if no quota remaining
  if (results.rateLimit?.remaining === 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'No API requests remaining in current window',
      action: `Wait until ${results.rateLimit.reset}`,
      duration: 'Maximum 15 minutes'
    });
  }

  // Always recommend Reddit as alternative
  recommendations.push({
    priority: 'SUGGESTION',
    issue: 'Diversify platform risk',
    action: 'Enable Reddit alongside Twitter',
    benefits: [
      'Free forever (no monthly caps)',
      '100 requests/minute vs Twitter 1/15min',
      'Higher quality leads (budgets, timelines)',
      'Code already implemented'
    ],
    setup: 'See REDDIT_SETUP_GUIDE.md - 30 minute setup'
  });

  return recommendations;
}

/**
 * GET /api/diagnostics/reddit-setup
 * Instructions for enabling Reddit
 */
router.get('/reddit-setup', (req, res) => {
  res.json({
    title: 'Reddit Setup Instructions',
    estimatedTime: '30 minutes',
    cost: '$0',
    steps: [
      {
        step: 1,
        action: 'Create Reddit App',
        url: 'https://www.reddit.com/prefs/apps',
        instructions: [
          'Click "create app" or "create another app"',
          'Fill in form:',
          '  - Name: LeadScout',
          '  - Type: script',
          '  - Description: Lead generation for web dev opportunities',
          '  - About URL: (leave blank)',
          '  - Redirect URI: http://localhost:8080',
          'Click "create app"',
          'Copy the client_id (under app name) and client_secret'
        ]
      },
      {
        step: 2,
        action: 'Add to Railway Environment Variables',
        variables: {
          REDDIT_CLIENT_ID: 'your_client_id_from_step_1',
          REDDIT_CLIENT_SECRET: 'your_secret_from_step_1',
          REDDIT_USERNAME: 'your_reddit_username',
          REDDIT_PASSWORD: 'your_reddit_password',
          REDDIT_USER_AGENT: 'LeadScout/1.0 by /u/your_username',
          POLLING_PLATFORMS: 'reddit,twitter'
        }
      },
      {
        step: 3,
        action: 'Run Database Migration',
        instructions: [
          'Go to Supabase dashboard',
          'Open SQL Editor',
          'Execute migration from: apps/api/database/migrations/add_reddit_platform.sql',
          'This adds "reddit" to allowed platform values'
        ]
      },
      {
        step: 4,
        action: 'Verify Deployment',
        instructions: [
          'Railway will auto-redeploy after env var changes',
          'Check logs for: "Reddit poller initialized successfully"',
          'Wait for next polling cycle (top of hour)',
          'Check for: "Reddit polling completed" with lead counts'
        ]
      }
    ],
    expectedResults: {
      timeToFirstLeads: '60 minutes (next polling cycle)',
      leadsPerDay: '5-15 high-quality leads',
      platforms: 'Reddit (primary) + Twitter (supplementary if quota available)',
      cost: '$0'
    },
    documentation: '/REDDIT_SETUP_GUIDE.md'
  });
});

/**
 * GET /api/diagnostics/system-status
 * Overall system health check
 */
router.get('/system-status', async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check database connection
  try {
    const { getDatabase } = await import('../config/database.js');
    const db = getDatabase();
    const { data, error } = await db
      .from('keywords')
      .select('count')
      .limit(1);

    status.services.database = {
      status: error ? 'error' : 'healthy',
      error: error?.message
    };
  } catch (dbError) {
    status.services.database = {
      status: 'error',
      error: dbError.message
    };
  }

  // Check Telegram connection
  try {
    const { getTelegramBot } = await import('../config/telegram.js');
    const bot = getTelegramBot();

    status.services.telegram = {
      status: bot ? 'connected' : 'not_initialized'
    };
  } catch (telegramError) {
    status.services.telegram = {
      status: 'error',
      error: telegramError.message
    };
  }

  // Check Twitter connection
  try {
    const twitterClient = getTwitterClient();
    if (!twitterClient) {
      status.services.twitter = {
        status: 'not_initialized'
      };
    } else {
      await twitterClient.v2.me();
      status.services.twitter = {
        status: 'authenticated'
      };
    }
  } catch (twitterError) {
    status.services.twitter = {
      status: twitterError.code === 429 ? 'rate_limited' : 'error',
      error: twitterError.message
    };
  }

  // Overall health
  const allHealthy = Object.values(status.services)
    .every(service => service.status === 'healthy' || service.status === 'connected' || service.status === 'authenticated');

  status.overall = allHealthy ? 'healthy' : 'degraded';

  res.json(status);
});

export default router;
