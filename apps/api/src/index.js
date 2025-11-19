import http from 'http';
import cron from 'node-cron';
import config from './config/env.js';
import logger from './utils/logger.js';
import { initializeDatabase, testDatabaseConnection } from './config/database.js';
import app from './server.js';
import { initializeTwitterClient, testTwitterConnection } from './config/twitter.js';
import { initializeRedditClient, testRedditConnection } from './config/reddit.js';
import { initializeOpenAIClient, testOpenAIConnection } from './config/openai.js';
import { initializeTelegramBot, testTelegramConnection, stopTelegramBot } from './config/telegram.js';
import { pollAllPlatforms, getPollingStats } from './services/polling.js';
import { setupCallbackHandlers } from './services/notifier.js';
import { getTimeAgo } from './utils/helpers.js';
import websocketService from './services/websocket-service.js';
import { runStartupDiagnostics } from './utils/startup-diagnostics.js';

//Here because of the way the code is structured, we need to import the process module here
import process from 'process';
// Global state
let isShuttingDown = false;
let cronJob = null;
let httpServer = null;

/**
 * Initialize all services
 */
async function initializeServices() {
  const services = {
    database: false,
    twitter: false,
    reddit: false,
    openai: false,
    telegram: false
  };

  // Initialize database (required)
  logger.info('Initializing database connection...');
  initializeDatabase();
  services.database = await testDatabaseConnection();
  if (!services.database) {
    throw new Error('Database connection required');
  }

  // Initialize Twitter (optional)
  try {
    logger.info('Initializing Twitter client...');
    initializeTwitterClient();
    // Skip connection test in production to save API calls
    if (config.nodeEnv === 'development') {
      services.twitter = await testTwitterConnection();
    } else {
      services.twitter = true; // Assume it works in production
      logger.info('Twitter client initialized (skipping connection test in production)');
    }
  } catch (error) {
    logger.warn('Twitter service not available', { error: error.message });
  }

  // Initialize Reddit client (optional)
  try {
    logger.info('Initializing Reddit client...');
    initializeRedditClient();
    services.reddit = await testRedditConnection();
  } catch (error) {
    logger.warn('Reddit service not available', { error: error.message });
  }

  // Initialize OpenAI (required for AI scoring)
  try {
    logger.info('Initializing OpenAI client...');
    initializeOpenAIClient();
    services.openai = await testOpenAIConnection();
  } catch (error) {
    logger.warn('OpenAI service not available', { error: error.message });
  }

  // Initialize Telegram (required for notifications)
  try {
    logger.info('Initializing Telegram bot...');
    initializeTelegramBot();
    services.telegram = await testTelegramConnection();

    // Setup callback handlers for Telegram buttons
    if (services.telegram) {
      setupCallbackHandlers();
      logger.info('Telegram callback handlers registered');
    }
  } catch (error) {
    logger.warn('Telegram service not available', { error: error.message });
  }

  return services;
}

/**
 * Start the cron scheduler
 */
function startCronScheduler() {
  const schedule = config.polling.cronSchedule;

  logger.info('Starting cron scheduler', {
    schedule: schedule,
    intervalMinutes: config.polling.intervalMinutes
  });

  cronJob = cron.schedule(schedule, async () => {
    logger.info('Cron job triggered, starting polling cycle');

    try {
      await pollAllPlatforms();
    } catch (error) {
      logger.error('Polling cycle failed', {
        error: error.message,
        stack: error.stack
      });
    }
  });

  cronJob.start();
  logger.info('Cron scheduler started successfully');
}

/**
 * Start Express API server with WebSocket support
 */
