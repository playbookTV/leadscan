# Railway Log Guide - Finding Twitter Status

## Quick Reference: What to Look For

After Railway deploys (~2 minutes), check your logs:

## 📍 Where to Find Logs

1. Go to: https://railway.app/
2. Click project: `leadscoutapi-production`
3. Click your service
4. Click "Deployments" tab
5. Click the latest deployment (top of list)
6. Logs appear automatically

## 🔍 What to Search For in Logs

Use **Cmd+F** (Mac) or **Ctrl+F** (Windows) and search for:

```
Twitter API diagnostics
```

This will jump you to the diagnostics section.

## 📊 Log Pattern Scenarios

### ✅ Scenario A: Twitter Working (Healthy)

**What you'll see**:
```
========================================
Running Twitter API diagnostics...
========================================

Twitter authentication successful {
  "username": "your_bot_username",
  "userId": "123456789"
}

Twitter API quota check {
  "tier": "FREE",
  "limit": 1,
  "remaining": 1,
  "reset": "2025-11-19T20:00:00.000Z",
  "percentageUsed": 0
}

✅ Twitter diagnostics complete {
  "tier": "FREE",
  "status": "healthy",
  "requestsAvailable": 1
}

========================================
Diagnostics complete. Check logs above for Twitter quota status.
For detailed analysis, visit: /api/diagnostics/twitter-quota
========================================
```

**Interpretation**:
- ✅ Authentication working
- ✅ Rate limit: 1 request available (FREE tier)
- ✅ Status: healthy
- ✅ Next search at top of hour should succeed

**Action**: None needed. Wait for next polling cycle.

---

### ❌ Scenario B: Monthly Cap Exhausted (Critical)

**What you'll see**:
```
========================================
Running Twitter API diagnostics...
========================================

Twitter authentication successful {
  "username": "your_bot_username",
  "userId": "123456789"
}

❌ Twitter rate limit exhausted at startup {
  "error": "Too Many Requests",
  "code": 429
}

❌ CRITICAL: Twitter searches will fail {
  "reason": "Rate limit or monthly cap exhausted",
  "diagnostic": "/api/diagnostics/twitter-quota",
  "action": "Visit diagnostic endpoint for detailed analysis"
}

⚠️  IMMEDIATE ACTION REQUIRED: Enable Reddit {
  "endpoint": "/api/diagnostics/reddit-setup",
  "guide": "REDDIT_SETUP_GUIDE.md",
  "estimatedTime": "30 minutes"
}

========================================
Diagnostics complete. Check logs above for Twitter quota status.
For detailed analysis, visit: /api/diagnostics/twitter-quota
========================================
```

**Interpretation**:
- ✅ Authentication working
- ❌ Rate limit exhausted (429 error)
- ❌ All Twitter searches will fail
- ⚠️ Monthly cap likely hit (500k tweets)

**Action**: Enable Reddit immediately (30-minute setup)

**Evidence this is monthly cap, not 15-min window**:
- If you see 429 immediately on startup
- If 429 persists across multiple hourly cycles
- If reset time is far in future (December 1st)

---

### ❌ Scenario C: Authentication Failed (Credentials Issue)

**What you'll see**:
```
========================================
Running Twitter API diagnostics...
========================================

Twitter authentication failed {
  "error": "Invalid credentials",
  "code": 401
}

========================================
Diagnostics complete. Check logs above for Twitter quota status.
For detailed analysis, visit: /api/diagnostics/twitter-quota
========================================
```

**Interpretation**:
- ❌ Twitter API credentials invalid
- ❌ App may be suspended
- ❌ Bearer token may be expired

**Action**:
1. Check Railway environment variables
2. Verify `TWITTER_BEARER_TOKEN` is correct
3. Check Twitter Developer Portal for app status
4. Regenerate credentials if needed

---

### ⚠️ Scenario D: Diagnostics Failed (Non-Critical)

