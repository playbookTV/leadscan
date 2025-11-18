import config from '../config/env.js';
import logger from '../utils/logger.js';
import { getRedditClient } from '../config/reddit.js';

// Target subreddits for lead generation
const DEFAULT_SUBREDDITS = [
  'forhire',
  'freelance',
  'slavelabour',
  'webdev',
  'Entrepreneur',
  'startups',
  'Jobs4Bitcoins',
  'hiring'
];

/**
 * Poll Reddit for new posts matching keywords
 * @param {Array} keywords - Array of keyword objects from database
 * @returns {Array} Array of lead objects
 */
async function pollReddit(keywords) {
  const client = getRedditClient();
  if (!client) {
    logger.warn('Reddit client not available, skipping Reddit polling');
    return [];
  }

  const leads = [];
  const sinceTime = new Date(Date.now() - config.polling.intervalMinutes * 60 * 1000);

  for (const keyword of keywords) {
    // Skip inactive keywords or keywords explicitly set to a different platform
    // NULL platform means "all platforms", so those should be included
    if (!keyword.is_active || (keyword.platform && keyword.platform !== 'reddit')) {
      continue;
    }

    for (const subreddit of DEFAULT_SUBREDDITS) {
      try {
        const searchResults = await searchSubreddit(client, subreddit, keyword.keyword, sinceTime);
        const processedLeads = processRedditResults(searchResults, keyword, subreddit);
        leads.push(...processedLeads);

        logger.debug('Reddit search completed', {
          keyword: keyword.keyword,
          subreddit: subreddit,
          resultsCount: searchResults.length,
          leadsCreated: processedLeads.length
        });
      } catch (error) {
        logger.error('Failed to search Reddit', {
          error: error.message,
          keyword: keyword.keyword,
          subreddit: subreddit
        });
        // Continue with other keywords/subreddits
      }
    }
  }

  logger.info('Reddit polling completed', {
    keywordsSearched: keywords.filter(k => (!k.platform || k.platform === 'reddit') && k.is_active).length,
    subredditsSearched: DEFAULT_SUBREDDITS.length,
    totalLeads: leads.length
  });

  return leads;
}

/**
 * Search a specific subreddit for posts matching keyword
 * @param {Object} client - Reddit client instance
 * @param {string} subreddit - Subreddit name
 * @param {string} keyword - Search keyword
 * @param {Date} sinceTime - Only return posts after this time
 */
async function searchSubreddit(client, subreddit, keyword, sinceTime) {
  try {
    const results = await client.getSubreddit(subreddit).search({
      query: keyword,
      time: 'day', // Last 24 hours
      sort: 'new',
      limit: 25
    });

    // Filter by timestamp
    const recentPosts = results.filter(post => {
      const postDate = new Date(post.created_utc * 1000);
      return postDate >= sinceTime;
    });

    return recentPosts;
  } catch (error) {
    logger.error('Reddit subreddit search failed', {
      error: error.message,
      subreddit: subreddit,
      keyword: keyword
    });
    return [];
  }
}

/**
 * Process Reddit search results into lead objects
 * @param {Array} results - Reddit search results
 * @param {Object} keyword - Keyword object
 * @param {string} subreddit - Subreddit name
 */
function processRedditResults(results, keyword, subreddit) {
  if (!results || results.length === 0) {
    return [];
  }

  const leads = [];

  for (const post of results) {
    try {
      // Combine title and selftext for full content
      const postText = `${post.title}\n\n${post.selftext || ''}`.trim();

      // Skip if no meaningful content
      if (postText.length < 50) {
        continue;
      }

      // Create lead object
      const lead = {
        platform: 'reddit',
        post_id: post.id,
        post_text: postText,
        post_url: `https://reddit.com${post.permalink}`,
        posted_at: new Date(post.created_utc * 1000),

        // Author information
        author_username: post.author.name,
        author_name: post.author.name,
        author_profile_url: `https://reddit.com/u/${post.author.name}`,
        author_avatar_url: null, // Not easily available
        author_bio: null, // Not in search results
        author_followers: 0, // Use karma instead
        engagement_rate: 0, // Not applicable for Reddit
        author_verified: false, // Reddit doesn't have verification

        // Engagement metrics
        likes_count: post.ups || 0,
        comments_count: post.num_comments || 0,
        shares_count: 0, // Not available

        // Keyword association
        keyword_id: keyword.id,
        source_keyword: keyword.keyword,

        // Metadata
        metadata: {
          subreddit: subreddit,
          flair: post.link_flair_text || null,
          upvote_ratio: post.upvote_ratio || 0,
          is_self: post.is_self,
          is_video: post.is_video,
          domain: post.domain
        }
      };

      leads.push(lead);
    } catch (error) {
      logger.error('Failed to process Reddit post', {
        error: error.message,
        postId: post.id
      });
      // Continue with other posts
    }
  }

  return leads;
}

/**
 * Get Reddit polling statistics
 */
function getRedditStats() {
  return {
    targetSubreddits: DEFAULT_SUBREDDITS,
    subredditCount: DEFAULT_SUBREDDITS.length,
    pollingInterval: config.polling.intervalMinutes + ' minutes'
  };
}

export {
  pollReddit,
  searchSubreddit,
  processRedditResults,
  getRedditStats
};

export default {
  pollReddit,
  getRedditStats
};
