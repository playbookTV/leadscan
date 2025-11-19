# Twitter API Rate Limit Analysis

## Problem Statement

Twitter API searches are **persistently failing with 429 (Rate Limit Exceeded)** errors across all polling cycles, even after the 15-minute reset windows pass.

## Evidence from Logs

### Polling Cycle Pattern
All 4 polling cycles today hit rate limits:

1. **12:36 UTC** - Reset time: 12:43:18 UTC
2. **13:00 UTC** - Reset time: 13:15:00 UTC
3. **13:30 UTC** - Reset time: 13:45:01 UTC
4. **14:00 UTC** - Reset time: 14:15:01 UTC

### Key Observation
**Every first API call after reset window still gets 429 error**

This indicates the rate limiting is NOT at the endpoint level (which resets every 15 minutes), but at a higher level.

## Twitter API v2 Rate Limits (Free Tier)

### Official Limits
- **Tweet Cap**: 500,000 tweets/month (read-only)
- **Search Endpoint**: 450 requests per 15-minute window
- **Monthly Reset**: 1st of each month
- **App-level limits**: Yes (undocumented)

### Current Configuration
```bash
TWITTER_MAX_KEYWORDS_PER_CYCLE=3
POLLING_CRON_SCHEDULE=*/30 * * * *  # Every 30 minutes
```

### Expected Usage
- **Searches per cycle**: 3 keywords
- **Cycles per day**: 48 (every 30 minutes)
- **API calls per day**: 144 (3 × 48)
- **API calls per 15-min window**: ~6 (well under 450 limit)

This usage is **well within limits**, yet we're hitting 429 errors.

## Possible Root Causes

### 1. Monthly Tweet Cap Exceeded (Most Likely)
**Symptom**: All API calls fail with 429, regardless of timing
**Cause**: 500,000 tweets read in current month
**Reset**: 1st of next month (December 1, 2025)
**How it happened**:
- Initial testing/development consumed quota
- Multiple deployments with connection tests
- Previous higher keyword count (20-129 per cycle)
- Each search can return up to 100 tweets × multiple searches

**How to verify**:
1. Go to Twitter Developer Portal: https://developer.twitter.com/
2. Click on your app
3. Check "Usage" or "Analytics" tab
4. Look for "Monthly Tweet Cap" usage

**Solution if confirmed**:
- Wait until December 1 for quota reset
- OR upgrade to Basic tier ($100/month) for 10M tweets
- OR enable Reddit to continue lead discovery

### 2. App-Level Rate Limit (Possible)
**Symptom**: All endpoints affected, not just search
**Cause**: Twitter flagged app for excessive use
**How to verify**: Check developer portal for warnings/suspensions
**Solution**:
- Contact Twitter Support
- Wait for automatic reset (usually 24-48 hours)
- Create new app with fresh credentials

### 3. Account-Level Suspension (Unlikely)
**Symptom**: All API calls fail
**Cause**: Account flagged for policy violations
**How to verify**: Check developer portal for account status
**Solution**: Appeal to Twitter Support

### 4. IP-Level Rate Limiting (Unlikely)
**Symptom**: All requests from Railway fail
**Cause**: Railway's IP range flagged
**How to verify**: Test from local machine
**Solution**: Contact Railway support or Twitter support

## Twitter API v2 Error Response Analysis

When rate limited, Twitter returns:
```json
{
  "title": "Too Many Requests",
  "detail": "Too Many Requests",
  "type": "about:blank",
  "status": 429
}
```

With headers:
```
x-rate-limit-limit: 450
x-rate-limit-remaining: 0
x-rate-limit-reset: 1700409818  # Unix timestamp
```

### Monthly Cap vs Endpoint Limit
- **Endpoint limit**: Resets every 15 minutes, returns reset timestamp
- **Monthly cap**: Doesn't reset until month end, may not provide specific reset info

The logs show `resetTime` in the 15-minute pattern, which suggests the endpoint limit is working correctly, but something else is blocking the requests.

## Diagnostic Steps

### Step 1: Check Developer Portal
1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Select your app
3. Navigate to "Usage" or "Project usage" tab
4. Check:
   - **Monthly Tweet Cap**: X / 500,000
   - **Monthly search requests**: X / XXX
   - **Account status**: Active / Suspended
   - **Any warnings or notices**

### Step 2: Test with Minimal Query
Create a simple test script to verify basic API access:

```javascript
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

async function testTwitterAccess() {
  try {
    // Minimal query - should use ~10 tweets from quota
    const result = await client.readOnly.v2.search('hello', {
      max_results: 10,
      'tweet.fields': ['created_at']
    });

    console.log('✅ API Access Working');
    console.log('Rate Limit:', {
      limit: result.rateLimit.limit,
      remaining: result.rateLimit.remaining,
      reset: new Date(result.rateLimit.reset * 1000).toISOString()
    });
    console.log('Tweets returned:', result.data?.data?.length || 0);
  } catch (error) {
    console.error('❌ API Access Failed');
    console.error('Error:', error.code, error.message);
    console.error('Data:', error.data);
  }
}

testTwitterAccess();
```

### Step 3: Check Error Details
Look at the actual error response structure in logs. The current logs show:
```
Twitter search failed {"error":"Twitter rate limit exceeded after maximum retries"}
```

But we need to see the actual Twitter API error response to distinguish between:
- Endpoint rate limit (x-rate-limit-remaining: 0)
- Monthly cap exceeded (different error message)
- Account suspension (specific error code)