**What you'll see**:
```
========================================
Running Twitter API diagnostics...
========================================

Startup diagnostics failed (non-fatal) {
  "error": "..."
}

========================================
Diagnostics complete. Check logs above for Twitter quota status.
For detailed analysis, visit: /api/diagnostics/twitter-quota
========================================
```

**Interpretation**:
- ⚠️ Diagnostics couldn't complete
- ✅ App continues running normally
- 🔍 Need alternative diagnostic method

**Action**: Visit `/api/diagnostics/twitter-quota` endpoint in browser

---

## 🎯 Key Indicators to Look For

### Healthy Twitter ✅
- `"status": "healthy"`
- `"remaining": 1` (or higher)
- `"tier": "FREE"` (or BASIC/PRO)
- `✅ Twitter diagnostics complete`

### Rate Limited ❌
- `❌ Twitter rate limit exhausted`
- `"code": 429`
- `"error": "Too Many Requests"`
- `⚠️ IMMEDIATE ACTION REQUIRED`

### Authentication Failed ❌
- `Twitter authentication failed`
- `"code": 401`
- `"error": "Invalid credentials"`

### Monthly Cap Hit ❌
- `❌ CRITICAL: Twitter monthly tweet cap exhausted`
- `"remaining": 0`
- `"message": "...until monthly reset (December 1st)"`

## 📋 Step-by-Step Log Analysis

### Step 1: Find the Diagnostics Section
Search logs for: `Twitter API diagnostics`

### Step 2: Check Authentication
Look for:
- ✅ `Twitter authentication successful` → Good
- ❌ `Twitter authentication failed` → Check credentials

### Step 3: Check Rate Limit
Look for:
- ✅ `"remaining": 1` → Quota available
- ❌ `"remaining": 0` → Quota exhausted

### Step 4: Check for Critical Warnings
Look for:
- ❌ `CRITICAL` → Immediate action required
- ⚠️ `WARNING` → Attention needed
- ✅ No warnings → All good

### Step 5: Follow Recommendations
If you see:
- `⚠️ IMMEDIATE ACTION REQUIRED: Enable Reddit` → Do it
- `For detailed analysis, visit: /api/diagnostics/twitter-quota` → Visit endpoint

## 🆘 Common Issues and Solutions

### Issue: "Logs don't show diagnostics section"

**Possible Causes**:
- Deployment still in progress
- Twitter service not initialized
- Logs not fully loaded

**Solutions**:
1. Wait 30 seconds, refresh logs
2. Scroll to top of logs and look for initialization
3. Check if Twitter service initialized successfully
4. Look for: `Initializing Twitter client...`

### Issue: "See 429 in diagnostics but searches were working before"

**Meaning**: Monthly cap just hit, quota exhausted

**Solution**: Enable Reddit (Twitter resets December 1st)

### Issue: "Diagnostics show healthy but searches still fail"

**Possible Causes**:
- Quota was available at startup but exhausted later
- App-level throttling (not shown in diagnostics)
- Different credentials in use

**Solutions**:
1. Check next polling cycle logs
2. Visit `/api/diagnostics/twitter-quota` for current status
3. Check Twitter Developer Portal usage

## 📞 Where to Get Help

### Self-Service
1. **Logs show ❌**: Follow logged recommendations
2. **Visit**: `/api/diagnostics/twitter-quota` for detailed JSON
3. **Read**: [TWITTER_TROUBLESHOOTING.md](TWITTER_TROUBLESHOOTING.md)

### Documentation
- **Quick Fix**: [QUICK_FIX_SUMMARY.md](QUICK_FIX_SUMMARY.md)
- **API Docs**: [DIAGNOSTICS_API.md](DIAGNOSTICS_API.md)
- **Reddit Setup**: [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)

---

**Pro Tip**: Bookmark the diagnostics section in your Railway logs by clicking the timestamp next to the log line. This gives you a direct link to return to later.

**Time to Check**: <5 seconds (once logs load)
**Frequency**: Check after each deployment or when Twitter searches fail
