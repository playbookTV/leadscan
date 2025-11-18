# Reddit Integration Plan

**Date**: November 18, 2025
**Project**: Leadscout - Add Reddit as Primary Lead Source

---

## Executive Summary

Add Reddit as a second primary platform alongside Twitter for automated lead generation. Reddit offers official API with search, free tier with generous rate limits, and high-intent leads from hiring-focused subreddits.

---

## Why Reddit?

### Advantages Over LinkedIn
- ✅ **Official API with search** (LinkedIn has none)
- ✅ **Free tier**: 100 requests/min per OAuth client
- ✅ **Generous limits**: 6,000 requests per hour vs Twitter's 450/15min
- ✅ **Easy integration**: Similar to Twitter implementation

### Lead Quality
- ✅ Users **explicitly looking for services** (/r/forhire, /r/freelance)
- ✅ Posts **often include budgets** (required in many subs)
- ✅ Posts **include timelines** ("need by next week")
- ✅ **Direct contact info** (Reddit DMs, email, Discord)
- ✅ **Less competition** than Twitter (fewer agencies monitoring)

### Target Subreddits
- `/r/forhire` - 500k members, active hiring posts
- `/r/freelance` - 200k members, freelance opportunities
- `/r/slavelabour` - Quick gigs, smaller budgets
- `/r/webdev` - Tech help requests
- `/r/Entrepreneur` - Business owners seeking developers
- `/r/startups` - Startup projects
- `/r/Jobs4Bitcoins` - Crypto payment jobs
- `/r/hiring` - General hiring posts
- Niche subs: `/r/reactjs`, `/r/node`, etc.

---

## Technical Specifications

### Reddit API Details

**Authentication**: OAuth 2.0
- Client ID + Client Secret
- Refresh token (long-lived)
- User-Agent required

**Rate Limits**:
- Free tier: **100 requests/minute** per OAuth client
- Averaged over 10-minute window (burst friendly)
- Our use case: ~20 searches per 30-min cycle = **well within limits**

**Search Capabilities**:
```javascript
reddit.search({
  query: 'need web developer',
  time: 'day',        // hour, day, week, month, year, all
  sort: 'new',        // relevance, hot, top, new, comments
  limit: 100,         // max results per request
  subreddit: 'forhire', // optional: specific subreddit
  restrictSr: true    // limit to specified subreddit
})
```

**Data Returned** (per post):
- Post ID (unique identifier)
- Title
- Selftext (body content)
- Author username
- Author karma
- Created timestamp
- URL
- Subreddit
- Upvotes/downvotes
- Comment count
- Flair (e.g., "Hiring", "For Hire")

### Node.js Library: snoowrap

**Package**: `snoowrap`
- GitHub stars: 1,200+
- Last updated: Active (2024)
- TypeScript support: Yes
- Auto-refreshes tokens

**Installation**:
```bash
pnpm add snoowrap
```

**Basic Setup**:
```javascript
import snoowrap from 'snoowrap';

const reddit = new snoowrap({
  userAgent: 'Leadscout/1.0 by /u/yourusername',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN
});
```

---

## Implementation Plan

### Phase 1: Setup & Configuration ⚙️

**Files to Create**:
1. `apps/api/src/config/reddit.js` - Reddit client initialization
2. `apps/api/src/services/reddit-poller.js` - Reddit polling logic

**Environment Variables** (`.env`):
```bash
# Reddit API (Required for Reddit polling)
REDDIT_CLIENT_ID=xxxxx
REDDIT_CLIENT_SECRET=xxxxx
REDDIT_REFRESH_TOKEN=xxxxx
REDDIT_USER_AGENT=Leadscout/1.0 by /u/yourusername
```

**Configuration** (`apps/api/src/config/env.js`):
```javascript
reddit: {
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  userAgent: process.env.REDDIT_USER_AGENT || 'Leadscout/1.0'
}
```

### Phase 2: Reddit Client (`apps/api/src/config/reddit.js`)

