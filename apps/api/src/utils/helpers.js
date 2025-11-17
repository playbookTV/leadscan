/**
 * Helper utility functions for the Lead Finder application
 */

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get human-readable time difference
 * @param {Date|string} date - Date to compare
 * @returns {string} Human-readable time difference
 */
export function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return count === 1
        ? `${count} ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return 'just now';
}

/**
 * Extract budget amounts from text
 * @param {string} text - Text to parse
 * @returns {Object} Budget information
 */
export function extractBudget(text) {
  if (!text) return null;

  const result = {
    amount: null,
    currency: 'USD',
    type: null, // fixed, hourly, monthly
    raw: null
  };

  // Match various budget formats
  const patterns = [
    // $5000, $5k, $5K
    /\$\s?(\d+(?:,\d{3})*(?:\.\d+)?)\s?([kKmM])?/,
    // 5000 USD, 5k EUR
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s?([kKmM])?\s*(USD|usd|EUR|eur|GBP|gbp|CAD|cad)/i,
    // hourly: $50/hr, $50 per hour
    /\$\s?(\d+(?:\.\d+)?)\s?(?:\/|\s?per\s?)(?:hr|hour)/i,
    // monthly: $5000/month
    /\$\s?(\d+(?:,\d{3})*(?:\.\d+)?)\s?(?:\/|\s?per\s?)(?:month|mo)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      const multiplier = match[2];
      const currency = match[3];

      // Apply multiplier (k = 1000, m = 1000000)
      if (multiplier) {
        if (multiplier.toLowerCase() === 'k') amount *= 1000;
        if (multiplier.toLowerCase() === 'm') amount *= 1000000;
      }

      result.amount = amount;
      result.raw = match[0];

      // Detect type
      if (pattern.source.includes('hour')) {
        result.type = 'hourly';
      } else if (pattern.source.includes('month')) {
        result.type = 'monthly';
      } else {
        result.type = 'fixed';
      }

      // Set currency if specified
      if (currency) {
        result.currency = currency.toUpperCase();
      }

      break;
    }
  }

  return result.amount ? result : null;
}

/**
 * Extract mentioned technologies from text
 * @param {string} text - Text to parse
 * @returns {Array} Array of detected technologies
 */
export function extractTechnologies(text) {
  if (!text) return [];

  const technologies = [];
  const techPatterns = [
    // Languages
    { name: 'JavaScript', patterns: [/javascript/i, /\bjs\b/i] },
    { name: 'TypeScript', patterns: [/typescript/i, /\bts\b/i] },
    { name: 'Python', patterns: [/python/i, /\bpy\b/i] },
    { name: 'Java', patterns: [/\bjava\b/i] },
    { name: 'PHP', patterns: [/\bphp\b/i] },
    { name: 'Ruby', patterns: [/\bruby\b/i] },
    { name: 'Go', patterns: [/\bgolang\b/i, /\bgo\b/i] },
    { name: 'C#', patterns: [/\bc#\b/i, /\bcsharp\b/i] },

    // Frontend Frameworks
    { name: 'React', patterns: [/react(?:\.?js)?/i] },
    { name: 'Vue', patterns: [/vue(?:\.?js)?/i] },
    { name: 'Angular', patterns: [/angular/i] },
    { name: 'Next.js', patterns: [/next\.?js/i] },
    { name: 'Nuxt', patterns: [/nuxt/i] },
    { name: 'Svelte', patterns: [/svelte/i] },

    // Backend
    { name: 'Node.js', patterns: [/node(?:\.?js)?/i] },
    { name: 'Express', patterns: [/express/i] },
    { name: 'Django', patterns: [/django/i] },
    { name: 'Flask', patterns: [/flask/i] },
    { name: 'Rails', patterns: [/rails/i, /ruby on rails/i] },
    { name: 'Laravel', patterns: [/laravel/i] },
    { name: 'Spring', patterns: [/spring/i] },

    // Databases
    { name: 'MongoDB', patterns: [/mongodb/i, /mongo/i] },
    { name: 'PostgreSQL', patterns: [/postgres/i, /postgresql/i] },
    { name: 'MySQL', patterns: [/mysql/i] },
    { name: 'Redis', patterns: [/redis/i] },
    { name: 'Firebase', patterns: [/firebase/i] },
    { name: 'Supabase', patterns: [/supabase/i] },

    // Cloud/DevOps
    { name: 'AWS', patterns: [/\baws\b/i, /amazon web services/i] },
    { name: 'Docker', patterns: [/docker/i] },
    { name: 'Kubernetes', patterns: [/kubernetes/i, /\bk8s\b/i] },
    { name: 'Azure', patterns: [/azure/i] },
    { name: 'GCP', patterns: [/\bgcp\b/i, /google cloud/i] },

    // CMS/Platforms
    { name: 'WordPress', patterns: [/wordpress/i] },
    { name: 'Shopify', patterns: [/shopify/i] },
    { name: 'Webflow', patterns: [/webflow/i] },
    { name: 'Wix', patterns: [/\bwix\b/i] },
    { name: 'Squarespace', patterns: [/squarespace/i] },

    // Mobile
    { name: 'React Native', patterns: [/react native/i] },
    { name: 'Flutter', patterns: [/flutter/i] },
    { name: 'Swift', patterns: [/\bswift\b/i] },
    { name: 'Kotlin', patterns: [/kotlin/i] },
    { name: 'iOS', patterns: [/\bios\b/i, /iphone/i, /ipad/i] },
    { name: 'Android', patterns: [/android/i] }
  ];

  const detectedTech = new Set();

  for (const tech of techPatterns) {
    for (const pattern of tech.patterns) {
      if (pattern.test(text)) {
        detectedTech.add(tech.name);
        break;
      }
    }
  }

  return Array.from(detectedTech);
}

/**
 * Calculate engagement rate
 * @param {Object} metrics - Post metrics object
 * @returns {number} Engagement rate percentage
 */
export function calculateEngagementRate(metrics) {
  if (!metrics) return 0;

  const totalEngagement =
    (metrics.likes || metrics.like_count || 0) +
    (metrics.retweets || metrics.retweet_count || 0) * 2 +
    (metrics.replies || metrics.reply_count || 0) * 3 +
    (metrics.shares || metrics.share_count || 0) * 2;

  const reach = metrics.impressions || metrics.views || metrics.followers || 1;

  return Math.round((totalEngagement / reach) * 10000) / 100; // Percentage with 2 decimals
}

/**
 * Promise-based delay function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i === maxRetries - 1) {
        throw lastError;
      }

      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
}

/**
 * Sanitize text for logging (remove sensitive data)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeForLogging(text) {
  if (!text) return text;

  // Remove email addresses
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // Remove phone numbers
  text = text.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE]');

  // Remove API keys (common patterns)
  text = text.replace(/([a-zA-Z0-9_-]{20,})/g, (match) => {
    // Only replace if it looks like an API key
    if (match.includes('_') || match.includes('-')) {
      return '[API_KEY]';
    }
    return match;
  });

  // Remove tokens (Bearer tokens, etc.)
  text = text.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [TOKEN]');

  return text;
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('en-US');
}

/**
 * Parse boolean environment variable
 * @param {string} value - Environment variable value
 * @param {boolean} defaultValue - Default value if parsing fails
 * @returns {boolean} Parsed boolean
 */
export function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;

  const trueValues = ['true', '1', 'yes', 'on'];
  return trueValues.includes(value.toLowerCase());
}

/**
 * Check if a URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique ID (simple version)
 * @returns {string} Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default {
  truncate,
  getTimeAgo,
  extractBudget,
  extractTechnologies,
  calculateEngagementRate,
  sleep,
  retryWithBackoff,
  sanitizeForLogging,
  formatNumber,
  parseBoolean,
  isValidUrl,
  generateId
};