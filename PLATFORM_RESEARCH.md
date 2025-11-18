# Platform Research for Lead Generation

**Date**: November 18, 2025
**Project**: Leadscout - Automated Lead Generation System

## Executive Summary

This document evaluates social media platforms for automated lead generation, focusing on API availability, search capabilities, and technical feasibility.

---

## Platform Analysis

### 1. Twitter/X ✅ **RECOMMENDED - CURRENTLY WORKING**

**Status**: ✅ Fully Functional

**API Availability**:
- ✅ Official Twitter API v2 with search endpoint
- ✅ Bearer token authentication (app-only access)
- ✅ 450 requests per 15-min window (free tier)
- ✅ 500k tweets/month read limit

**Search Capabilities**:
- ✅ Search tweets by keywords
- ✅ Filter by date, engagement, verified users
- ✅ Access to author profiles, follower counts
- ✅ Real-time data within minutes of posting

**Current Implementation**:
- Library: `twitter-api-v2` (actively maintained)
- Authentication: Bearer Token (OAuth 2.0)
- Rate limit handling: Exponential backoff with retry
- Status: **Working in production**

**Pros**:
- Official, well-documented API
- Generous free tier
- Best B2B engagement for tech services
- Real-time lead discovery
- Rich metadata (followers, verification, bio)

**Cons**:
- Rate limits (manageable with 30-min polling)
- API keys can be revoked if TOS violated

**Cost**: Free (within limits)

**Verdict**: ✅ **Primary platform - continue using**

---

### 2. LinkedIn ❌ **NOT VIABLE**

**Status**: ❌ Dead End

**API Availability**:
- ❌ No public search API
- ❌ No content discovery API
- ✅ Only "Sign In" and "Share" APIs available to regular developers
- 🔒 Search requires "Select Developer" partnership status

