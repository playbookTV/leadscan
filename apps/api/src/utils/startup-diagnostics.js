import logger from './logger.js';

/**
 * Run diagnostics on server startup
 * Checks Twitter API quota, rate limits, and tier
 */
export async function runStartupDiagnostics() {
  logger.info('Running startup diagnostics...');

  try {
    // Dynamic import to avoid circular dependencies
    const twitterClient = (await import('../config/twitter.js')).default;

    const results = {
      timestamp: new Date().toISOString(),
      twitter: {}
    };

    // 1. Test Twitter authentication
    try {
      const client = await twitterClient.v2.me();
      results.twitter.authentication = {
        status: 'success',
        username: client.data.username,
        userId: client.data.id
      };

      logger.info('Twitter authentication successful', {
        username: client.data.username,
        userId: client.data.id
      });
    } catch (authError) {
      results.twitter.authentication = {
        status: 'failed',
        error: authError.message,
        code: authError.code
      };

      logger.error('Twitter authentication failed', {
        error: authError.message,
        code: authError.code
      });

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
