import logger from '../utils/logger.js';
import supabase from '../config/database.js';
import config from '../config/env.js';

/**
 * Keyword Optimizer Service
 * Implements intelligent keyword selection and rotation to optimize Twitter API usage
 */

// In-memory state for keyword rotation
let rotationState = {
  lastRotationIndex: 0,
  lastRotationTime: null
};

/**
 * Get optimized keyword list for polling cycle
 * Implements multiple strategies to reduce API calls:
 * 1. Prioritization based on performance metrics
 * 2. Rotation to distribute searches over time
 * 3. Configurable limits per cycle
 *
 * @param {Array} allKeywords - All active keywords from database
 * @param {string} platform - Platform to filter for (twitter, reddit, etc)
 * @returns {Array} Optimized subset of keywords to search
 */
export async function getOptimizedKeywords(allKeywords, platform = 'twitter') {
  try {
    // Filter for platform-specific and active keywords
    const platformKeywords = allKeywords.filter(k =>
      k.is_active && (!k.platform || k.platform === platform)
    );

    if (platformKeywords.length === 0) {
      logger.warn('No active keywords found for platform', { platform });
      return [];
    }

    logger.info('Processing keywords for optimization', {
      total: platformKeywords.length,
      platform
    });

    // Get configuration for keyword limits
    const maxKeywordsPerCycle = getEnvInt('TWITTER_MAX_KEYWORDS_PER_CYCLE', 20);
    const enableRotation = getEnv('TWITTER_ENABLE_KEYWORD_ROTATION', 'true') === 'true';
    const enablePrioritization = getEnv('TWITTER_ENABLE_KEYWORD_PRIORITIZATION', 'true') === 'true';

    let optimizedKeywords = [...platformKeywords];

    // Step 1: Prioritize by performance if enabled
    if (enablePrioritization) {
      optimizedKeywords = prioritizeKeywords(optimizedKeywords);
      logger.debug('Keywords prioritized', {
        strategy: 'performance-based',
        topKeyword: optimizedKeywords[0]?.keyword
      });
    }

    // Step 2: Apply rotation if enabled
    if (enableRotation && optimizedKeywords.length > maxKeywordsPerCycle) {
      optimizedKeywords = rotateKeywords(optimizedKeywords, maxKeywordsPerCycle);
      logger.debug('Keyword rotation applied', {
        selected: optimizedKeywords.length,
        rotationIndex: rotationState.lastRotationIndex
      });
    } else {
      // Just limit to max keywords
      optimizedKeywords = optimizedKeywords.slice(0, maxKeywordsPerCycle);
    }

    logger.info('Keyword optimization complete', {
      original: platformKeywords.length,
      optimized: optimizedKeywords.length,
      reduction: `${Math.round((1 - optimizedKeywords.length / platformKeywords.length) * 100)}%`,
      keywords: optimizedKeywords.map(k => k.keyword)
    });

    return optimizedKeywords;
  } catch (error) {
    logger.error('Error optimizing keywords', { error: error.message });
    // Fallback: return first 10 keywords
    return allKeywords.slice(0, 10);
  }
}

/**
 * Prioritize keywords based on performance metrics
 * Scoring algorithm:
 * - Conversion rate (weight: 40%)
 * - High-score leads ratio (weight: 30%)
 * - Recent activity (weight: 20%)
 * - Total leads found (weight: 10%)
 */
function prioritizeKeywords(keywords) {
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const scored = keywords.map(keyword => {
    let score = 0;

    // Conversion rate (0-40 points)
    const conversionRate = keyword.conversion_rate || 0;
    score += conversionRate * 40;

    // High-score leads ratio (0-30 points)
    if (keyword.leads_found > 0) {
      const highScoreRatio = (keyword.high_score_leads || 0) / keyword.leads_found;
      score += highScoreRatio * 30;
    }

    // Recent activity (0-20 points)
    if (keyword.last_lead_found_at) {
      const daysSinceLastLead = (now - new Date(keyword.last_lead_found_at).getTime()) / (24 * 60 * 60 * 1000);
      const recencyScore = Math.max(0, 20 - (daysSinceLastLead / 30) * 20);
      score += recencyScore;
    }

    // Total leads found (0-10 points) - normalized by log scale
    const leadsFound = keyword.leads_found || 0;
    if (leadsFound > 0) {
      score += Math.min(10, Math.log10(leadsFound + 1) * 3);
    }

    // Boost never-used keywords slightly to give them a chance
    if (!keyword.last_used_at || keyword.times_used === 0) {
      score += 5; // Small boost for new keywords
    }

    return {
      ...keyword,
      priority_score: Math.round(score * 100) / 100
    };
  });

  // Sort by priority score (highest first)
  scored.sort((a, b) => b.priority_score - a.priority_score);

  logger.debug('Top 5 keywords by priority', {
    keywords: scored.slice(0, 5).map(k => ({
      keyword: k.keyword,
      score: k.priority_score,
      conversionRate: k.conversion_rate,
      leadsFound: k.leads_found
    }))
  });

  return scored;
}

