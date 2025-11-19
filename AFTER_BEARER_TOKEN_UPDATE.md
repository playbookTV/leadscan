# After Bearer Token Update - What to Check

## What You Just Did

✅ Regenerated Bearer Token in Twitter Developer Portal
✅ Updated `TWITTER_BEARER_TOKEN` in Railway
✅ Railway is now redeploying (~2 minutes)

## What to Expect

Railway will redeploy automatically when you update environment variables.

### Timeline:
- **Now**: Railway detected env var change
- **+1 min**: Building new container
- **+2 min**: Deploying and starting app
- **+3 min**: Diagnostics run automatically on startup

## Check Logs After Deployment

1. Go to Railway dashboard
2. Click latest deployment
3. Look for the diagnostics section:

```
========================================
Running Twitter API diagnostics...
========================================
```

## Possible Outcomes

### ✅ Success - Bearer Token Fixed

**What you'll see**:
```
Twitter authentication successful {
  "username": "your_bot_username",
  "userId": "123456789"
}

Twitter API quota check {
  "tier": "FREE",
  "limit": 1,
  "remaining": 1,
  "reset": "2025-11-19T20:00:00.000Z"
}

✅ Twitter diagnostics complete { "status": "healthy" }
```

**Meaning**:
- ✅ Bearer Token is valid
- ✅ Authentication working
- ✅ Twitter API quota available
- ✅ Searches should work at next hourly cycle

**Next Steps**:
- Wait for next polling cycle (top of hour)
- Check logs for "Twitter search completed"
- Look for leads found

---

### ❌ Still Getting 429 Rate Limit

**What you'll see**:
```
Twitter authentication successful { ... }

❌ Twitter rate limit exhausted at startup {
  "code": 429,
  "error": "Too Many Requests"
}

❌ CRITICAL: Twitter searches will fail
⚠️  IMMEDIATE ACTION REQUIRED: Enable Reddit
```

**Meaning**:
- ✅ Bearer Token is valid (authentication worked)
- ❌ Monthly cap exhausted (500k tweets used)
- ❌ All searches will fail until December 1st

**Next Steps**:
- Enable Reddit immediately (30 minutes)
- Wait for Twitter quota reset (December 1st)
- Compare Reddit vs Twitter performance

---

### ❌ Still Getting 403 Forbidden

**What you'll see**:
```
❌ Twitter authentication failed {
  "error": "Request failed with code 403",
  "code": 403
}
```

**Meaning**:
- ❌ App is suspended by Twitter
- ❌ App doesn't have required permissions
- ❌ Account-level restriction

**Next Steps**:
1. Check Twitter Developer Portal for suspension notice
2. Look for red warnings or alerts
3. Verify app status shows "Active" not "Suspended"
4. If suspended: Create new Twitter app OR contact Twitter support
5. If not suspended: Enable Reddit while investigating

---

### ❌ Still Getting 401 Unauthorized

**What you'll see**:
```
❌ Twitter authentication failed {
  "error": "Unauthorized",
  "code": 401
}
```

**Meaning**:
- ❌ Bearer Token is invalid
- ❌ Copy/paste error when updating Railway
- ❌ Token not fully regenerated

**Next Steps**:
1. Go back to Twitter Developer Portal
2. Regenerate Bearer Token again
3. **Copy entire token** (very long string)
4. Update Railway variable again
5. Ensure no extra spaces or line breaks

---

## If Twitter Still Not Working

### Immediate Solution: Enable Reddit

**Why Reddit**:
- ✅ Free forever (no monthly caps)
- ✅ 100 requests/minute (vs Twitter 1/15min)
- ✅ Higher quality leads (budgets, timelines)
- ✅ No authentication issues
- ✅ Works while you debug Twitter

**How to Enable** (30 minutes):
1. Follow [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
2. Create Reddit app at: https://www.reddit.com/prefs/apps
3. Add credentials to Railway
4. Leads flowing within 1 hour

### Long-Term Twitter Options

| Issue | Solution | Time | Cost |
|-------|----------|------|------|
| **Monthly cap hit** | Wait for Dec 1 reset | 12 days | $0 |
| **App suspended** | Create new Twitter app | 1 hour | $0 |
| **Need more quota** | Upgrade to Basic tier | Immediate | $200/mo |
| **Too restrictive** | Use Reddit only | 30 min | $0 |

## Expected Log Pattern (Success)

```
Starting Container
🚀 Starting Ovalay Lead Finder
Initializing database connection...
Database connection test successful
Initializing Twitter client...
Twitter API client initialized successfully
...
========================================
Running Twitter API diagnostics...
========================================
Running startup diagnostics...
Twitter authentication successful { "username": "...", "userId": "..." }
Twitter API quota check { "tier": "FREE", "limit": 1, "remaining": 1 }
✅ Twitter diagnostics complete { "tier": "FREE", "status": "healthy" }
========================================
Diagnostics complete. Check logs above for Twitter quota status.
========================================
Starting cron scheduler
...
Express API server listening on port 8080
Running initial polling cycle...
Processing keywords for optimization
Keyword optimization complete { "optimized": 1 }
Starting Twitter polling with optimized keywords
✅ Twitter search completed successfully
Twitter polling completed { "totalLeads": X }
✅ Application started successfully
```

## Common Issues After Token Update

### Issue: "Cannot read properties of undefined"

**Cause**: Railway hasn't restarted with new token yet

**Solution**: Wait 2 minutes for deployment to complete

---

### Issue: Logs show old Bearer Token error

**Cause**: Looking at old deployment logs

**Solution**:
1. Click "Deployments" tab in Railway
2. Select the LATEST deployment (top of list)
3. Check those logs

---

### Issue: No diagnostics section in logs

**Cause**:
- Deployment still in progress
- Twitter service failed to initialize

**Solution**:
1. Wait for deployment to complete
2. Look for "Twitter API client initialized successfully"
3. If missing, check Railway env vars are saved

---

## Verification Checklist

After Railway redeploys, verify:

- [ ] Deployment shows "Deployed" status (not "Building")
- [ ] Logs show "🚀 Starting Ovalay Lead Finder"
- [ ] Logs show "========================================\nRunning Twitter API diagnostics..."
- [ ] Diagnostics section shows result (✅ success or ❌ error)
- [ ] If success: "Twitter authentication successful"
- [ ] If success: "Twitter API quota check" with quota info
- [ ] If error: Clear error code (403, 401, 429, etc.)

## Next Steps Based on Results

### If Twitter Working (✅):
1. Wait for next polling cycle (top of hour)
2. Monitor logs for "Twitter search completed"
3. Check for leads found
4. Verify Telegram notifications if score ≥8

### If Twitter Still Blocked (❌):
1. Note the error code from logs
2. Follow troubleshooting for that specific error
3. Enable Reddit immediately (don't wait)
4. Decide Twitter upgrade vs Reddit-only strategy

## API Endpoint Check (Alternative)

If you prefer JSON output over logs:

```
https://your-railway-url.up.railway.app/api/diagnostics/twitter-quota
```

This shows the same diagnostics in structured JSON format.

---

**Document Created**: 2025-11-19
**Purpose**: Guide for interpreting results after Bearer Token update
**Next Check**: ~3 minutes from now (after Railway redeploy completes)
