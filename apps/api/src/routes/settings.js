import express from 'express'
import db from '../config/database.js'
import logger from '../utils/logger.js'
import { env } from '../config/env.js'

const router = express.Router()

// GET /api/settings/config - Get current configuration
router.get('/config', async (req, res, next) => {
  try {
    // Return non-sensitive configuration
    const config = {
      polling: {
        interval: env.POLLING_INTERVAL || 300000,
        enabled: env.POLLING_ENABLED !== 'false',
        max_results_per_poll: env.MAX_RESULTS_PER_POLL || 100
      },
      platforms: {
        twitter: {
          enabled: !!env.TWITTER_ACCESS_TOKEN,
          rate_limit: 15 // requests per 15 minutes
        },
        linkedin: {
          enabled: !!env.LINKEDIN_ACCESS_TOKEN,
          rate_limit: 100 // requests per day
        }
      },
      notifications: {
        telegram: {
          enabled: !!env.TELEGRAM_BOT_TOKEN && !!env.TELEGRAM_CHAT_ID,
          min_score_for_notification: env.MIN_SCORE_FOR_NOTIFICATION || 7
        }
      },
      scoring: {
        enabled: !!env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        max_score: 10
      },
      environment: env.NODE_ENV || 'development',
      version: '1.0.0'
    }

    res.json(config)
  } catch (error) {
    next(error)
  }
})

// GET /api/settings/oauth-status - Check OAuth connection status
router.get('/oauth-status', async (req, res, next) => {
  try {
    // Check OAuth tokens in database
    const { data: tokens, error } = await db
      .from('oauth_tokens')
      .select('platform, is_valid, expires_at, last_refreshed')

    if (error) throw error

    // Check each platform's status
    const status = {
      twitter: {
        connected: false,
        valid: false,
        expires_at: null,
        last_refreshed: null
      },
      linkedin: {
        connected: false,
        valid: false,
        expires_at: null,
        last_refreshed: null
      }
    }

    tokens?.forEach(token => {
      if (status[token.platform]) {
        status[token.platform] = {
          connected: true,
          valid: token.is_valid,
          expires_at: token.expires_at,
          last_refreshed: token.last_refreshed
        }
      }
    })

    res.json(status)
  } catch (error) {
    next(error)
  }
})

// GET /api/settings/stats - System statistics
router.get('/stats', async (req, res, next) => {
  try {
    // Database statistics
    const { count: totalLeads } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })

    const { count: totalKeywords } = await db
      .from('keywords')
      .select('*', { count: 'exact', head: true })

    const { count: totalPolls } = await db
      .from('polling_logs')
      .select('*', { count: 'exact', head: true })

    // Get last poll times
    const { data: lastPolls } = await db
      .from('polling_logs')
      .select('platform, created_at')
      .eq('status', 'success')
      .order('created_at', { ascending: false })

    // Group by platform to get last poll time
    const lastPollByPlatform = {}
    const seen = new Set()
    lastPolls?.forEach(poll => {
      if (!seen.has(poll.platform)) {
        lastPollByPlatform[poll.platform] = poll.created_at
        seen.add(poll.platform)
      }
    })

    // System uptime (approximation based on process uptime)
    const uptimeSeconds = process.uptime()
    const uptime = {
      days: Math.floor(uptimeSeconds / 86400),
      hours: Math.floor((uptimeSeconds % 86400) / 3600),
      minutes: Math.floor((uptimeSeconds % 3600) / 60)
    }

    res.json({
      database: {
        total_leads: totalLeads || 0,
        total_keywords: totalKeywords || 0,
        total_polls: totalPolls || 0
      },
      polling: {
        last_polls: lastPollByPlatform,
        next_poll_in: env.POLLING_INTERVAL ? `${Math.floor(env.POLLING_INTERVAL / 60000)} minutes` : 'Unknown'
      },
      system: {
        uptime,
        uptime_string: `${uptime.days}d ${uptime.hours}h ${uptime.minutes}m`,
        memory_usage: {
          heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
        },
        node_version: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/settings/test-notification - Test notification system
router.post('/test-notification', async (req, res, next) => {
  try {
    const { message = 'This is a test notification from Leadscout' } = req.body

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return res.status(503).json({
        error: 'Telegram notifications are not configured'
      })
    }

    // Import notification service dynamically
    const { sendTelegramNotification } = await import('../services/notificationService.js')

    try {
      await sendTelegramNotification(message)
      logger.info('Test notification sent successfully')
      res.json({
        success: true,
        message: 'Test notification sent successfully'
      })
    } catch (error) {
      logger.error('Failed to send test notification:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
        details: error.message
      })
    }
  } catch (error) {
    next(error)
  }
})

// POST /api/settings/reset-polling - Reset polling for a platform
router.post('/reset-polling/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params

    if (!['twitter', 'linkedin'].includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform. Must be twitter or linkedin'
      })
    }

    // Clear polling logs for this platform
    const { error: deleteError } = await db
      .from('polling_logs')
      .delete()
      .eq('platform', platform)

    if (deleteError) throw deleteError

    logger.info(`Polling history reset for ${platform}`)

    res.json({
      success: true,
      message: `Polling history reset for ${platform}. Next poll will start fresh.`
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/settings/logs - Get recent application logs
router.get('/logs', async (req, res, next) => {
  try {
    const { limit = 100, level = 'all' } = req.query

    // Get polling logs from database
    const { data: logs, error } = await db
      .from('polling_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) throw error

    // Format logs
    const formattedLogs = logs?.map(log => ({
      timestamp: log.created_at,
      level: log.status === 'success' ? 'info' : 'error',
      platform: log.platform,
      message: log.status === 'success'
        ? `Successfully polled ${log.platform}, found ${log.leads_found} leads`
        : `Failed to poll ${log.platform}`,
      details: log.error_message || null,
      metadata: {
        leads_found: log.leads_found,
        keywords_used: log.keywords_used
      }
    })) || []

    // Filter by level if specified
    const filteredLogs = level === 'all'
      ? formattedLogs
      : formattedLogs.filter(log => log.level === level)

    res.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      level_filter: level
    })
  } catch (error) {
    next(error)
  }
})

export default router