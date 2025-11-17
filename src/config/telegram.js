import TelegramBot from 'node-telegram-bot-api';
import config from './env.js';
import logger from '../utils/logger.js';
import { getDatabase } from './database.js';

let telegramBot = null;
let callbackHandlers = new Map();

/**
 * Initialize Telegram bot
 * Uses polling mode for development, can be switched to webhook for production
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

    // Initialize bot with polling for development
    // In production on Railway, consider using webhooks instead
    telegramBot = new TelegramBot(config.telegram.botToken, {
      polling: config.nodeEnv === 'development' ? true : false
    });

    // Handle polling errors
    if (config.nodeEnv === 'development') {
      telegramBot.on('polling_error', (error) => {
        logger.error('Telegram polling error', {
          error: error.message,
          code: error.code
        });
      });
    }

    // Set up callback query handler
    telegramBot.on('callback_query', handleCallbackQuery);

    logger.info('Telegram bot initialized successfully', {
      mode: config.nodeEnv === 'development' ? 'polling' : 'webhook',
      chatId: config.telegram.chatId
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
 * Stop the Telegram bot (cleanup)
 */
async function stopTelegramBot() {
  try {
    if (telegramBot && config.nodeEnv === 'development') {
      await telegramBot.stopPolling();
      logger.info('Telegram bot polling stopped');
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
  stopTelegramBot,
  getTelegramBot
};