function startExpressServer() {
  const port = config.port || 3000;

  // Add health check route to Express app
  app.get('/health', async (req, res) => {
    const stats = getPollingStats();
    const wsStats = websocketService.getStats();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      lastPoll: stats.lastPollTime ? getTimeAgo(stats.lastPollTime) : 'Never',
      isPolling: stats.isPolling,
      statistics: {
        totalPolls: stats.totalPolls,
        totalLeadsFound: stats.totalLeadsFound,
        totalNotificationsSent: stats.totalNotificationsSent,
        totalApiCost: `$${stats.totalApiCost.toFixed(4)}`
      },
      websocket: {
        connected: wsStats.totalConnected,
        subscribedToLeads: wsStats.subscribedToLeads
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };
    res.json(health);
  });

  // Add stats route
  app.get('/stats', async (req, res) => {
    const stats = getPollingStats();
    res.json(stats);
  });

  // Add WebSocket stats route
  app.get('/ws-stats', async (req, res) => {
    const wsStats = websocketService.getStats();
    res.json(wsStats);
  });

  // Create HTTP server
  httpServer = http.createServer(app);

  // Initialize WebSocket server
  websocketService.initialize(httpServer);

  // Start HTTP server
  httpServer.listen(port, () => {
    logger.info(`Express API server with WebSocket support listening on port ${port}`, {
      endpoints: [
        `http://localhost:${port}/health`,
        `http://localhost:${port}/stats`,
        `http://localhost:${port}/ws-stats`,
        `http://localhost:${port}/api/leads`,
        `http://localhost:${port}/api/keywords`,
        `http://localhost:${port}/api/analytics`,
        `http://localhost:${port}/api/settings`,
        `http://localhost:${port}/api/email`
      ],
      websocket: `ws://localhost:${port}`
    });
  });
}

/**
 * Main application entry point
 */
async function startApplication() {
  try {
    // Log startup information
    logger.info('🚀 Starting Ovalay Lead Finder', {
      nodeEnv: config.nodeEnv,
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    });

    // Initialize all services
    const services = await initializeServices();

    // Log service status
    logger.info('Service initialization complete', services);

    // Run startup diagnostics for Twitter
    if (services.twitter) {
      logger.info('========================================');
      logger.info('Running Twitter API diagnostics...');
      logger.info('========================================');

      try {
        await runStartupDiagnostics();
      } catch (diagError) {
        logger.error('Startup diagnostics failed (non-fatal)', {
          error: diagError.message
        });
      }

      logger.info('========================================');
      logger.info('Diagnostics complete. Check logs above for Twitter quota status.');
      logger.info('For detailed analysis, visit: /api/diagnostics/twitter-quota');
      logger.info('========================================');
    }

    // Check if minimum required services are available
    if (!services.database) {
      throw new Error('Cannot start without database connection');
    }

    if (!services.telegram) {
      logger.warn('Telegram not available - notifications will be disabled');
    }

    if (!services.twitter && !services.reddit) {
      logger.warn('No polling platforms available - system will not find new leads');
    }

    // Start cron scheduler
    startCronScheduler();

    // Start Express API server
    startExpressServer();

    // Log configuration (without sensitive data)
    logger.info('Configuration loaded', {
      pollingInterval: config.polling.cronSchedule,
      platforms: config.polling.platforms,
      notificationMinScore: config.scoring.notificationMinScore,
      aiAnalysisMinScore: config.scoring.aiAnalysisMinScore,
      aiAnalysisEnabled: config.scoring.enableAiAnalysis,
      logLevel: config.logging.level
    });

    // Run initial polling cycle
    logger.info('Running initial polling cycle...');
    try {
      const initialResults = await pollAllPlatforms();
      logger.info('Initial polling completed', {
        leadsFound: initialResults.leadsCreated,
        notificationsSent: initialResults.notificationsSent
      });
    } catch (error) {
      logger.error('Initial polling failed', {
        error: error.message
      });
      // Don't exit - continue with scheduled polling
    }

    logger.info('✅ Application started successfully', {
      uptime: process.uptime(),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      services: Object.entries(services)
        .filter(([_, status]) => status)
        .map(([name]) => name)
    });

  } catch (error) {
    logger.error('❌ Failed to start application', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.info(`⚠️ Received ${signal}, starting graceful shutdown...`);

  try {
    // Stop cron job
    if (cronJob) {
      logger.info('Stopping cron scheduler...');
      cronJob.stop();
    }

    // Stop Telegram bot
    logger.info('Stopping Telegram bot...');
    await stopTelegramBot();

    // Shutdown WebSocket server
    logger.info('Shutting down WebSocket server...');
    await websocketService.shutdown();

    // Close HTTP server
    if (httpServer) {
      logger.info('Closing HTTP server...');
      httpServer.close();
    }

    // Log final stats
    const finalStats = getPollingStats();
    logger.info('Final statistics', {
      totalPolls: finalStats.totalPolls,
      totalLeadsFound: finalStats.totalLeadsFound,
      totalNotificationsSent: finalStats.totalNotificationsSent,
      totalApiCost: `$${finalStats.totalApiCost.toFixed(4)}`,
      uptime: Math.round(process.uptime()) + ' seconds'
    });

    logger.info('Shutdown complete', {
      signal: signal
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled promise rejection', {
    reason: reason,
    promise: promise
  });
});

// Start the application
startApplication();