/**
 * Rotate keywords to distribute searches over time
 * Uses round-robin approach to ensure all keywords get searched eventually
 */
function rotateKeywords(keywords, limit) {
  const totalKeywords = keywords.length;

  // Calculate rotation parameters
  const startIndex = rotationState.lastRotationIndex % totalKeywords;
  const endIndex = (startIndex + limit) % totalKeywords;

  let selected;
  if (endIndex > startIndex) {
    // Simple case: no wrap-around
    selected = keywords.slice(startIndex, endIndex);
  } else {
    // Wrap-around case
    selected = [
      ...keywords.slice(startIndex),
      ...keywords.slice(0, endIndex)
    ];
  }

  // Update rotation state
  rotationState.lastRotationIndex = endIndex;
  rotationState.lastRotationTime = new Date();

  logger.debug('Keyword rotation state', {
    startIndex,
    endIndex,
    selected: selected.length,
    nextStartIndex: endIndex
  });

  return selected;
}

/**
 * Batch keywords into combined search queries using OR operators
 * Reduces API calls by combining related keywords
 *
 * @param {Array} keywords - Keywords to batch
 * @param {number} maxPerBatch - Maximum keywords per batch (default: 3)
 * @returns {Array} Array of batched query objects
 */
export function batchKeywords(keywords, maxPerBatch = 3) {
  const batches = [];

  // Group keywords by category for better relevance
  const byCategory = keywords.reduce((acc, keyword) => {
    const category = keyword.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(keyword);
    return acc;
  }, {});

  // Create batches within each category
  Object.entries(byCategory).forEach(([category, categoryKeywords]) => {
    for (let i = 0; i < categoryKeywords.length; i += maxPerBatch) {
      const batch = categoryKeywords.slice(i, i + maxPerBatch);

      // Only batch if we have multiple keywords
      if (batch.length > 1) {
        batches.push({
          query: batch.map(k => `"${k.keyword}"`).join(' OR '),
          keywords: batch,
          category,
          isBatched: true
        });
      } else {
        // Single keyword, no batching needed
        batches.push({
          query: batch[0].keyword,
          keywords: batch,
          category,
          isBatched: false
        });
      }
    }
  });

  logger.info('Keyword batching complete', {
    original: keywords.length,
    batches: batches.length,
    reduction: `${Math.round((1 - batches.length / keywords.length) * 100)}%`,
    batchedQueries: batches.filter(b => b.isBatched).length
  });

  return batches;
}

/**
 * Check if we're approaching Twitter rate limits
 * Returns recommendation on whether to continue polling
 */
export async function shouldContinuePolling(apiCallsUsed, remainingCalls) {
  const threshold = getEnvInt('TWITTER_RATE_LIMIT_THRESHOLD', 50);

  if (remainingCalls <= threshold) {
    logger.warn('Approaching Twitter rate limit', {
      remaining: remainingCalls,
      threshold,
      used: apiCallsUsed
    });
    return false;
  }

  return true;
}

/**
 * Update keyword performance metrics in database
 * Called after each polling cycle to track keyword effectiveness
 */
export async function updateKeywordMetrics(keywordId, metrics) {
  try {
    const updates = {
      times_used: metrics.timesUsed,
      last_used_at: new Date().toISOString()
    };

    if (metrics.leadsFound !== undefined) {
      updates.leads_found = metrics.leadsFound;
    }

    if (metrics.highScoreLeads !== undefined) {
      updates.high_score_leads = metrics.highScoreLeads;
    }

    const { error } = await supabase
      .from('keywords')
      .update(updates)
      .eq('id', keywordId);

    if (error) {
      logger.error('Failed to update keyword metrics', {
        error: error.message,
        keywordId
      });
    }
  } catch (error) {
    logger.error('Error updating keyword metrics', {
      error: error.message,
      keywordId
    });
  }
}

/**
 * Reset rotation state (useful for testing or manual resets)
 */
export function resetRotationState() {
  rotationState = {
    lastRotationIndex: 0,
    lastRotationTime: null
  };
  logger.info('Keyword rotation state reset');
}

/**
 * Get current rotation state (for monitoring)
 */
export function getRotationState() {
  return { ...rotationState };
}

// Helper functions
function getEnv(key, defaultValue) {
  return process.env[key] || defaultValue;
}

function getEnvInt(key, defaultValue) {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export default {
  getOptimizedKeywords,
  batchKeywords,
  shouldContinuePolling,
  updateKeywordMetrics,
  resetRotationState,
  getRotationState
};
