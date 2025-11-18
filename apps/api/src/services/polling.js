import config from '../config/env.js';
import logger from '../utils/logger.js';
import { getDatabase } from '../config/database.js';
import { pollTwitter } from './twitter-poller.js';
import { pollLinkedIn } from './linkedin-poller.js';
import { checkDuplicate, scoreLead } from './lead-scorer.js';
import { sendLeadAlert } from './notifier.js';
import websocketService from './websocket-service.js';

// Track polling state
let isPolling = false;
let lastPollTime = null;
let pollStats = {
  totalPolls: 0,
  totalLeadsFound: 0,
  totalNotificationsSent: 0,
  totalApiCost: 0
};

/**
 * Main polling orchestrator - coordinates all platform polling
 */
async function pollAllPlatforms() {
  if (isPolling) {
    logger.warn('Polling already in progress, skipping this cycle');
    return;
  }

  isPolling = true;
  const startTime = Date.now();
  const pollResults = {
    platforms: {},
    totalPosts: 0,
    leadsCreated: 0,
    duplicatesSkipped: 0,
    notificationsSent: 0,
    errors: [],
    apiCosts: 0
  };

  try {
    logger.info('Starting polling cycle', {
      pollNumber: pollStats.totalPolls + 1,
      lastPollTime: lastPollTime
    });

    // Fetch active keywords from database
    const keywords = await fetchActiveKeywords();
    if (keywords.length === 0) {
      logger.warn('No active keywords found, skipping polling');
      return pollResults;
    }

    logger.info('Active keywords loaded', {
      total: keywords.length,
      twitter: keywords.filter(k => !k.platform || k.platform === 'twitter').length,
      linkedin: keywords.filter(k => !k.platform || k.platform === 'linkedin').length,
      allPlatforms: keywords.filter(k => !k.platform).length
    });

    // Poll platforms in parallel
    const [twitterLeads, linkedinLeads] = await Promise.all([
      pollTwitterSafely(keywords),
      pollLinkedInSafely(keywords)
    ]);

    // Combine results
    const allLeads = [...twitterLeads, ...linkedinLeads];
    pollResults.totalPosts = allLeads.length;

    logger.info('Platform polling completed', {
      twitterLeads: twitterLeads.length,
      linkedinLeads: linkedinLeads.length,
      totalLeads: allLeads.length
    });

    // Process each lead
    for (const lead of allLeads) {
      try {
        const processedLead = await processLead(lead);
        if (processedLead) {
          pollResults.leadsCreated++;

          if (processedLead.notificationSent) {
            pollResults.notificationsSent++;
          }

          if (processedLead.apiCost) {
            pollResults.apiCosts += processedLead.apiCost;
          }
        } else {
          pollResults.duplicatesSkipped++;
        }
      } catch (error) {
        logger.error('Failed to process lead', {
          error: error.message,
          platform: lead.platform,
          postId: lead.post_id
        });
        pollResults.errors.push({
          lead: lead.post_id,
          error: error.message
        });
      }
    }

    // Update platform results
    pollResults.platforms = {
      twitter: {
        posts: twitterLeads.length,
        leads: twitterLeads.filter(l => l.processed).length || 0
      },
      linkedin: {
        posts: linkedinLeads.length,
        leads: linkedinLeads.filter(l => l.processed).length || 0
      }
    };

    // Log results to database
    await logPollingResults(pollResults, startTime);

    // Update statistics
    pollStats.totalPolls++;
    pollStats.totalLeadsFound += pollResults.leadsCreated;
    pollStats.totalNotificationsSent += pollResults.notificationsSent;
    pollStats.totalApiCost += pollResults.apiCosts;
    lastPollTime = new Date();

    logger.info('Polling cycle completed successfully', {
      duration: Date.now() - startTime,
      leadsCreated: pollResults.leadsCreated,
      notificationsSent: pollResults.notificationsSent,
      duplicatesSkipped: pollResults.duplicatesSkipped
    });

    return pollResults;
  } catch (error) {
    logger.error('Critical error during polling cycle', {
      error: error.message,
      stack: error.stack
    });
    pollResults.errors.push({
      type: 'critical',
      error: error.message
    });
    throw error;
  } finally {
    isPolling = false;
  }
}

/**
 * Fetch active keywords from database
 */