**What You Have Access To**:
- ✅ Sign in with LinkedIn (profile data)
- ✅ Share on LinkedIn (post TO user's timeline)
- ❌ Search posts/content - **DOES NOT EXIST**
- ❌ Read public posts - **DOES NOT EXIST**

**Partnership Programs** (Not Applicable):
- Marketing API: For advertising platforms only
- Sales API: For Sales Navigator partners only
- Talent API: For recruiting platforms only
- All require formal partnership approval

**RSS Feeds** (Attempted):
- ❌ Deprecated/unofficial
- ❌ Frequently blocked with malformed XML
- ❌ Timeouts and parsing errors
- Status: **100% failure rate in production**

**Scraping Options**:
1. **Headless Browser Automation**:
   - Tools: Puppeteer, Playwright
   - Complexity: High (bot detection, CAPTCHA)
   - Maintenance: Very high (LinkedIn constantly updates defenses)
   - Legality: Violates TOS but legal per hiQ Labs case
   - Cost: Development time + infrastructure

2. **Third-Party Services**:
   - Apify: $2 per 1k posts
   - Bright Data: ~$50-200/month
   - They handle blocking/CAPTCHA
   - Still fragile and expensive

**python3-linkedin Library**:
- ❌ Last updated: September 2017 (8 years old)
- ❌ Built for LinkedIn v1 API (sunset in 2019)
- ❌ Does not work with current LinkedIn APIs

**Verdict**: ❌ **Remove from project - not worth the effort**

---

### 3. Reddit 🔍 **INVESTIGATING**

**API Availability**:
- ✅ Official Reddit API with search
- ✅ OAuth 2.0 authentication
- ✅ Free tier available
- 📊 Rate limits: 60 requests/minute (authenticated)

**Search Capabilities**:
- ✅ Search posts by keywords across all subreddits
- ✅ Filter by subreddit, time, sort order
- ✅ Access to post content, author, upvotes, comments
- ✅ Subreddit-specific searches

**Reddit for Lead Generation**:
- ✅ `/r/forhire` - Hiring posts
- ✅ `/r/freelance` - Freelance opportunities
- ✅ `/r/slavelabour` - Quick gigs
- ✅ `/r/hiring` - Job postings
- ✅ `/r/Jobs4Bitcoins` - Crypto payments
- ✅ `/r/[technology]jobs` - Tech-specific hiring subs
- ✅ Niche subreddits where people ask for help

**Example Searches**:
- "need web developer" in /r/forhire
- "looking for freelancer" in /r/freelance
- "website project budget" in /r/webdev
- Posts with keywords like "hiring", "budget", "urgent"

**Node.js Libraries**:
1. **snoowrap** (Most Popular)
   - GitHub: 1.2k+ stars
   - Last updated: Active (2024)
   - Full OAuth support
   - Comprehensive API coverage
   - TypeScript support

2. **raw.js** (Official wrapper)
   - Maintained by Reddit
   - Lower-level access
   - More control, less convenient

**Rate Limits**:
- Unauthenticated: Very restrictive
- Authenticated (OAuth): 60 requests/minute
- With our 30-min polling: ~1800 requests per cycle (plenty)

**Data Quality**:
- ✅ Posts often include budgets
- ✅ Users expect to be contacted
- ✅ Less competition than Twitter
- ⚠️ Some low-quality/spam posts
- ⚠️ Varies by subreddit quality

**Technical Implementation**:
```javascript
// Example with snoowrap
import snoowrap from 'snoowrap';

const reddit = new snoowrap({
  userAgent: 'Leadscout/1.0',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN
});

// Search across all subreddits
const results = await reddit.search({
  query: 'need web developer',
  time: 'day',
  sort: 'new',
  limit: 100
});

// Search specific subreddit
const forhirePosts = await reddit.getSubreddit('forhire')
  .search({
    query: 'website budget',
    time: 'week',
    sort: 'new'
  });
```

**Pros**:
- ✅ Official API with search
- ✅ Free tier sufficient for our needs
- ✅ Users explicitly looking for services
- ✅ Often include budgets/timelines
- ✅ Easy to implement (similar to Twitter)
- ✅ Less saturated than Twitter

**Cons**:
- ⚠️ Smaller volume than Twitter
- ⚠️ Quality varies by subreddit
- ⚠️ Some subreddits have strict rules
- ⚠️ May need to monitor 10+ subreddits

**Cost**: Free (within rate limits)

**Verdict**: 🎯 **HIGHLY RECOMMENDED - Should implement**

---

## Recommended Platform Strategy

### Phase 1: Current State ✅
- **Twitter**: Primary platform (working)
- **LinkedIn**: Remove entirely

### Phase 2: Add Reddit 🚀
- Implement Reddit API integration
- Monitor key subreddits (/r/forhire, /r/freelance, etc.)
- Use same scoring algorithm as Twitter
- Dual-platform notifications

### Phase 3: Platform Mix 📊
- **Twitter**: 60% of leads (larger volume, real-time)
- **Reddit**: 40% of leads (higher intent, budget info)
- Combined score across platforms
- Deduplicate cross-platform posts

---

## Implementation Priority

1. ✅ **Fix Twitter keyword bug** (DONE - deployed)
2. 🗑️ **Remove LinkedIn code** (NEXT)
3. 🚀 **Add Reddit integration** (NEW FEATURE)
4. 📊 **Compare platform performance**

---

## Reddit API Setup Requirements

**What You Need**:
1. Reddit account
2. Create app at https://www.reddit.com/prefs/apps
3. Get `client_id`, `client_secret`
4. Generate OAuth refresh token
5. Add to `.env`:
   ```bash
   REDDIT_CLIENT_ID=xxxxx
   REDDIT_CLIENT_SECRET=xxxxx
   REDDIT_REFRESH_TOKEN=xxxxx
   REDDIT_USER_AGENT=Leadscout/1.0
   ```

**NPM Package**:
```bash
pnpm add snoowrap
```

---

## Conclusion

**Remove**: LinkedIn (waste of time, no viable API)
**Keep**: Twitter (working perfectly)
**Add**: Reddit (official API, high-intent leads)

**Expected Results**:
- 2x lead volume (Twitter + Reddit)
- Better quality leads (Reddit users include budgets)
- Reduced dependency on single platform
- More stable system (official APIs only)

---

## Next Steps

1. Remove all LinkedIn code and dependencies
2. Update documentation to reflect Twitter-only
3. Design Reddit integration (similar to Twitter poller)
4. Implement Reddit API client and poller
5. Update scoring to handle Reddit post format
6. Deploy and monitor performance

---

**Authored by**: Claude Code
**Last Updated**: 2025-11-18
