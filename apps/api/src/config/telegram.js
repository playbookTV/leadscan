import TelegramBot from 'node-telegram-bot-api';
import config from './env.js';
import logger from '../utils/logger.js';
import { getDatabase } from './database.js';

let telegramBot = null;
let callbackHandlers = new Map();

/**
 * Initialize Telegram bot
 * Uses polling mode for development, webhooks for production
 */
function initializeTelegramBot() {
  try {
    if (!config.telegram.botToken) {
      logger.error('Telegram bot token not configured');
      throw new Error('Telegram bot token is required');
    }

    if (!config.telegram.chatId) {
      logger.error('Telegram chat ID not configured');
      throw new Error('Telegram chat ID is required');
    }

    // Determine if we should use polling or webhooks
    // Use polling in development or when explicitly enabled via env var
    const usePolling = config.nodeEnv === 'development' ||
                       process.env.TELEGRAM_USE_POLLING === 'true';

    // Initialize bot
    telegramBot = new TelegramBot(config.telegram.botToken, {
      polling: usePolling
    });

    // Handle polling errors if polling is enabled
    if (usePolling) {
      let reconnectAttempts = 0;
      const MAX_RECONNECT_ATTEMPTS = 5;
      const RECONNECT_DELAY = 5000; // 5 seconds

      telegramBot.on('polling_error', async (error) => {
        logger.error('Telegram polling error', {
          error: error.message,
          code: error.code
        });

        // Fatal errors that indicate connection issues
        const isFatalError = error.code === 'EFATAL' ||
                            error.code === 'ECONNRESET' ||
                            error.code === 'ETIMEDOUT' ||
                            error.code === 'ENOTFOUND' ||
                            error.message?.includes('ECONNRESET') ||
                            error.message?.includes('read ECONNRESET');

        if (isFatalError && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          logger.warn('Attempting to reconnect Telegram bot', {
            attempt: reconnectAttempts,
            maxAttempts: MAX_RECONNECT_ATTEMPTS,
            delayMs: RECONNECT_DELAY
          });

          // Wait before reconnecting
          await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));

          try {
            // Stop current polling
            await telegramBot.stopPolling({ cancel: true });
            logger.info('Stopped Telegram polling');

            // Restart polling
            await telegramBot.startPolling();
            logger.info('Restarted Telegram polling successfully');

            // Reset reconnect counter on success
            reconnectAttempts = 0;
          } catch (reconnectError) {
            logger.error('Failed to reconnect Telegram bot', {
              error: reconnectError.message,
              attempt: reconnectAttempts
            });

            // If we've exhausted all attempts, log critical error
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
              logger.error('Telegram bot reconnection failed after maximum attempts', {
                maxAttempts: MAX_RECONNECT_ATTEMPTS,
                lastError: reconnectError.message
              });
              // Could send alert here via email or other channel
            }
          }
        }
      });
    }

    // Set up callback query handler
    telegramBot.on('callback_query', handleCallbackQuery);

    logger.info('Telegram bot initialized successfully', {
      mode: usePolling ? 'polling' : 'webhook',
      chatId: config.telegram.chatId,
      nodeEnv: config.nodeEnv
    });

    return telegramBot;
  } catch (error) {
    logger.error('Failed to initialize Telegram bot', {
      error: error.message
    });
    throw new Error(`Telegram bot initialization failed: ${error.message}`);
  }
}

/**
 * Test Telegram bot connection
 */
async function testTelegramConnection() {
  try {
    if (!telegramBot) {
      logger.warn('Telegram bot not initialized, skipping connection test');
      return false;
    }

    // Get bot info
    const botInfo = await telegramBot.getMe();

    logger.info('Telegram bot connection test successful', {
      botUsername: botInfo.username,
      botId: botInfo.id,
      firstName: botInfo.first_name
    });

    // Send a test message to verify chat ID
    try {
      await telegramBot.sendMessage(
        config.telegram.chatId,
        '✅ Lead Finder Bot initialized successfully!',
        {
          parse_mode: 'Markdown',
          disable_notification: true
        }
      );
      logger.info('Test message sent to Telegram chat');
    } catch (msgError) {
      logger.error('Failed to send test message to chat', {
        error: msgError.message,
        chatId: config.telegram.chatId
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Telegram bot connection test failed', {
      error: error.message,
      code: error.code
    });
    return false;
  }
}

/**
 * Handle callback queries from inline keyboard buttons
 * @param {Object} query - Telegram callback query object
 */
async function handleCallbackQuery(query) {
  const { data, message, from } = query;

  try {
    logger.debug('Received Telegram callback query', {
      data: data,
      userId: from.id,
      username: from.username
    });

    // Parse callback data (format: "action:leadId:additionalData")
    const [action, leadId, ...additionalData] = data.split(':');

    // Get handler for this action
    const handler = callbackHandlers.get(action);
    if (handler) {
      await handler(query, leadId, additionalData.join(':'));
    } else {
      logger.warn('No handler registered for callback action', { action });
    }

    // Answer the callback query to remove loading state
    await telegramBot.answerCallbackQuery(query.id);
  } catch (error) {
    logger.error('Error handling Telegram callback query', {
      error: error.message,
      data: data
    });

    // Still answer the query to remove loading state
    try {
      await telegramBot.answerCallbackQuery(query.id, {
        text: 'Error processing action',
        show_alert: true
      });
    } catch (answerError) {
      logger.error('Failed to answer callback query', {
        error: answerError.message
      });
    }
  }
}

/**
 * Register a callback handler for inline keyboard actions
 * @param {string} action - The action identifier
 * @param {Function} handler - The handler function
 */
function registerCallbackHandler(action, handler) {
  callbackHandlers.set(action, handler);
  logger.debug('Registered Telegram callback handler', { action });
}

/**
 * Send a message to the configured chat
 * @param {string} text - Message text
 * @param {Object} options - Telegram message options
 */
async function sendMessage(text, options = {}) {
  try {
    if (!telegramBot) {
      throw new Error('Telegram bot not initialized');
    }

    const result = await telegramBot.sendMessage(
      config.telegram.chatId,
      text,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      }
    );

    logger.debug('Telegram message sent successfully', {
      messageId: result.message_id,
      chatId: result.chat.id
    });

    return result;
  } catch (error) {
    logger.error('Failed to send Telegram message', {
      error: error.message,
      code: error.code
    });
    throw error;
  }
}