### Step 4: Test from Different Environment
Try the same API calls from:
- Local machine (not Railway)
- Different Twitter app
- Different Twitter account

This will help isolate whether the issue is:
- App-specific
- Account-specific
- IP-specific (Railway)
- Global (all environments)

## Twitter API Tier Comparison

| Tier | Cost | Tweet Cap | Endpoints | Support |
|------|------|-----------|-----------|---------|
| **Free** | $0 | 500k/month | Limited | Community |
| **Basic** | $100/mo | 10M/month | More | Email |
| **Pro** | $5,000/mo | 1M/month | Full | Priority |

### When to Upgrade to Basic

**Consider upgrading if**:
- Monthly tweet cap consistently exceeded
- Need more than 500k tweets/month
- Need higher rate limits
- Need additional endpoints

**Don't upgrade if**:
- Current issue is temporary
- Reddit can provide sufficient leads
- Cost not justified by lead quality

## Recommended Action Plan

### Immediate (Today)
1. ✅ **Check Twitter Developer Portal** for quota usage
   - Go to: https://developer.twitter.com/en/portal/dashboard
   - Check monthly tweet cap usage
   - Look for any account warnings

2. ✅ **Enable Reddit as backup**
   - Follow [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
   - Add Reddit credentials to Railway
   - Update POLLING_PLATFORMS=twitter,reddit
   - This ensures lead discovery continues

### Short Term (This Week)
3. **Test Twitter API locally**
   - Run diagnostic script from local machine
   - Verify if issue is Railway-specific
   - Check actual error response details

4. **Analyze actual quota usage**
   - Calculate approximate tweets consumed
   - Estimate daily/monthly burn rate
   - Determine if 500k cap is sufficient

5. **Optimize Twitter usage** (if staying on Free tier)
   - Further reduce keywords (currently 3)
   - Reduce max_results per search (currently 100)
   - Increase polling interval (currently 30 min)
   - Add smart filtering before API calls

### Long Term (Next Week+)
6. **Decide on Twitter tier**
   - If quota exceeded: Upgrade to Basic ($100/mo)
   - If sufficient: Stay on Free tier
   - Calculate ROI: Cost vs lead quality

7. **Implement multi-platform strategy**
   - Reddit as primary source (free, generous limits)
   - Twitter as secondary (if needed)
   - Consider other platforms (Discord, Slack, etc.)

## Cost-Benefit Analysis

### Scenario A: Upgrade Twitter to Basic
**Costs**:
- $100/month = $1,200/year
- 10M tweets/month (20x increase)

**Benefits**:
- No tweet cap concerns
- Higher rate limits
- Email support
- More stable service

**ROI Calculation**:
- Need 1-2 clients/year to justify cost
- Each client typically worth $5,000-$50,000
- Twitter leads historically medium quality

### Scenario B: Use Reddit (Free) + Twitter (Free)
**Costs**:
- $0 additional cost
- Setup time: 1 hour

**Benefits**:
- Reddit: 100 req/min, free, high-quality leads
- Twitter: 450 req/15min, free (when quota available)
- Diversified lead sources
- No single point of failure

**ROI Calculation**:
- Zero cost = infinite ROI
- Reddit leads expected to be higher quality (budget info, timelines)
- Combined coverage better than single platform

### Recommendation: **Scenario B**
Enable Reddit immediately. This gives you:
- Free alternative to Twitter
- Higher quality leads (Reddit posts include budgets)
- Platform diversification
- Time to analyze if Twitter Basic needed

## Twitter API Best Practices (Moving Forward)

### 1. Monitor Quota Usage
- Log monthly tweet consumption
- Set alerts at 80% quota
- Track daily burn rate

### 2. Optimize API Calls
- Cache results when possible
- Use minimal `max_results` needed
- Filter keywords before API calls
- Implement smart deduplication

### 3. Rate Limit Handling
- Respect x-rate-limit-remaining headers
- Implement exponential backoff
- Queue requests during high-load periods
- Log all rate limit errors with details

### 4. Error Logging Improvements
Enhance error logging to capture:
```javascript
catch (error) {
  logger.error('Twitter API Error', {
    code: error.code,
    message: error.message,
    rateLimit: error.rateLimit ? {
      limit: error.rateLimit.limit,
      remaining: error.rateLimit.remaining,
      reset: new Date(error.rateLimit.reset * 1000).toISOString()
    } : null,
    data: error.data,
    type: error.type,
    headers: error.headers
  });
}
```

### 5. Quota Tracking Dashboard
Create internal dashboard showing:
- Daily API calls
- Daily tweets consumed
- Monthly quota progress
- Estimated days until cap
- Cost per lead from Twitter

## Conclusion

The persistent 429 errors across all polling cycles, even after reset windows, strongly suggests **monthly tweet cap exhaustion** rather than endpoint-level rate limiting.

**Next Step**: Check Twitter Developer Portal to confirm quota usage. If 500k cap is reached, either:
1. Wait until December 1 for reset (free)
2. Upgrade to Basic tier (cost $100/mo)
3. Enable Reddit and continue lead discovery (free, recommended)

**Recommended**: Enable Reddit immediately to restore lead discovery while investigating Twitter quota.

---

**Document Version**: 1.0
**Date**: 2025-11-19
**Status**: Analysis Complete, Awaiting Portal Check
