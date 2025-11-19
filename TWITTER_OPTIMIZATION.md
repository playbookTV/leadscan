# Twitter API Optimization Guide

This document explains the comprehensive Twitter API optimization strategies implemented in Leadscout to drastically reduce API usage while maintaining lead discovery effectiveness.

## Problem Statement

Twitter's Free Tier limits:
- **450 requests per 15-minute window**
- **500,000 tweets per month**

Original implementation:
- 129 keywords × 1 API call per keyword = **129 API calls per polling cycle**
- Polling every 30 minutes = **48 cycles per day**
- Total: **6,192 API calls per day** ❌ (way over limit)

## Implemented Solutions

### 1. **Production Connection Test Bypass** ✅

**Savings: 1 API call per app restart**

The Twitter connection test ([twitter.js:48](apps/api/src/config/twitter.js#L48)) is now skipped in production environments.

```javascript
// apps/api/src/index.js:46-51
if (config.nodeEnv === 'development') {
  services.twitter = await testTwitterConnection();
} else {
  services.twitter = true; // Skip test in production
  logger.info('Twitter client initialized (skipping connection test in production)');
}
```

**Configuration:**
- Automatic based on `NODE_ENV=production`
- No manual configuration needed

---

### 2. **Keyword Prioritization** ✅

**Savings: Searches only high-performing keywords**

Prioritizes keywords based on performance metrics using a weighted scoring algorithm:

| Metric | Weight | Points |
|--------|--------|--------|
| Conversion rate | 40% | 0-40 |
| High-score leads ratio | 30% | 0-30 |
| Recent activity | 20% | 0-20 |
| Total leads found | 10% | 0-10 |

**Algorithm** ([keyword-optimizer.js:90-145](apps/api/src/services/keyword-optimizer.js#L90-L145)):
```javascript
// Conversion rate (0-40 points)
score += conversionRate * 40;

// High-score leads ratio (0-30 points)
const highScoreRatio = high_score_leads / leads_found;
score += highScoreRatio * 30;

// Recent activity (0-20 points)
const recencyScore = Math.max(0, 20 - (daysSinceLastLead / 30) * 20);
score += recencyScore;

// Total leads found (0-10 points)
score += Math.min(10, Math.log10(leadsFound + 1) * 3);
```

**Configuration:**
```bash
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true  # Enable prioritization (default: true)
```

**Example Output:**
```
Top 5 keywords by priority:
  1. "need website designer" - Score: 68.5 (CR: 0.25, Leads: 42)
  2. "hiring web developer" - Score: 62.3 (CR: 0.18, Leads: 35)
  3. "saas design" - Score: 58.7 (CR: 0.15, Leads: 28)
```

---

### 3. **Keyword Rotation** ✅

**Savings: Distributes searches over time instead of all at once**

Uses round-robin approach to ensure all keywords eventually get searched while limiting per-cycle usage.

**Algorithm** ([keyword-optimizer.js:148-176](apps/api/src/services/keyword-optimizer.js#L148-L176)):
```javascript
// Cycle 1: Keywords 0-19
// Cycle 2: Keywords 20-39
// Cycle 3: Keywords 40-59
// ...and so on, wrapping around
```

**Configuration:**
```bash
TWITTER_ENABLE_KEYWORD_ROTATION=true   # Enable rotation (default: true)
TWITTER_MAX_KEYWORDS_PER_CYCLE=20      # Keywords per cycle (default: 20)
```

**Benefits:**
- All 129 keywords searched over ~7 cycles (3.5 hours)
- Each cycle uses only 20 API calls instead of 129
- **84% reduction in API calls per cycle**

---

### 4. **Query Batching** ✅

**Savings: Combines multiple keywords into single API calls**

Groups related keywords by category and combines them using OR operators.

**Algorithm** ([keyword-optimizer.js:178-225](apps/api/src/services/keyword-optimizer.js#L178-L225)):
```javascript
// Instead of:
// 1. Search "need website"
// 2. Search "need web designer"
// 3. Search "need developer"

// Batch into:
// 1. Search '"need website" OR "need web designer" OR "need developer"'
```

**Configuration:**
```bash
TWITTER_ENABLE_BATCHING=false    # Enable batching (default: false, experimental)
```

**⚠️ Warning:** Batching is disabled by default because:
- May reduce precision (gets results for ANY keyword in batch)
- Harder to track which keyword found which lead
- Enable only if you need maximum API savings

**Potential Savings:** With batching enabled:
- 20 keywords → ~7 batched queries (71% reduction)

---

### 5. **Rate Limit Monitoring** ✅

**Savings: Stops polling before hitting hard limits**

Monitors rate limit usage in real-time and stops polling when threshold is reached.

**Algorithm** ([keyword-optimizer.js:227-240](apps/api/src/services/keyword-optimizer.js#L227-L240)):
```javascript
// Check before each API call
if (rateLimitRemaining <= threshold) {
  logger.warn('Approaching Twitter rate limit, stopping polling');
  break;
}
```

**Configuration:**
```bash
TWITTER_RATE_LIMIT_THRESHOLD=50    # Stop when remaining calls ≤ 50 (default: 50)
```

**Benefits:**
- Prevents rate limit errors
- Preserves API calls for high-priority searches
- Graceful degradation instead of hard failures

---

### 6. **Configurable Keyword Limit** ✅

**Savings: Fine-tune API usage per deployment**

Allows you to control exactly how many keywords are searched per cycle.

**Configuration:**
```bash
TWITTER_MAX_KEYWORDS_PER_CYCLE=20    # Keywords per cycle (default: 20)
```

**Recommendation Guide:**

| Polling Interval | Keywords/Cycle | API Calls/Day | Coverage |
|------------------|----------------|---------------|----------|
| 30 minutes | 5 | 240 | Low |
| 30 minutes | 10 | 480 | Medium |
| 30 minutes | 20 | 960 | **Recommended** |
| 30 minutes | 50 | 2,400 | High |
| 60 minutes | 20 | 480 | Slower |

---

## Combined Impact

### Before Optimization:
```
129 keywords × 48 cycles/day = 6,192 API calls/day ❌
Rate limit: 450 calls per 15 minutes
Result: Constant rate limit errors, system unusable
```

### After Optimization (Default Settings):
```
20 keywords × 48 cycles/day = 960 API calls/day ✅
Rate limit: 450 calls per 15 minutes (64 calls/cycle)
Result: 84% reduction, well within limits
```

### After Optimization (Conservative Settings):
```bash
# Ultra-conservative for free tier
TWITTER_MAX_KEYWORDS_PER_CYCLE=10
POLLING_CRON_SCHEDULE=0 */2 * * *  # Every 2 hours

10 keywords × 12 cycles/day = 120 API calls/day ✅✅
Result: 98% reduction, maximum safety margin
```

### After Optimization (Aggressive with Batching):
```bash
# Maximum optimization
TWITTER_MAX_KEYWORDS_PER_CYCLE=30
TWITTER_ENABLE_BATCHING=true
TWITTER_RATE_LIMIT_THRESHOLD=100

30 keywords batched into ~10 queries × 48 cycles = 480 queries/day ✅
Result: 92% reduction, balanced approach
```

---

## Configuration Strategies

### Strategy 1: **Balanced (Recommended)** ⭐
```bash
TWITTER_MAX_KEYWORDS_PER_CYCLE=20
TWITTER_ENABLE_KEYWORD_ROTATION=true
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true
TWITTER_ENABLE_BATCHING=false
TWITTER_RATE_LIMIT_THRESHOLD=50
POLLING_CRON_SCHEDULE=*/30 * * * *
```
- **API calls/day:** ~960
- **Coverage:** Top 20 keywords every 30 min, full coverage in 3.5 hours
- **Best for:** Production use with free tier

### Strategy 2: **Conservative**
```bash
TWITTER_MAX_KEYWORDS_PER_CYCLE=10
TWITTER_ENABLE_KEYWORD_ROTATION=true
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true
TWITTER_ENABLE_BATCHING=false
TWITTER_RATE_LIMIT_THRESHOLD=30
POLLING_CRON_SCHEDULE=0 */2 * * *
```
- **API calls/day:** ~120
- **Coverage:** Top 10 keywords every 2 hours
- **Best for:** Maximum safety, limited API quota

### Strategy 3: **Aggressive**
```bash
TWITTER_MAX_KEYWORDS_PER_CYCLE=50
TWITTER_ENABLE_KEYWORD_ROTATION=false
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true
TWITTER_ENABLE_BATCHING=true
TWITTER_RATE_LIMIT_THRESHOLD=100
POLLING_CRON_SCHEDULE=*/30 * * * *
```
- **API calls/day:** ~900 (with batching)
- **Coverage:** Top 50 keywords every 30 min
- **Best for:** Paid Twitter API tier

---

## Monitoring

### Check Rate Limit Status

```bash
curl http://localhost:3000/stats
```

Look for:
```json
{
  "twitter": {
    "apiCallsUsed": 18,
    "rateLimitRemaining": 432,
    "lastPollTime": "2025-11-19T09:50:00Z"
  }
}
```

### Check Keyword Performance

View optimized keyword selection in logs:
```
[info]: Starting Twitter polling with optimized keywords {
  originalCount: 129,
  optimizedCount: 20,
  reduction: "84%"
}
```

### Check Rotation State

```
[debug]: Keyword rotation state {
  startIndex: 20,
  endIndex: 40,
  selected: 20,
  nextStartIndex: 40
}
```

---

## Deployment Guide

### Railway Production Deployment

1. **Set environment variables** in Railway dashboard:
   ```bash
   NODE_ENV=production
   TWITTER_MAX_KEYWORDS_PER_CYCLE=20
   TWITTER_ENABLE_KEYWORD_ROTATION=true
   TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true
   TWITTER_ENABLE_BATCHING=false
   TWITTER_RATE_LIMIT_THRESHOLD=50
   ```

2. **Deploy and monitor** logs for:
   ```
   [info]: Twitter client initialized (skipping connection test in production)
   [info]: Keyword optimization complete { optimized: 20, reduction: "84%" }
   ```

3. **Verify API usage** after first hour:
   - Should see ~40 API calls (2 polling cycles × 20 keywords)
   - Rate limit remaining should be ~410

---

## Troubleshooting

### Still Getting Rate Limit Errors?

1. **Reduce keywords per cycle:**
   ```bash
   TWITTER_MAX_KEYWORDS_PER_CYCLE=10
   ```

2. **Increase polling interval:**
   ```bash
   POLLING_CRON_SCHEDULE=0 */2 * * *  # Every 2 hours
   ```

3. **Check rotation is enabled:**
   ```bash
   TWITTER_ENABLE_KEYWORD_ROTATION=true
   ```

### Keywords Not Rotating?

Check logs for rotation state. If stuck, rotation resets automatically on app restart.

### Not Finding Enough Leads?

1. **Increase keywords per cycle** (if within rate limits):
   ```bash
   TWITTER_MAX_KEYWORDS_PER_CYCLE=30
   ```

2. **Enable batching** for more coverage:
   ```bash
   TWITTER_ENABLE_BATCHING=true
   ```

3. **Check prioritization** isn't filtering too aggressively - disable to search all keywords equally:
   ```bash
   TWITTER_ENABLE_KEYWORD_PRIORITIZATION=false
   ```

---

## Performance Metrics

Track these metrics to optimize further:

1. **API Efficiency:**
   - API calls per lead found
   - Cost per high-score lead
   - Rate limit utilization %

2. **Keyword Performance:**
   - Conversion rate by keyword
   - Leads found per search
   - Time between searches

3. **System Health:**
   - Polling cycle duration
   - Rate limit errors per day
   - Coverage completeness

---

## Future Enhancements

Potential optimizations not yet implemented:

1. **Smart scheduling** - Poll more frequently during high-activity hours
2. **Keyword learning** - Auto-disable perpetually low-performing keywords
3. **Regional batching** - Batch keywords by geographic relevance
4. **Sentiment filtering** - Pre-filter obvious non-leads before scoring
5. **Dynamic limits** - Adjust limits based on actual API usage patterns

---

## Summary

**Before:** 6,192 API calls/day → Constant failures ❌

**After:** 960 API calls/day → Smooth operation ✅

**Reduction:** 84% fewer API calls

**Configuration files:**
- [apps/api/src/services/keyword-optimizer.js](apps/api/src/services/keyword-optimizer.js)
- [apps/api/src/services/twitter-poller.js](apps/api/src/services/twitter-poller.js)
- [apps/api/src/config/env.js](apps/api/src/config/env.js)
- [apps/api/.env.example](apps/api/.env.example)

**Default settings work out-of-the-box** - No configuration changes needed for most users!