async function fetchActiveKeywords() {
  try {
    const db = getDatabase();
    const { data: keywords, error } = await db
      .from('keywords')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // If no keywords exist, create defaults
    if (!keywords || keywords.length === 0) {
      logger.info('No keywords found, creating defaults');
      return await createDefaultKeywords();
    }

    return keywords;
  } catch (error) {
    logger.error('Failed to fetch keywords', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Create default keywords if none exist
 */
async function createDefaultKeywords() {
  const db = getDatabase();
  const defaultKeywords = [
    { platform: 'twitter', keyword: 'looking for developer', is_active: true },
    { platform: 'twitter', keyword: 'need freelance developer', is_active: true },
    { platform: 'twitter', keyword: 'hiring web developer', is_active: true },
    { platform: 'twitter', keyword: 'website project budget', is_active: true },
    { platform: 'linkedin', keyword: 'webdevelopment', is_active: true },
    { platform: 'linkedin', keyword: 'freelance', is_active: true }
  ];

  try {
    const { data: created, error } = await db
      .from('keywords')
      .insert(defaultKeywords)
      .select();

    if (error) {
      throw error;
    }

    logger.info('Default keywords created', {
      count: created.length
    });

    return created;
  } catch (error) {
    logger.error('Failed to create default keywords', {
      error: error.message
    });
    return [];
  }
}

/**
 * Poll Twitter with error handling
 */
async function pollTwitterSafely(keywords) {
  try {
    if (!config.polling.platforms.includes('twitter')) {
      logger.debug('Twitter polling disabled');
      return [];
    }

    return await pollTwitter(keywords);
  } catch (error) {
    logger.error('Twitter polling failed', {
      error: error.message
    });
    return [];
  }
}

/**
 * Poll LinkedIn with error handling
 */
async function pollLinkedInSafely(keywords) {
  try {
    if (!config.polling.platforms.includes('linkedin')) {
      logger.debug('LinkedIn polling disabled');
      return [];
    }

    return await pollLinkedIn(keywords);
  } catch (error) {
    logger.error('LinkedIn polling failed', {
      error: error.message
    });
    return [];
  }
}

/**
 * Process a single lead through the pipeline
 */
async function processLead(lead) {
  const db = getDatabase();

  // Step 1: Check for duplicates
  const duplicate = await checkDuplicate(lead);
  if (duplicate) {
    logger.debug('Duplicate lead detected, skipping', {
      leadId: lead.post_id,
      duplicateId: duplicate.id
    });
    return null;
  }

  // Step 2: Score the lead
  const scoringResult = await scoreLead(lead);

  // Step 3: Save to database
  const leadData = {
    ...lead,
    quick_score: scoringResult.quickScore,
    quick_score_breakdown: scoringResult.quickScoreBreakdown,
    ai_score: scoringResult.aiScore,
    ai_analysis: scoringResult.aiAnalysis,
    final_score: scoringResult.finalScore,
    status: 'new',
    created_at: new Date().toISOString()
  };

  const { data: savedLead, error: saveError } = await db
    .from('leads')
    .insert(leadData)
    .select()
    .single();

  if (saveError) {
    logger.error('Failed to save lead', {
      error: saveError.message,
      platform: lead.platform
    });
    throw saveError;
  }

  logger.info('Lead saved to database', {
    leadId: savedLead.id,
    platform: savedLead.platform,
    finalScore: savedLead.final_score
  });

  // Step 4: Send notification if score is high enough
  let notificationSent = false;
  if (scoringResult.shouldNotify) {
    try {
      await sendLeadAlert(savedLead);
      notificationSent = true;

      // Emit new lead via WebSocket for real-time updates
      websocketService.notifyNewLead(savedLead);
    } catch (notifyError) {
      logger.error('Failed to send notification', {
        error: notifyError.message,
        leadId: savedLead.id
      });
    }
  } else if (savedLead.final_score >= 5) {
    // Still emit via WebSocket for medium-score leads (but no Telegram)
    websocketService.notifyNewLead(savedLead);
  }

  // Step 5: Update keyword statistics
  if (lead.keyword_id) {
    await updateKeywordStats(lead.keyword_id, savedLead.final_score);
  }

  return {
    lead: savedLead,
    notificationSent,
    apiCost: scoringResult.aiAnalysis?.cost || 0,
    processed: true
  };
}

/**
 * Update keyword performance statistics
 */
async function updateKeywordStats(keywordId, score) {
  try {
    const db = getDatabase();

    // Get current stats
    const { data: keyword } = await db
      .from('keywords')
      .select('search_count, leads_found, avg_lead_score')
      .eq('id', keywordId)
      .single();

    if (keyword) {
      // Calculate new average
      const totalScore = (keyword.avg_lead_score || 0) * (keyword.leads_found || 0) + score;
      const newLeadsFound = (keyword.leads_found || 0) + 1;
      const newAvgScore = totalScore / newLeadsFound;

      // Update stats
      await db.from('keywords').update({
        search_count: (keyword.search_count || 0) + 1,
        leads_found: newLeadsFound,
        avg_lead_score: Math.round(newAvgScore * 10) / 10,
        last_searched_at: new Date().toISOString()
      }).eq('id', keywordId);
    }
  } catch (error) {
    logger.error('Failed to update keyword stats', {
      error: error.message,
      keywordId
    });
    // Don't throw - this is not critical
  }
}

/**
 * Log polling results to database
 */
async function logPollingResults(results, startTime) {
  try {
    const db = getDatabase();
    const executionTime = Date.now() - startTime;

    await db.from('polling_logs').insert({
      platform: 'all',
      execution_time: executionTime,
      posts_fetched: results.totalPosts,
      leads_created: results.leadsCreated,
      api_costs: results.apiCosts,
      metadata: {
        platforms: results.platforms,
        duplicatesSkipped: results.duplicatesSkipped,
        notificationsSent: results.notificationsSent,
        errors: results.errors.length,
        errorDetails: results.errors
      },
      created_at: new Date().toISOString()
    });

    logger.debug('Polling results logged to database');
  } catch (error) {
    logger.error('Failed to log polling results', {
      error: error.message
    });
    // Don't throw - logging is not critical
  }
}

/**
 * Get polling statistics
 */
function getPollingStats() {
  return {
    ...pollStats,
    lastPollTime,
    isPolling,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  };
}

/**
 * Reset polling statistics (for testing)
 */
function resetPollingStats() {
  pollStats = {
    totalPolls: 0,
    totalLeadsFound: 0,
    totalNotificationsSent: 0,
    totalApiCost: 0
  };
  lastPollTime = null;
  logger.info('Polling statistics reset');
}

export {
  pollAllPlatforms,
  getPollingStats,
  resetPollingStats,
  fetchActiveKeywords,
  processLead
};

export default {
  pollAllPlatforms,
  getPollingStats,
  resetPollingStats
};