```javascript
import snoowrap from 'snoowrap';
import config from './env.js';
import logger from '../utils/logger.js';

let redditClient = null;

/**
 * Initialize Reddit API client
 * Uses OAuth 2.0 with refresh token
 */
function initializeRedditClient() {
  try {
    if (!config.reddit.clientId || !config.reddit.clientSecret) {
      logger.warn('Reddit credentials not configured, Reddit polling disabled');
      return null;
    }

    redditClient = new snoowrap({
      userAgent: config.reddit.userAgent,
      clientId: config.reddit.clientId,
      clientSecret: config.reddit.clientSecret,
      refreshToken: config.reddit.refreshToken
    });

    // Configure request delay to respect rate limits
    redditClient.config({
      requestDelay: 1000, // 1 second between requests
      continueAfterRatelimitError: true,
      warnings: true,
      debug: config.nodeEnv === 'development'
    });

    logger.info('Reddit API client initialized successfully');
    return redditClient;
  } catch (error) {
    logger.error('Failed to initialize Reddit client', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Test Reddit API connection
 */
async function testRedditConnection() {
  try {
    if (!redditClient) {
      logger.warn('Reddit client not initialized');
      return false;
    }

    // Test with simple API call
    const me = await redditClient.getMe();

    logger.info('Reddit API connection test successful', {
      username: me.name,
      karma: me.link_karma + me.comment_karma
    });

    return true;
  } catch (error) {
    logger.error('Reddit API connection test failed', {
      error: error.message
    });
    return false;
  }
}

/**
 * Get Reddit client instance
 */
function getRedditClient() {
  return redditClient;
}

export {
  initializeRedditClient,
  testRedditConnection,
  getRedditClient
};
```

### Phase 3: Reddit Poller (`apps/api/src/services/reddit-poller.js`)

**Target Subreddits** (configurable):
```javascript
const DEFAULT_SUBREDDITS = [
  'forhire',
  'freelance',
  'slavelabour',
  'webdev',
  'Entrepreneur',
  'startups',
  'Jobs4Bitcoins'
];
```

**Search Strategy**:
1. For each active keyword:
   - Search across target subreddits
   - Filter by time: last 30 minutes
   - Sort by: new (chronological)
   - Limit: 25 results per keyword/subreddit

2. Process results:
   - Extract post data (title, body, author)
   - Map to Lead object format
   - Same deduplication as Twitter
   - Same scoring algorithm

**Code Structure**:
```javascript
async function pollReddit(keywords) {
  const client = getRedditClient();
  if (!client) return [];

  const leads = [];
  const sinceTime = new Date(Date.now() - config.polling.intervalMinutes * 60 * 1000);

  for (const keyword of keywords) {
    if (!keyword.is_active || (keyword.platform && keyword.platform !== 'reddit')) {
      continue;
    }

    for (const subreddit of DEFAULT_SUBREDDITS) {
      try {
        const results = await searchSubreddit(client, subreddit, keyword.keyword, sinceTime);
        const processedLeads = processRedditResults(results, keyword, subreddit);
        leads.push(...processedLeads);
      } catch (error) {
        logger.error('Reddit search failed', { error, keyword, subreddit });
      }
    }
  }

  return leads;
}
```

### Phase 4: Data Mapping

**Reddit Post → Lead Object**:
```javascript
{
  platform: 'reddit',
  post_id: post.id,
  post_text: `${post.title}\n\n${post.selftext}`,
  post_url: `https://reddit.com${post.permalink}`,
  posted_at: new Date(post.created_utc * 1000),

  author_username: post.author.name,
  author_name: post.author.name,
  author_profile_url: `https://reddit.com/u/${post.author.name}`,
  author_followers: post.author.link_karma + post.author.comment_karma, // use karma
  author_verified: post.author.is_gold || post.author.is_mod,

  metadata: {
    subreddit: post.subreddit.display_name,
    flair: post.link_flair_text,
    upvotes: post.ups,
    comments: post.num_comments
  }
}
```

### Phase 5: Integration with Existing System

**Update `apps/api/src/services/polling.js`**:
```javascript
import { pollReddit } from './reddit-poller.js';

// In pollAllPlatforms():
const [twitterLeads, redditLeads] = await Promise.all([
  pollTwitterSafely(keywords),
  pollRedditSafely(keywords)
]);

const allLeads = [...twitterLeads, ...redditLeads];
```

**Update `apps/api/src/index.js`**:
```javascript
import { initializeRedditClient, testRedditConnection } from './config/reddit.js';

// Initialize Reddit
logger.info('Initializing Reddit client...');
initializeRedditClient();
await testRedditConnection();
```

**Update Database Schema**:
- `leads.platform` already supports any string
- Add 'reddit' to CHECK constraint:
```sql
platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit'))
```

**Update Frontend**:
- Add Reddit logo/icon
- Display subreddit in lead metadata
- Filter by platform (Twitter/Reddit)

---

## Setup Instructions

### 1. Create Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **Name**: Leadscout
   - **Type**: Script
   - **Description**: Automated lead generation
   - **Redirect URI**: http://localhost:8080/reddit/callback
4. Save and note `client_id` and `client_secret`

### 2. Get Refresh Token

Use helper tool: https://not-an-aardvark.github.io/reddit-oauth-helper/

Or manually:
```bash
# Install snoowrap locally
npm install snoowrap

