# Check Twitter Status NOW

## What to Do

After Railway finishes deploying the new code (takes ~2 minutes), Twitter quota status will automatically appear in the logs.

## Option 1: Check Railway Logs (Easiest)

The app now runs diagnostics automatically on startup and logs the results.

1. Go to https://railway.app/
2. Click your project: `leadscoutapi-production`
3. Click on the latest deployment
4. Scroll through logs and look for:

```
========================================
Running Twitter API diagnostics...
========================================
```

**What to look for**:

### ✅ If you see: "Twitter API quota check" with "remaining: 1"
```
Twitter API quota check {
  "tier": "FREE",
  "limit": 1,
  "remaining": 1,
  "reset": "2025-11-19T19:00:00.000Z"
}
✅ Twitter diagnostics complete { "tier": "FREE", "status": "healthy" }
```

**Meaning**: Twitter quota available, searches should work!

---

### ❌ If you see: "Twitter rate limit exhausted at startup"
```
❌ Twitter rate limit exhausted at startup { "error": "Too Many Requests", "code": 429 }
❌ CRITICAL: Twitter searches will fail { "reason": "Rate limit or monthly cap exhausted" }
⚠️  IMMEDIATE ACTION REQUIRED: Enable Reddit
```

**Meaning**: Monthly cap hit or rate limit exhausted. Twitter won't work until December 1st.

**Action**: Enable Reddit immediately (see below)

---

## Option 2: Check API Endpoint (Alternative)

After Railway finishes deploying the new code (takes ~2 minutes), check your Twitter quota status via API.

### Step 1: Find Your Railway URL

1. Go to https://railway.app/
2. Click your project: `leadscoutapi-production`
3. Click your service
4. Look for the deployment URL (something like `https://leadscoutapi-production-xxx.up.railway.app`)

### Step 2: Open Diagnostics in Browser

Replace `YOUR_URL` with your Railway URL from Step 1:

```
https://YOUR_URL/api/diagnostics/twitter-quota
```

**Example**:
```
https://leadscoutapi-production.up.railway.app/api/diagnostics/twitter-quota
```

### Step 3: Interpret Results (API Response)

### ✅ If you see: `"status": "running"`
Twitter is working! Rate limits available.

**Example**:
```json
{
  "status": "running",
  "results": {
    "rateLimit": {
      "remaining": 1,
      "reset": "2025-11-19T19:00:00.000Z"
    },
    "tier": {
      "name": "FREE"
    }
  }
}
```

**Action**: Twitter should work at next polling cycle (top of hour)

---

### ❌ If you see: `"status": "rate_limited"`
Twitter quota exhausted.

**Example**:
```json
{
  "status": "rate_limited",
  "results": {
    "rateLimit": {
      "status": "exhausted"
    }
  },
  "recommendations": [
    {
      "priority": "CRITICAL",
      "issue": "Monthly tweet cap exhausted (500,000 tweets)"
    }
  ]
}
```

**Action**: Monthly cap hit, enable Reddit immediately

---

### ⚠️ If you see: `"monthlyCap": { "remaining": 0 }`
Monthly tweet cap exhausted (500k limit).

**Action**:
1. Enable Reddit now (30 minutes)
2. Wait for Twitter reset on December 1st

---

## Step 4: Next Actions Based on Results

### If Monthly Cap Hit (Most Likely)

**Immediate**: Enable Reddit to restore lead discovery today

1. Visit: `https://YOUR_URL/api/diagnostics/reddit-setup`
2. Follow the JSON instructions
3. Complete setup in 30 minutes
4. Leads flowing within 1 hour

**Full guide**: [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)

### If Rate Limit Available

**Wait**: Next polling cycle is at the top of the hour (e.g., 19:00, 20:00, 21:00)

Check logs in Railway:
- Look for "Twitter search completed"
- Should see leads found
- If still 429 errors, monthly cap is hit

## Quick Reference

| URL | Purpose |
|-----|---------|
| `/api/diagnostics/twitter-quota` | Check Twitter quota status |
| `/api/diagnostics/reddit-setup` | Reddit setup instructions |
| `/api/diagnostics/system-status` | Overall service health |
| `/health` | Basic health check |
| `/stats` | Polling statistics |

## What Happens After Deployment

1. **Railway redeploys** (2 minutes after push)
2. **App restarts** with new diagnostics endpoints
3. **Visit diagnostic URL** to check Twitter status
4. **Follow recommendations** in JSON response

## Expected Timeline

| Time | Action |
|------|--------|
| **Now** | Code pushed to GitHub |
| **+2 min** | Railway auto-deploys |
| **+3 min** | App restarted, diagnostics available |
| **+5 min** | Visit `/api/diagnostics/twitter-quota` |
| **+10 min** | Follow recommendations (likely enable Reddit) |
| **+40 min** | Reddit setup complete |
| **+60 min** | First leads from Reddit |

## Why This Works

- **No SSH needed**: Access via browser
- **Real-time status**: Shows current quota
- **Actionable**: Provides specific next steps
- **Already deployed**: Endpoints live after Railway redeploy

---

**Next Step**: Wait 2 minutes for Railway deployment, then visit diagnostics URL
