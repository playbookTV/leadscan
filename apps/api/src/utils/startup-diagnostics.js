import logger from './logger.js';

/**
 * Run diagnostics on server startup
 * Checks Twitter API quota, rate limits, and tier
 */
export async function runStartupDiagnostics() {
  logger.info('Running startup diagnostics...');

  try {
    // Dynamic import to avoid circular dependencies
    const { getTwitterClient } = await import('../config/twitter.js');
    const twitterClient = getTwitterClient();

    if (!twitterClient) {
      logger.error('Twitter client not initialized');
      return {
        timestamp: new Date().toISOString(),
        twitter: {
          status: 'not_initialized',
          error: 'Twitter client not available'
        }
      };
    }

    const results = {
      timestamp: new Date().toISOString(),
      twitter: {}
    };

    // 1. Test Twitter authentication (using Bearer Token compatible endpoint)
    // Note: Bearer Token (OAuth 2.0 app-only) doesn't support /2/users/me
    // We'll use a simple search to test auth and get rate limits
    try {
      // Perform a minimal search query to verify authentication
      // This works with Bearer Token and returns rate limit info
      const testResponse = await twitterClient.v2.search('test', {
        max_results: 10,
        'tweet.fields': ['created_at']
      });

      results.twitter.authentication = {
        status: 'success',
        method: 'bearer_token',
        note: 'OAuth 2.0 App-only authentication (Bearer Token)'
      };

      logger.info('Twitter authentication successful', {
        method: 'bearer_token',
        resultsCount: testResponse.meta?.result_count || 0
      });

      // Extract rate limit info from the response
      if (testResponse.rateLimit) {
        results.twitter.initialRateLimit = {
          limit: testResponse.rateLimit.limit,
          remaining: testResponse.rateLimit.remaining,
          reset: new Date(testResponse.rateLimit.reset * 1000).toISOString()
        };

        logger.info('Twitter rate limit status', {
          limit: testResponse.rateLimit.limit,
          remaining: testResponse.rateLimit.remaining,
          percentUsed: Math.round(((testResponse.rateLimit.limit - testResponse.rateLimit.remaining) / testResponse.rateLimit.limit) * 100)
        });
      }
    } catch (authError) {
      results.twitter.authentication = {
        status: 'failed',
        error: authError.message,
        code: authError.code,
        data: authError.data, // Include API error details
        hint: authError.code === 403
          ? 'Bearer Token may be invalid or expired. Check TWITTER_BEARER_TOKEN in Railway environment variables.'
          : authError.code === 429
          ? 'Rate limit exhausted. Wait for reset or upgrade Twitter API tier.'
          : 'Check Twitter API credentials in Railway dashboard.'
      };

      logger.error('Twitter authentication failed', {
        error: authError.message,
        code: authError.code,
        apiError: authError.data,
        hint: authError.code === 403
          ? 'Invalid/expired Bearer Token - update TWITTER_BEARER_TOKEN in Railway'
          : authError.code === 429
          ? 'Rate limit hit during startup - will retry at next polling cycle'
          : 'Authentication error - check API credentials'
      });

      // Log specific guidance for 403 errors
      if (authError.code === 403) {
        logger.error('🚨 ACTION REQUIRED: Update Twitter Bearer Token', {
          step1: 'Go to https://developer.twitter.com/en/portal/dashboard',
          step2: 'Click your app → Keys and tokens tab',
          step3: 'Under "Bearer Token", click "Regenerate"',
          step4: 'Copy the new token (starts with AAAAAAAAAA...)',
          step5: 'Update TWITTER_BEARER_TOKEN in Railway environment variables',
          step6: 'Railway will auto-redeploy in ~2 minutes'
        });
      }

      // If auth fails, don't proceed with other checks
      return results;
    }

    // 2. Check rate limits
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

      results.twitter.rateLimit = rateLimit;

      // Determine tier
      let tier = 'UNKNOWN';
      if (rateLimit.limit === 1) {
        tier = 'FREE';
      } else if (rateLimit.limit === 60) {
        tier = 'BASIC';
      } else if (rateLimit.limit >= 300) {
        tier = 'PRO';
      }

      results.twitter.tier = tier;

      // Log tier and quota
      logger.info('Twitter API quota check', {
        tier: tier,
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        percentageUsed: rateLimit.limit > 0
          ? Math.round(((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100)
          : 0
      });

      // Check for monthly cap
      if (headers['x-app-limit-24hour-limit']) {
        const monthlyCap = {
          limit: parseInt(headers['x-app-limit-24hour-limit']),
          remaining: parseInt(headers['x-app-limit-24hour-remaining'])
        };

        results.twitter.monthlyCap = monthlyCap;

        if (monthlyCap.remaining === 0) {
          logger.error('❌ CRITICAL: Twitter monthly tweet cap exhausted', {
            limit: monthlyCap.limit,
            remaining: 0,
            message: 'All Twitter searches will fail until monthly reset (December 1st)'
          });

          logger.warn('⚠️  RECOMMENDATION: Enable Reddit immediately to restore lead discovery', {
            endpoint: '/api/diagnostics/reddit-setup',
            estimatedSetupTime: '30 minutes',
            cost: '$0'
          });
        } else {
          logger.info('Twitter monthly cap status', monthlyCap);
        }
      }

      // Warn if quota low
      if (rateLimit.remaining === 0) {
        logger.warn('⚠️  Twitter rate limit exhausted', {
          resetTime: rateLimit.reset,
          message: `No requests available until ${rateLimit.reset}`
        });
      } else if (rateLimit.remaining <= 2 && tier === 'FREE') {
        logger.warn('⚠️  Twitter quota low', {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          tier: tier
        });
      }

      // Success message
      logger.info('✅ Twitter diagnostics complete', {
        tier: tier,
        status: rateLimit.remaining > 0 ? 'healthy' : 'rate_limited',
        requestsAvailable: rateLimit.remaining
      });

    } catch (rateLimitError) {
      if (rateLimitError.code === 429) {
        results.twitter.rateLimit = {
          status: 'exhausted',
          error: 'Rate limit hit during startup check',
          code: 429
        };

        logger.error('❌ Twitter rate limit exhausted at startup', {
          error: rateLimitError.message,
          code: 429
        });

        logger.error('❌ CRITICAL: Twitter searches will fail', {
          reason: 'Rate limit or monthly cap exhausted',
          diagnostic: '/api/diagnostics/twitter-quota',
          action: 'Visit diagnostic endpoint for detailed analysis'
        });

        logger.warn('⚠️  IMMEDIATE ACTION REQUIRED: Enable Reddit', {
          endpoint: '/api/diagnostics/reddit-setup',
          guide: 'REDDIT_SETUP_GUIDE.md',
          estimatedTime: '30 minutes'
        });
      } else {
        results.twitter.rateLimit = {
          status: 'failed',
          error: rateLimitError.message,
          code: rateLimitError.code
        };

        logger.error('Twitter rate limit check failed', {
          error: rateLimitError.message,
          code: rateLimitError.code
        });
      }
    }

    return results;

  } catch (error) {
    logger.error('Startup diagnostics failed', {
      error: error.message,
      stack: error.stack
    });

    return {
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Run comprehensive diagnostics for all services
 */
export async function runAllServiceDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Twitter
  try {
    const twitterResults = await runStartupDiagnostics();
    diagnostics.services.twitter = twitterResults.twitter;
  } catch (error) {
    diagnostics.services.twitter = {
      status: 'error',
      error: error.message
    };
  }

  // Database
  try {
    const { getDatabase } = await import('../config/database.js');
    const db = getDatabase();
    const { data, error } = await db
      .from('keywords')
      .select('count')
      .limit(1);

    diagnostics.services.database = {
      status: error ? 'error' : 'healthy',
      error: error?.message
    };

    if (diagnostics.services.database.status === 'healthy') {
      logger.info('✅ Database connection healthy');
    } else {
      logger.error('❌ Database connection failed', { error: error?.message });
    }
  } catch (dbError) {
    diagnostics.services.database = {
      status: 'error',
      error: dbError.message
    };
    logger.error('❌ Database check failed', { error: dbError.message });
  }

  // Telegram
  try {
    const { getTelegramBot } = await import('../config/telegram.js');
    const bot = getTelegramBot();

    diagnostics.services.telegram = {
      status: bot ? 'connected' : 'not_initialized'
    };

    if (bot) {
      logger.info('✅ Telegram bot connected');
    } else {
      logger.warn('⚠️  Telegram bot not initialized');
    }
  } catch (telegramError) {
    diagnostics.services.telegram = {
      status: 'error',
      error: telegramError.message
    };
    logger.error('❌ Telegram check failed', { error: telegramError.message });
  }

  // Overall status
  const allHealthy = Object.values(diagnostics.services)
    .every(service =>
      service.status === 'healthy' ||
      service.status === 'connected' ||
      (service.authentication?.status === 'success' && service.rateLimit?.remaining > 0)
    );

  diagnostics.overall = allHealthy ? 'healthy' : 'degraded';

  logger.info('Startup diagnostics complete', {
    overall: diagnostics.overall,
    timestamp: diagnostics.timestamp
  });

  return diagnostics;
}

export default {
  runStartupDiagnostics,
  runAllServiceDiagnostics
};
