import config from '../config/env.js';
import logger from '../utils/logger.js';
import { parseLinkedInFeed, buildLinkedInFeedUrl, getLinkedInParser } from '../config/linkedin.js';

// LinkedIn RSS feeds to monitor (since API access is limited)
const DEFAULT_FEEDS = [
  { type: 'hashtag', identifier: 'webdevelopment' },
  { type: 'hashtag', identifier: 'hiring' },
  { type: 'hashtag', identifier: 'freelance' },
  { type: 'hashtag', identifier: 'webdesign' },
  { type: 'hashtag', identifier: 'reactjs' },
  { type: 'hashtag', identifier: 'nodejs' },
  { type: 'hashtag', identifier: 'javascript' },
  { type: 'hashtag', identifier: 'developers' }
];

/**
 * Poll LinkedIn RSS feeds for new posts
 * @param {Array} keywords - Array of keyword objects from database
 * @returns {Array} Array of lead objects
 */
async function pollLinkedIn(keywords) {
  const parser = getLinkedInParser();
  if (!parser) {
    logger.warn('LinkedIn RSS parser not available, skipping LinkedIn polling');
    return [];
  }

  const leads = [];
  const sinceTime = new Date(Date.now() - config.polling.intervalMinutes * 2 * 60 * 1000); // 2 hours for LinkedIn

  // Build feed list from keywords and defaults
  const feeds = buildFeedList(keywords);

  for (const feed of feeds) {
    try {
      const feedUrl = buildLinkedInFeedUrl(feed.type, feed.identifier);
      const feedData = await parseFeed(feedUrl, feed.keyword);

      if (feedData) {
        const processedLeads = processLinkedInResults(feedData, feed, sinceTime);
        leads.push(...processedLeads);

        logger.info('LinkedIn feed processed', {
          feedType: feed.type,
          identifier: feed.identifier,
          itemsFound: feedData.items?.length || 0,
          leadsCreated: processedLeads.length
        });
      }
    } catch (error) {
      logger.error('Failed to process LinkedIn feed', {
        error: error.message,
        feedType: feed.type,
        identifier: feed.identifier
      });
      // Continue with other feeds
    }
  }

  logger.info('LinkedIn polling completed', {
    feedsProcessed: feeds.length,
    totalLeads: leads.length
  });

  return leads;
}

/**
 * Build list of feeds to poll based on keywords and defaults
 * @param {Array} keywords - Keywords from database
 */
function buildFeedList(keywords) {
  const feeds = [];

  // Add keyword-based feeds
  for (const keyword of keywords) {
    if (!keyword.is_active || keyword.platform !== 'linkedin') {
      continue;
    }

    // Try to determine if it's a company or hashtag
    if (keyword.metadata?.feedType) {
      feeds.push({
        type: keyword.metadata.feedType,
        identifier: keyword.metadata.identifier || keyword.keyword,
        keyword: keyword
      });
    } else {
      // Default to hashtag
      feeds.push({
        type: 'hashtag',
        identifier: keyword.keyword.replace('#', ''),
        keyword: keyword
      });
    }
  }

  // Add default feeds if no LinkedIn keywords configured
  if (feeds.length === 0) {
    logger.debug('No LinkedIn keywords configured, using default feeds');
    for (const defaultFeed of DEFAULT_FEEDS) {
      feeds.push({
        ...defaultFeed,
        keyword: { id: null, keyword: defaultFeed.identifier }
      });
    }
  }

  return feeds;
}

/**
 * Parse a LinkedIn RSS feed
 * @param {string} feedUrl - RSS feed URL
 * @param {Object} keyword - Associated keyword object
 */
async function parseFeed(feedUrl, keyword) {
  try {
    const feedData = await parseLinkedInFeed(feedUrl);

    logger.debug('LinkedIn RSS feed parsed', {
      feedUrl: feedUrl,
      title: feedData.title,
      itemCount: feedData.items?.length || 0
    });

    return feedData;
  } catch (error) {
    // RSS feeds might be blocked or require authentication
    if (error.message.includes('403') || error.message.includes('401')) {
      logger.debug('LinkedIn RSS feed access denied (expected for some feeds)', {
        feedUrl: feedUrl,
        error: error.message
      });
    } else {
      logger.error('Failed to parse LinkedIn RSS feed', {
        feedUrl: feedUrl,
        error: error.message
      });
    }
    return null;
  }
}