# Run this script:
node scripts/get-reddit-token.js
```

Script content:
```javascript
import snoowrap from 'snoowrap';

const r = await snoowrap.fromApplicationOnlyAuth({
  userAgent: 'Leadscout/1.0',
  clientId: 'YOUR_CLIENT_ID',
  deviceId: 'DO_NOT_TRACK_THIS_DEVICE',
  grantType: snoowrap.grantType.INSTALLED_CLIENT
});

console.log('Refresh Token:', r.refreshToken);
```

### 3. Add to Environment Variables

```bash
# In Railway dashboard for production
REDDIT_CLIENT_ID=xxxxx
REDDIT_CLIENT_SECRET=xxxxx
REDDIT_REFRESH_TOKEN=xxxxx
REDDIT_USER_AGENT=Leadscout/1.0 by /u/yourusername

# In local .env for development
REDDIT_CLIENT_ID=xxxxx
REDDIT_CLIENT_SECRET=xxxxx
REDDIT_REFRESH_TOKEN=xxxxx
REDDIT_USER_AGENT=Leadscout/1.0 by /u/yourusername
```

### 4. Update Configuration

Add to `apps/api/src/config/env.js` and verification script.

---

## Rate Limit Management

**Reddit Limits**: 100 requests/minute
**Our Usage** (30-min polling cycle):
- Keywords: 129
- Subreddits: 7
- Max requests: 129 × 7 = 903 requests
- Time per cycle: 903 ÷ 100 = ~9 minutes

**Strategy**:
- Add 1-second delay between requests (built into snoowrap)
- Stagger searches across 30-minute window
- Monitor rate limit headers
- Exponential backoff on 429 errors

---

## Expected Results

### Lead Volume
- Twitter: ~50-100 leads/day (estimate after bug fix)
- Reddit: ~20-40 leads/day (smaller but higher quality)
- **Total**: ~70-140 leads/day

### Lead Quality
- Reddit leads likely **higher budget** (subreddit rules enforce)
- More **complete information** (budget, timeline, stack)
- **Easier to contact** (DMs, email in posts)

### System Health
- Reduced single-platform dependency
- Better failure resilience
- Diversified lead sources

---

## Testing Plan

1. **Unit Tests**: Reddit client initialization, search methods
2. **Integration Test**: Search test subreddit, verify data mapping
3. **Rate Limit Test**: Send 100+ requests, verify throttling
4. **Production Rollout**:
   - Deploy with Reddit disabled
   - Enable for 1 subreddit (/r/forhire)
   - Monitor for 24 hours
   - Gradually enable remaining subreddits
   - Full rollout after 1 week

---

## Rollback Plan

If Reddit integration causes issues:
1. Set `REDDIT_CLIENT_ID=` (empty) in Railway
2. System continues with Twitter only
3. No data loss (leads table supports both platforms)
4. Debug offline, re-enable when fixed

---

## Cost Analysis

**Reddit API**: FREE (within 100 QPM limit)
**Development Time**: ~4-6 hours
**Maintenance**: Low (official API, stable)

**ROI**:
- +30-50% lead volume
- Higher quality leads
- Zero additional cost
- **High value add**

---

## Next Steps

1. ✅ Document findings (DONE)
2. 🗑️ Remove LinkedIn code (NEXT)
3. 🔧 Implement Reddit client
4. 🔧 Implement Reddit poller
5. 🧪 Test locally
6. 🚀 Deploy to production
7. 📊 Monitor and optimize

---

## Comparison Matrix

| Feature | Twitter | LinkedIn | Reddit |
|---------|---------|----------|--------|
| **API Access** | ✅ Official | ❌ None | ✅ Official |
| **Search** | ✅ Yes | ❌ No | ✅ Yes |
| **Rate Limits** | 450/15min | N/A | 100/min |
| **Cost** | Free | N/A | Free |
| **Lead Quality** | Medium | N/A | High |
| **Lead Volume** | High | N/A | Medium |
| **Implementation** | ✅ Done | ❌ Remove | 🔧 Build |
| **Maintenance** | Low | N/A | Low |

---

**Verdict**: Reddit is the perfect complement to Twitter for lead generation. Official API, generous free tier, high-quality leads, and easy to implement.
