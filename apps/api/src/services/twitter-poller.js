import config from '../config/env.js';
import logger from '../utils/logger.js';
import { getTwitterClient, withRateLimitRetry } from '../config/twitter.js';
import { getOptimizedKeywords, batchKeywords, shouldContinuePolling } from './keyword-optimizer.js';

/**
 * Poll Twitter for new posts matching keywords
 * @param {Array} keywords - Array of keyword objects from database
 * @returns {Array} Array of lead objects
 */
async function pollTwitter(keywords) {
  const client = getTwitterClient();
  if (!client) {
    logger.warn('Twitter client not available, skipping Twitter polling');
    return [];
  }

  const leads = [];
  const sinceTime = new Date(Date.now() - config.polling.intervalMinutes * 60 * 1000);

  // OPTIMIZATION: Get optimized keyword list
  const optimizedKeywords = await getOptimizedKeywords(keywords, 'twitter');

  if (optimizedKeywords.length === 0) {
    logger.warn('No keywords selected after optimization');
    return [];
  }

  logger.info('Starting Twitter polling with optimized keywords', {
    originalCount: keywords.length,
    optimizedCount: optimizedKeywords.length,
    reduction: `${Math.round((1 - optimizedKeywords.length / keywords.length) * 100)}%`
  });

  // OPTIMIZATION: Check if batching is enabled
  const enableBatching = process.env.TWITTER_ENABLE_BATCHING === 'true';
  const batches = enableBatching
    ? batchKeywords(optimizedKeywords, 3)
    : optimizedKeywords.map(k => ({ query: k.keyword, keywords: [k], isBatched: false }));

  logger.info('Query batching applied', {
    keywords: optimizedKeywords.length,
    queries: batches.length,
    batchingEnabled: enableBatching
  });

  let apiCallsUsed = 0;
  let rateLimitRemaining = null;

  for (const batch of batches) {
    try {
      // OPTIMIZATION: Check rate limits before continuing
      if (rateLimitRemaining !== null && !await shouldContinuePolling(apiCallsUsed, rateLimitRemaining)) {
        logger.warn('Stopping polling due to rate limit threshold', {
          apiCallsUsed,
          remaining: rateLimitRemaining
        });
        break;
      }

      const searchResults = await searchTweets(client, batch.query, sinceTime);
      apiCallsUsed++;

      // Track rate limit from response
      if (searchResults.rateLimit) {
        rateLimitRemaining = searchResults.rateLimit.remaining;
      }

      // Process results for all keywords in the batch
      for (const keyword of batch.keywords) {
        const processedLeads = processTwitterResults(searchResults.tweets || searchResults, keyword);
        leads.push(...processedLeads);

        logger.info('Twitter search completed', {
          query: batch.isBatched ? `${batch.keywords.length} keywords batched` : keyword.keyword,
          keyword: keyword.keyword,
          resultsCount: searchResults.tweets?.length || searchResults.length,
          leadsCreated: processedLeads.length
        });
      }
    } catch (error) {
      logger.error('Failed to search Twitter', {
        error: error.message,
        query: batch.query,
        keywords: batch.keywords.map(k => k.keyword)
      });
      // Continue with other batches
    }
  }

  logger.info('Twitter polling completed', {
    keywordsSearched: optimizedKeywords.length,
    queriesExecuted: apiCallsUsed,
    totalLeads: leads.length,
    rateLimitRemaining
  });

  return leads;
}

/**
 * Search Twitter for tweets matching a keyword
 * @param {Object} client - Twitter API client
 * @param {string} keyword - Search keyword
 * @param {Date} sinceTime - Only get tweets after this time
 */
async function searchTweets(client, keyword, sinceTime) {
  try {
    // Build search query with filters
    const query = buildSearchQuery(keyword);

    logger.debug('Searching Twitter', {
      query: query,
      sinceTime: sinceTime.toISOString()
    });

    // Use rate limit retry wrapper
    const { tweets, rateLimit } = await withRateLimitRetry(async () => {
      const response = await client.v2.search(query, {
        'start_time': sinceTime.toISOString(),
        'max_results': 100, // Maximum allowed per request
        'tweet.fields': [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'conversation_id',
          'lang',
          'entities'
        ],
        'user.fields': [
          'id',
          'name',
          'username',
          'description',
          'profile_image_url',
          'public_metrics',
          'verified'
        ],
        'expansions': ['author_id']
      });

      // Collect all results (handles pagination internally)
      const tweets = [];
      const users = new Map();

      // Store user data for easy lookup
      if (response.includes?.users) {
        for (const user of response.includes.users) {
          users.set(user.id, user);
        }
      }

      // Process tweets
      if (response.data) {
        for (const tweet of response.data) {
          tweets.push({
            ...tweet,
            author: users.get(tweet.author_id)
          });
        }
      }

      return {
        tweets,
        rateLimit: response.rateLimit ? {
          limit: response.rateLimit.limit,
          remaining: response.rateLimit.remaining,
          reset: new Date(response.rateLimit.reset * 1000)
        } : null
      };
    });

    logger.debug('Twitter search completed', {
      keyword: keyword,
      resultsCount: tweets.length,
      rateLimit: rateLimit ? `${rateLimit.remaining}/${rateLimit.limit}` : 'unknown'
    });

    return { tweets, rateLimit };
  } catch (error) {
    logger.error('Twitter search failed', {
      error: error.message,
      keyword: keyword
    });
    throw error;
  }
}

