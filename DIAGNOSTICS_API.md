# Diagnostics API - Twitter Quota Checker

## Overview

Access Twitter API diagnostics directly from your Railway deployment without SSH access.

## Endpoints

### 1. Twitter Quota Check

**URL**: `https://your-railway-app.up.railway.app/api/diagnostics/twitter-quota`

**What it does**:
- Checks Twitter API authentication
- Shows exact rate limit status (limit, remaining, reset time)
- Detects monthly tweet cap exhaustion
- Identifies your tier (FREE, BASIC, PRO)
- Provides specific recommendations

**How to use**:
1. Get your Railway app URL from Railway dashboard
2. Open in browser: `https://your-app.railway.app/api/diagnostics/twitter-quota`
3. View JSON response with diagnostic results

**Example Response** (Healthy):
```json
{
  "timestamp": "2025-11-19T18:30:00.000Z",
  "status": "running",
  "results": {
    "authentication": {
      "status": "success",
      "username": "your_bot_username",
      "userId": "123456789"
    },
    "rateLimit": {
      "status": "success",
      "limit": 1,
      "remaining": 1,
      "reset": "2025-11-19T18:45:00.000Z",
      "percentageUsed": 0
    },
    "tier": {
      "name": "FREE",
      "cost": "$0/month",
      "requestsPerWindow": "1 per 15 minutes",
      "monthlyTweetCap": "500,000 tweets"
    },
    "search": {
      "status": "success",
      "resultsFound": 8
    }
  },
  "recommendations": [
    {
      "priority": "INFO",
      "issue": "On FREE tier with limited quota",
      "action": "Current configuration (1 keyword/hour) is optimized for FREE tier",
      "upgrade": "Consider Twitter Basic ($200/mo) for 60x more requests if Reddit insufficient"
    },
    {
      "priority": "SUGGESTION",
      "issue": "Diversify platform risk",
      "action": "Enable Reddit alongside Twitter",
      "benefits": [
        "Free forever (no monthly caps)",
        "100 requests/minute vs Twitter 1/15min",
        "Higher quality leads (budgets, timelines)",
        "Code already implemented"
      ],
      "setup": "See REDDIT_SETUP_GUIDE.md - 30 minute setup"
    }
  ]
}
```

**Example Response** (Rate Limited):
```json
{
  "timestamp": "2025-11-19T18:30:00.000Z",
  "status": "rate_limited",
  "results": {
    "authentication": {
      "status": "success",
      "username": "your_bot_username",
      "userId": "123456789"
    },
    "rateLimit": {
      "status": "exhausted",
      "error": "Rate limit hit - all quota consumed",
      "code": 429
    },
    "search": {
      "status": "failed",
      "error": "Too Many Requests",
      "code": 429
    }
  },
  "recommendations": [
    {
      "priority": "CRITICAL",
      "issue": "Rate limit exhausted",
      "action": "Wait until rate limit resets",
      "resetTime": "2025-11-19T18:45:00.000Z",
      "alternative": "Enable Reddit immediately (free, unlimited) - see /api/diagnostics/reddit-setup"
    },
    {
      "priority": "CRITICAL",
      "issue": "Monthly tweet cap exhausted (500,000 tweets)",
      "action": "All searches will fail until monthly reset (December 1st)",
      "immediate": "Enable Reddit to restore lead discovery today"
    }
  ]
}
```

### 2. Reddit Setup Instructions

**URL**: `https://your-railway-app.up.railway.app/api/diagnostics/reddit-setup`

**What it does**:
- Step-by-step setup instructions
- Environment variables needed
- Expected results

**How to use**:
1. Open in browser: `https://your-app.railway.app/api/diagnostics/reddit-setup`
2. Follow the JSON instructions
3. Complete setup in 30 minutes

**Example Response**:
```json
{
  "title": "Reddit Setup Instructions",
  "estimatedTime": "30 minutes",
  "cost": "$0",
  "steps": [
    {
      "step": 1,
      "action": "Create Reddit App",
      "url": "https://www.reddit.com/prefs/apps",
      "instructions": [
        "Click 'create app' or 'create another app'",
        "Fill in form:",
        "  - Name: LeadScout",
        "  - Type: script",
        "  - Redirect URI: http://localhost:8080",
        "Copy the client_id and client_secret"
      ]
    },
    {
      "step": 2,
      "action": "Add to Railway Environment Variables",
      "variables": {
        "REDDIT_CLIENT_ID": "your_client_id_from_step_1",
        "REDDIT_CLIENT_SECRET": "your_secret_from_step_1",
        "REDDIT_USERNAME": "your_reddit_username",
        "REDDIT_PASSWORD": "your_reddit_password",
        "REDDIT_USER_AGENT": "LeadScout/1.0 by /u/your_username",
        "POLLING_PLATFORMS": "reddit,twitter"
      }
    }
  ],
  "expectedResults": {
    "timeToFirstLeads": "60 minutes (next polling cycle)",
    "leadsPerDay": "5-15 high-quality leads",
    "platforms": "Reddit (primary) + Twitter (supplementary if quota available)",
    "cost": "$0"
  }
}
```

### 3. System Status

**URL**: `https://your-railway-app.up.railway.app/api/diagnostics/system-status`