/**
 * Process LinkedIn RSS feed results into lead objects
 * @param {Object} feedData - Parsed RSS feed data
 * @param {Object} feed - Feed configuration object
 * @param {Date} sinceTime - Only process items after this time
 */
function processLinkedInResults(feedData, feed, sinceTime) {
  if (!feedData.items || feedData.items.length === 0) {
    return [];
  }

  const leads = [];

  for (const item of feedData.items) {
    try {
      // Parse post date
      const postDate = new Date(item.isoDate || item.pubDate || item.date);

      // Skip old posts
      if (postDate < sinceTime) {
        continue;
      }

      // Extract text content
      const postText = extractTextFromHtml(
        item.contentEncoded || item.content || item.description || item.summary || ''
      );

      // Skip if no meaningful content
      if (!postText || postText.length < 50) {
        continue;
      }

      // Extract author info from creator or title
      const authorInfo = extractAuthorInfo(item);

      // Create lead object
      const lead = {
        platform: 'linkedin',
        post_id: item.guid || item.link, // Use guid or link as unique identifier
        post_text: postText,
        post_url: item.link,
        author_username: authorInfo.username,
        author_name: authorInfo.name,
        author_profile_url: authorInfo.profileUrl,
        author_avatar_url: null, // Not available in RSS
        author_bio: null, // Not available in RSS
        author_followers: 0, // Not available in RSS
        engagement_rate: 0, // Not available in RSS
        posted_at: postDate,
        keyword_id: feed.keyword?.id || null,
        metadata: {
          feed_type: feed.type,
          feed_identifier: feed.identifier,
          feed_title: feedData.title,
          post_title: item.title,
          categories: item.categories || []
        }
      };

      leads.push(lead);
    } catch (error) {
      logger.error('Failed to process LinkedIn RSS item', {
        error: error.message,
        itemTitle: item.title
      });
      // Continue with other items
    }
  }

  return leads;
}

/**
 * Extract text content from HTML
 * @param {string} html - HTML content
 */
function extractTextFromHtml(html) {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Limit length
  if (text.length > 1000) {
    text = text.substring(0, 997) + '...';
  }

  return text;
}

/**
 * Extract author information from RSS item
 * @param {Object} item - RSS feed item
 */
function extractAuthorInfo(item) {
  let username = 'unknown';
  let name = 'Unknown Author';
  let profileUrl = item.link;

  // Try to extract from creator field
  if (item.creator) {
    name = item.creator;
    username = item.creator.toLowerCase().replace(/\s+/g, '');
  }

  // Try to extract from title (often contains author name)
  if (item.title && item.title.includes(' on LinkedIn')) {
    const parts = item.title.split(' on LinkedIn');
    if (parts[0]) {
      name = parts[0].trim();
      username = name.toLowerCase().replace(/\s+/g, '');
    }
  }

  // Try to extract profile URL from link
  if (item.link) {
    const match = item.link.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (match) {
      username = match[1];
      profileUrl = `https://www.linkedin.com/in/${username}`;
    }
  }

  return {
    username,
    name,
    profileUrl
  };
}

/**
 * Get LinkedIn polling statistics
 */
function getLinkedInStats() {
  return {
    defaultFeeds: DEFAULT_FEEDS.length,
    feedTypes: ['hashtag', 'company'],
    pollingInterval: config.polling.intervalMinutes * 2 + ' minutes'
  };
}

export {
  pollLinkedIn,
  buildFeedList,
  parseFeed,
  processLinkedInResults,
  extractTextFromHtml,
  extractAuthorInfo,
  getLinkedInStats
};

export default {
  pollLinkedIn,
  getLinkedInStats
};