/**
 * Build Twitter search query with appropriate filters
 * @param {string} keyword - Base search keyword
 */
function buildSearchQuery(keyword) {
  // Add filters to improve result quality
  const filters = [
    '-is:retweet',        // Exclude retweets
    '-is:reply',          // Exclude replies
    'lang:en',            // English only
    '-from:bot',          // Try to exclude obvious bots
    'has:links OR -has:media' // Either has links or no media (avoid memes)
  ];

  // Keywords that indicate a project/job posting
  const projectIndicators = [
    'looking for',
    'need',
    'hiring',
    'developer',
    'designer',
    'freelancer',
    'project',
    'website',
    'app'
  ];

  // Build the query
  let query = keyword;

  // Add project indicators if the keyword is generic
  if (!keyword.includes('hiring') && !keyword.includes('looking for') && !keyword.includes('need')) {
    query = `"${keyword}" (${projectIndicators.map(ind => `"${ind}"`).join(' OR ')})`;
  }

  // Add filters
  query += ' ' + filters.join(' ');

  return query;
}

/**
 * Process Twitter search results into lead objects
 * @param {Array} tweets - Raw tweet objects from API
 * @param {Object} keyword - Keyword object that found these tweets
 */
function processTwitterResults(tweets, keyword) {
  const leads = [];

  for (const tweet of tweets) {
    try {
      // Skip if no author data
      if (!tweet.author) {
        logger.debug('Skipping tweet without author data', { tweetId: tweet.id });
        continue;
      }

      // Calculate engagement rate
      const engagementRate = calculateEngagementRate(
        tweet.public_metrics,
        tweet.author.public_metrics
      );

      // Build post URL
      const postUrl = `https://twitter.com/${tweet.author.username}/status/${tweet.id}`;
      const profileUrl = `https://twitter.com/${tweet.author.username}`;

      // Create lead object
      const lead = {
        platform: 'twitter',
        post_id: tweet.id,
        post_text: tweet.text,
        post_url: postUrl,
        author_username: tweet.author.username,
        author_name: tweet.author.name,
        author_profile_url: profileUrl,
        author_avatar_url: tweet.author.profile_image_url,
        author_bio: tweet.author.description,
        author_followers: tweet.author.public_metrics?.followers_count || 0,
        engagement_rate: engagementRate,
        posted_at: new Date(tweet.created_at),
        keyword_id: keyword.id,
        metadata: {
          tweet_metrics: tweet.public_metrics,
          author_metrics: tweet.author.public_metrics,
          author_verified: tweet.author.verified || false,
          conversation_id: tweet.conversation_id,
          entities: tweet.entities
        }
      };

      leads.push(lead);
    } catch (error) {
      logger.error('Failed to process tweet', {
        error: error.message,
        tweetId: tweet.id
      });
      // Continue with other tweets
    }
  }

  return leads;
}

/**
 * Calculate engagement rate for a post
 * @param {Object} postMetrics - Post public metrics
 * @param {Object} authorMetrics - Author public metrics
 */
function calculateEngagementRate(postMetrics, authorMetrics) {
  if (!postMetrics || !authorMetrics || !authorMetrics.followers_count) {
    return 0;
  }

  const totalEngagement =
    (postMetrics.like_count || 0) +
    (postMetrics.retweet_count || 0) * 2 + // Retweets weighted higher
    (postMetrics.reply_count || 0) * 3 +   // Replies weighted highest
    (postMetrics.quote_count || 0) * 2;

  const rate = (totalEngagement / authorMetrics.followers_count) * 100;
  return Math.round(rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Get rate limit status for Twitter API
 */
async function getTwitterRateLimitStatus() {
  const client = getTwitterClient();
  if (!client) {
    return null;
  }

  try {
    const limits = await client.v2.getRateLimitStatus('tweets/search/recent');
    return {
      limit: limits.limit,
      remaining: limits.remaining,
      reset: new Date(limits.reset * 1000),
      percentRemaining: Math.round((limits.remaining / limits.limit) * 100)
    };
  } catch (error) {
    logger.error('Failed to get Twitter rate limit status', {
      error: error.message
    });
    return null;
  }
}

export {
  pollTwitter,
  searchTweets,
  buildSearchQuery,
  processTwitterResults,
  calculateEngagementRate,
  getTwitterRateLimitStatus
};

export default {
  pollTwitter,
  getTwitterRateLimitStatus
};