**What it does**:
- Overall health check
- Database connection status
- Telegram bot status
- Twitter authentication status

**Example Response**:
```json
{
  "timestamp": "2025-11-19T18:30:00.000Z",
  "services": {
    "database": {
      "status": "healthy"
    },
    "telegram": {
      "status": "connected"
    },
    "twitter": {
      "status": "rate_limited",
      "error": "Too Many Requests"
    }
  },
  "overall": "degraded"
}
```

## Quick Usage

### Find Your Railway URL

1. Go to Railway dashboard: https://railway.app/
2. Click your project
3. Click your service
4. Copy the URL under "Deployments" (e.g., `https://leadscoutapi-production.up.railway.app`)

### Check Twitter Quota

Replace `YOUR_RAILWAY_URL` with your actual URL:

```bash
# Browser
https://YOUR_RAILWAY_URL/api/diagnostics/twitter-quota

# curl (from terminal)
curl https://YOUR_RAILWAY_URL/api/diagnostics/twitter-quota | jq

# wget
wget -qO- https://YOUR_RAILWAY_URL/api/diagnostics/twitter-quota | jq
```

### Interpret Results

#### ✅ **Healthy** (status: "running")
- Twitter API working
- Rate limit available
- Searches succeeding
- **Action**: Continue monitoring

#### ⚠️ **Rate Limited** (status: "rate_limited")
- Quota exhausted in current 15-minute window
- **Action**: Wait for reset time shown in response

#### ❌ **Monthly Cap Hit** (monthlyCap.remaining: 0)
- 500,000 tweets/month limit reached
- All requests will fail until December 1st
- **Action**: Enable Reddit immediately

#### ❌ **Authentication Failed** (status: "failed")
- API credentials invalid
- App suspended
- **Action**: Check Railway environment variables, verify app status in Twitter Developer Portal

## Troubleshooting with Diagnostics

### Problem: "It's still not picking anything from Twitter"

**Step 1**: Check quota
```
https://your-app.railway.app/api/diagnostics/twitter-quota
```

**Step 2**: Interpret results

If you see:
```json
{
  "status": "rate_limited",
  "results": {
    "rateLimit": {
      "status": "exhausted"
    }
  }
}
```

**Root Cause**: Monthly tweet cap hit or rate limit exhausted

**Solution**:
1. Check `resetTime` in response
2. If reset is >15 minutes away, monthly cap is likely hit
3. Enable Reddit immediately: `https://your-app.railway.app/api/diagnostics/reddit-setup`

### Problem: "Shows rate limit available but searches still fail"

**Possible Causes**:
1. App-level restriction (not endpoint-level)
2. Account flagged for excessive use
3. Credentials invalid

**Solution**:
1. Check Twitter Developer Portal: https://developer.x.com/en/portal/dashboard
2. View "Usage" tab for detailed quota info
3. Verify app status (not suspended)
4. Regenerate API keys if needed

## Monitoring Schedule

### Daily
- Check `/api/diagnostics/system-status` once daily
- Verify all services healthy

### When Issues Occur
- Run `/api/diagnostics/twitter-quota` immediately
- Follow recommendations in JSON response
- If rate limited, enable Reddit

### Weekly
- Review quota usage trends
- Decide if Twitter upgrade needed
- Compare Reddit vs Twitter performance

## Expected Diagnostic Outcomes

| Scenario | Diagnostic Shows | Action |
|----------|------------------|--------|
| **Working normally** | `status: "running"`, `remaining > 0` | Continue monitoring |
| **Rate limit hit** | `status: "rate_limited"`, `resetTime` shown | Wait for reset (max 15 min) |
| **Monthly cap hit** | `monthlyCap.remaining: 0` | Enable Reddit, wait for Dec 1 |
| **Auth failed** | `authentication.status: "failed"` | Check credentials in Railway |
| **App suspended** | 401 error | Contact Twitter Support |

## Next Steps After Diagnostics

### If Monthly Cap Hit
1. Enable Reddit (30 minutes): Follow `/api/diagnostics/reddit-setup`
2. Wait for December 1st for Twitter reset
3. Monitor Reddit performance
4. Decide Twitter upgrade necessity

### If Rate Limited (15-min window)
1. Wait for reset time shown in response
2. Verify configuration: 1 keyword/hour, polling every 60 minutes
3. Consider enabling Reddit for higher volume

### If Authentication Failed
1. Go to Railway dashboard
2. Verify environment variables:
   - `TWITTER_BEARER_TOKEN`
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`
3. Check Twitter Developer Portal for app status
4. Regenerate keys if needed

## Additional Resources

- **Full Troubleshooting Guide**: [TWITTER_TROUBLESHOOTING.md](TWITTER_TROUBLESHOOTING.md)
- **Twitter Investigation**: [TWITTER_API_INVESTIGATION.md](TWITTER_API_INVESTIGATION.md)
- **Reddit Setup**: [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
- **Quick Fix Summary**: [QUICK_FIX_SUMMARY.md](QUICK_FIX_SUMMARY.md)

---

**Time to Run**: <5 seconds
**Setup Required**: None (already deployed with your app)
**Cost**: $0 (uses existing API quota)