/**
 * Edit an existing message
 * @param {number} messageId - The message ID to edit
 * @param {string} text - New message text
 * @param {Object} options - Telegram message options
 */
async function editMessage(messageId, text, options = {}) {
  try {
    if (!telegramBot) {
      throw new Error('Telegram bot not initialized');
    }

    const result = await telegramBot.editMessageText(text, {
      chat_id: config.telegram.chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options
    });

    logger.debug('Telegram message edited successfully', {
      messageId: messageId
    });

    return result;
  } catch (error) {
    // Ignore error if message hasn't changed
    if (error.message?.includes('message is not modified')) {
      logger.debug('Message not modified (content unchanged)', { messageId });
      return null;
    }

    logger.error('Failed to edit Telegram message', {
      error: error.message,
      messageId: messageId
    });
    throw error;
  }
}

/**
 * Create inline keyboard markup for lead actions
 * @param {string} leadId - The lead ID
 * @param {string} postUrl - URL to the original post
 * @param {string} profileUrl - URL to the author's profile
 */
function createLeadActionKeyboard(leadId, postUrl, profileUrl) {
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '✅ Contacted',
          callback_data: `contacted:${leadId}`
        },
        {
          text: '⏰ Remind 1h',
          callback_data: `remind:${leadId}:60`
        }
      ],
      [
        {
          text: '👀 Review Later',
          callback_data: `review:${leadId}`
        },
        {
          text: '❌ Skip',
          callback_data: `skip:${leadId}`
        }
      ],
      [
        {
          text: '🔗 View Post',
          url: postUrl
        },
        {
          text: '👤 View Profile',
          url: profileUrl
        }
      ]
    ]
  };

  return keyboard;
}

/**
 * Set up webhook for production
 * @param {string} webhookUrl - The full webhook URL (e.g., https://your-domain.com/api/telegram/webhook)
 */
async function setupWebhook(webhookUrl) {
  try {
    if (!telegramBot) {
      throw new Error('Telegram bot not initialized');
    }

    // Delete any existing webhook first
    await telegramBot.deleteWebHook();
    logger.info('Deleted existing Telegram webhook');

    // Set new webhook
    const result = await telegramBot.setWebHook(webhookUrl);

    if (result) {
      logger.info('Telegram webhook set successfully', {
        webhookUrl: webhookUrl
      });

      // Verify webhook info
      const webhookInfo = await telegramBot.getWebHookInfo();
      logger.info('Telegram webhook info', {
        url: webhookInfo.url,
        has_custom_certificate: webhookInfo.has_custom_certificate,
        pending_update_count: webhookInfo.pending_update_count,
        last_error_date: webhookInfo.last_error_date,
        last_error_message: webhookInfo.last_error_message
      });

      return true;
    }

    return false;
  } catch (error) {
    logger.error('Failed to setup Telegram webhook', {
      error: error.message,
      webhookUrl: webhookUrl
    });
    throw error;
  }
}

/**
 * Process webhook update
 * @param {Object} update - Telegram update object from webhook
 */
function processWebhookUpdate(update) {
  try {
    if (!telegramBot) {
      throw new Error('Telegram bot not initialized');
    }

    // Process the update through the bot instance
    telegramBot.processUpdate(update);

    logger.debug('Processed Telegram webhook update', {
      updateId: update.update_id
    });
  } catch (error) {
    logger.error('Error processing Telegram webhook update', {
      error: error.message,
      updateId: update?.update_id
    });
    throw error;
  }
}

/**
 * Stop the Telegram bot (cleanup)
 */
async function stopTelegramBot() {
  try {
    const usePolling = config.nodeEnv === 'development' ||
                       process.env.TELEGRAM_USE_POLLING === 'true';

    if (telegramBot && usePolling) {
      await telegramBot.stopPolling();
      logger.info('Telegram bot polling stopped');
    } else if (telegramBot) {
      // Delete webhook when stopping
      await telegramBot.deleteWebHook();
      logger.info('Telegram webhook deleted');
    }
  } catch (error) {
    logger.error('Error stopping Telegram bot', {
      error: error.message
    });
  }
}

/**
 * Get the Telegram bot instance
 */
function getTelegramBot() {
  if (!telegramBot) {
    logger.warn('Telegram bot not initialized');
    return null;
  }
  return telegramBot;
}

export {
  initializeTelegramBot,
  testTelegramConnection,
  registerCallbackHandler,
  sendMessage,
  editMessage,
  createLeadActionKeyboard,
  setupWebhook,
  processWebhookUpdate,
  stopTelegramBot,
  getTelegramBot
};

export default {
  initializeTelegramBot,
  testTelegramConnection,
  registerCallbackHandler,
  sendMessage,
  editMessage,
  createLeadActionKeyboard,
  setupWebhook,
  processWebhookUpdate,
  stopTelegramBot,
  getTelegramBot
};