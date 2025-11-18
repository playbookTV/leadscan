import express from 'express';
import logger from '../utils/logger.js';
import { processWebhookUpdate, setupWebhook, getTelegramBot } from '../config/telegram.js';

const router = express.Router();

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram via webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    if (!update) {
      return res.status(400).json({ error: 'No update provided' });
    }

    logger.debug('Received Telegram webhook', {
      updateId: update.update_id,
      hasMessage: !!update.message,
      hasCallbackQuery: !!update.callback_query
    });

    // Process the update
    processWebhookUpdate(update);

    // Telegram expects a 200 OK response
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('Error handling Telegram webhook', {
      error: error.message,
      stack: error.stack
    });

    // Still return 200 to avoid Telegram retrying
    res.status(200).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/telegram/setup-webhook
 * Manually trigger webhook setup (for admin use)
 */
router.post('/setup-webhook', async (req, res, next) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        error: 'webhookUrl is required in request body'
      });
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      return res.status(400).json({
        error: 'Invalid webhook URL format'
      });
    }

    logger.info('Setting up Telegram webhook', { webhookUrl });

    const result = await setupWebhook(webhookUrl);

    if (result) {
      res.json({
        success: true,
        message: 'Webhook set up successfully',
        webhookUrl: webhookUrl
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to set up webhook'
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/telegram/webhook-info
 * Get current webhook information
 */
router.get('/webhook-info', async (req, res, next) => {
  try {
    const bot = getTelegramBot();

    if (!bot) {
      return res.status(503).json({
        error: 'Telegram bot not initialized'
      });
    }

    const webhookInfo = await bot.getWebHookInfo();

    res.json({
      url: webhookInfo.url,
      has_custom_certificate: webhookInfo.has_custom_certificate,
      pending_update_count: webhookInfo.pending_update_count,
      last_error_date: webhookInfo.last_error_date
        ? new Date(webhookInfo.last_error_date * 1000).toISOString()
        : null,
      last_error_message: webhookInfo.last_error_message || null,
      max_connections: webhookInfo.max_connections,
      allowed_updates: webhookInfo.allowed_updates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/telegram/webhook
 * Delete the current webhook
 */
router.delete('/webhook', async (req, res, next) => {
  try {
    const bot = getTelegramBot();

    if (!bot) {
      return res.status(503).json({
        error: 'Telegram bot not initialized'
      });
    }

    await bot.deleteWebHook();

    logger.info('Telegram webhook deleted');

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
