# Twitter API Troubleshooting Guide

## Common Errors and Solutions

### 403 Forbidden Error

**Symptoms:**
- Railway logs show: `Twitter authentication failed {"error":"Request failed with code 403","code":403}`
- Polling cycles fail immediately
- No leads are discovered

**Root Cause:**
Your Twitter Bearer Token is either:
1. **Invalid** - Incorrect token copied to Railway
2. **Expired** - Token was revoked or regenerated in Twitter Developer Portal
3. **Insufficient permissions** - App doesn't have correct access level

**Solution:**

#### Step 1: Verify Bearer Token in Twitter Developer Portal
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Click on your app → "Keys and tokens" tab
3. Under "Authentication Tokens", find **Bearer Token**
4. Click "Regenerate" to create a new token
5. **IMPORTANT:** Copy the new token immediately (you can't view it again)

#### Step 2: Update Railway Environment Variable
1. Go to Railway dashboard: https://railway.app
2. Select your `@leadscout/api` service
3. Click "Variables" tab
4. Find `TWITTER_BEARER_TOKEN`
5. Paste the new Bearer Token (should start with `AAAAAAAAAA...`)
6. Click "Save"
7. **Railway will automatically redeploy** your service

#### Step 3: Verify App Permissions
Your Twitter app must have:
- **App permissions**: Read-only (minimum)
- **Type of App**: App only (OAuth 2.0 Bearer Token)
- **Elevated access** (recommended for higher rate limits)

To check:
1. Twitter Developer Portal → Your App → Settings
2. Under "User authentication settings":
   - Enable "OAuth 2.0" if not already enabled
   - App permissions: Read
3. Save changes

#### Step 4: Test Authentication
After Railway redeploys (takes ~2 minutes):
1. Check Railway logs for: `Twitter authentication successful`
2. Or visit: `https://your-app.railway.app/api/diagnostics/twitter-quota`
3. Should show: `"authentication": { "status": "success", "method": "bearer_token" }`

---

### 429 Rate Limit Error

**Symptoms:**
- Railway logs show: `Twitter rate limit hit, retry 1/3`
- Searches fail after auth succeeds
- Message: `Twitter rate limit exceeded after maximum retries`

**Root Cause:**
You've exhausted your Twitter API quota. Twitter's Free tier provides:
- **1 request per 15 minutes** for recent search
- **500,000 tweets per month** cap

**Immediate Actions:**

#### Option 1: Wait for Rate Limit Reset
Rate limits reset every 15 minutes. Check Railway logs for:
```
"resetTime": "2025-11-19T19:31:22.000Z"
```
Wait until this time, then the next polling cycle will work.

#### Option 2: Reduce Keyword Count (Recommended)
With 129 keywords and Free tier (1 request per 15 min), you can only search **1 keyword per polling cycle**.

Current configuration in Railway:
- `TWITTER_MAX_KEYWORDS_PER_CYCLE=20` → **Change to 1**
- `POLLING_INTERVAL_MINUTES=30` → Polling runs every hour via cron

**Update Railway variables:**
```bash
TWITTER_MAX_KEYWORDS_PER_CYCLE=1
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true  # Searches best keyword first
```

This will:
- Search only the highest-performing keyword each cycle
- Rotate through all keywords over time
- Stay within Free tier limits

#### Option 3: Upgrade to Twitter Basic Plan ($100/month)
- **60 requests per 15 minutes** (60x increase)
- **10,000 tweets per month** cap
- Allows searching ~50 keywords per polling cycle
- Apply at: https://developer.twitter.com/en/portal/products

#### Option 4: Enable Reddit (FREE alternative)
See [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md) to add Reddit as a second platform.
- **No rate limits** for RSS feeds
- **No API keys** required
- **30 minutes setup time**

---

### Monthly Tweet Cap Exhausted

**Symptoms:**
- Railway logs show: `❌ CRITICAL: Twitter monthly tweet cap exhausted`
- `monthlyCap.remaining: 0`
- All searches fail until next month

**Root Cause:**
You've read 500,000 tweets this month (Twitter Free tier monthly limit).

**Solutions:**

#### Immediate: Enable Reddit
1. Follow [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
2. Update Railway variables:
   ```bash
   ENABLE_REDDIT=true
   ```
3. Reddit has no monthly cap and will keep leads flowing

#### Long-term: Optimize Twitter Usage
1. Reduce `TWITTER_MAX_KEYWORDS_PER_CYCLE` to 1-5
2. Enable keyword prioritization:
   ```bash
   TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true
   ```
3. Set `max_results=10` in searches (fewer tweets per query)

#### Reset Date
Twitter monthly caps reset on the **1st of each month** (UTC timezone).

---

## Quick Diagnostics

### Check Current Status via API
```bash
curl https://your-app.railway.app/api/diagnostics/twitter-quota
```

**Healthy Response:**
```json
{
  "authentication": { "status": "success", "method": "bearer_token" },
  "rateLimit": {
    "limit": 1,
    "remaining": 1,
    "reset": "2025-11-19T19:45:00.000Z"
  },
  "tier": "FREE",
  "monthlyCap": {
    "limit": 500000,
    "remaining": 234567
  }
}
```

**Problem Indicators:**
- `authentication.status: "failed"` → Bearer Token issue (see 403 section)
- `rateLimit.remaining: 0` → Rate limit hit (see 429 section)
- `monthlyCap.remaining: 0` → Monthly cap exhausted (see above)

### Check Railway Logs
```bash
# View latest 100 lines
railway logs --tail 100

# Follow logs in real-time
railway logs --follow
```

**Look for:**
- ✅ `Twitter authentication successful` = All good
- ❌ `Twitter authentication failed (403)` = Bearer Token issue
- ⚠️ `Twitter rate limit hit` = Quota exhausted
- ❌ `CRITICAL: Twitter monthly tweet cap exhausted` = Monthly limit hit

---

## Environment Variables Reference

Required in Railway for Twitter integration:

```bash
# Required
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxxxx  # From Twitter Dev Portal

# Optional - Optimization
TWITTER_MAX_KEYWORDS_PER_CYCLE=1                         # Free tier: use 1
TWITTER_ENABLE_KEYWORD_ROTATION=true                     # Rotate through all keywords
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true               # Search best keywords first
TWITTER_ENABLE_BATCHING=false                            # Experimental, keep false
TWITTER_RATE_LIMIT_THRESHOLD=1                           # Stop when ≤1 call remaining
```

---

## Recommended Configuration for Free Tier

**Railway Environment Variables:**
```bash
# Twitter
TWITTER_BEARER_TOKEN=<your-new-bearer-token>
TWITTER_MAX_KEYWORDS_PER_CYCLE=1
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true
TWITTER_ENABLE_KEYWORD_ROTATION=true

# Polling (runs every hour via cron)
POLLING_INTERVAL_MINUTES=60

# Enable Reddit as backup
ENABLE_REDDIT=true
REDDIT_CLIENT_ID=<your-reddit-client-id>
REDDIT_CLIENT_SECRET=<your-reddit-client-secret>
```

**Expected Behavior:**
- **1 Twitter search per hour** (highest priority keyword)
- **All Reddit searches every 2 hours** (no limits)
- Rotates through all 129 Twitter keywords over ~5 days
- Stays within Free tier limits

---

## Testing Your Fix

After updating Railway variables:

1. **Wait for auto-deploy** (~2 minutes)
2. **Check logs:**
   ```bash
   railway logs --tail 50
   ```
3. **Look for success messages:**
   ```
   ✅ Twitter authentication successful
   ✅ Twitter diagnostics complete { tier: 'FREE', status: 'healthy' }
   ```
4. **Trigger manual polling** (optional):
   ```bash
   curl -X POST https://your-app.railway.app/api/poll/trigger
   ```
5. **Verify leads flow** in dashboard: http://localhost:5173

---

## Still Having Issues?

### Enable Debug Logging
Add to Railway variables:
```bash
LOG_LEVEL=debug
```

This will show detailed Twitter API responses in Railway logs.

### Check API Status
Twitter API status page: https://api.twitterstat.us/

If Twitter API is down, wait for them to resolve it.

### Contact Support
1. Check Twitter Developer Community: https://twittercommunity.com/
2. Review Twitter API docs: https://developer.twitter.com/en/docs/twitter-api
3. Open GitHub issue: https://github.com/playbookTV/leadscan/issues

---

## Summary: Common Fixes

| Error | Quick Fix |
|-------|-----------|
| **403 Forbidden** | Regenerate Bearer Token in Twitter Dev Portal → Update `TWITTER_BEARER_TOKEN` in Railway |
| **429 Rate Limit** | Set `TWITTER_MAX_KEYWORDS_PER_CYCLE=1` in Railway |
| **Monthly Cap Hit** | Enable Reddit (`ENABLE_REDDIT=true`) → Wait for next month |
| **No leads found** | Check authentication first, then verify keywords are active in dashboard |

**Pro Tip:** For the most reliable free setup, use Twitter (1 keyword/hour) + Reddit (unlimited) together. This gives you continuous lead flow without hitting limits.
