import config from './config/env.js';
import logger from './utils/logger.js';
import { initializeDatabase, testDatabaseConnection } from './config/database.js';

let isShuttingDown = false;

async function startApplication() {
  try {
    logger.info('Starting Lead Finder application', {
      nodeEnv: config.nodeEnv,
      platforms: config.polling.platforms
    });

    initializeDatabase();
    await testDatabaseConnection();

    logger.info('Application started successfully', {
      pollingSchedule: config.polling.cronSchedule,
      platforms: config.polling.platforms
    });

  } catch (error) {
    logger.error('Failed to start application', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    logger.info('Cleanup completed, shutting down');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', {
    reason: reason,
    promise: promise
  });
});

startApplication();
