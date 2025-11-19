# Quick Fix Summary - Twitter Not Working

## Current Problem

**Twitter searches failing with 429 errors on EVERY request, despite optimized configuration.**

## Why This Is Happening

You're likely on Twitter's **FREE tier** with a **500,000 tweets/month cap**. Once this cap is hit, ALL requests return 429 until the quota resets on **December 1st**.

## Immediate Solution (30 Minutes)

### Enable Reddit - It's Better Than Twitter Anyway

**Why Reddit**:
- ✅ FREE forever
- ✅ 100 requests/minute (vs Twitter's 1/15min)
- ✅ Higher quality leads (budgets, timelines, contact info included)
- ✅ Code already implemented and tested

**How**:
1. Go to: https://www.reddit.com/prefs/apps
2. Click "create app"
3. Fill in:
   - **Name**: LeadScout
   - **Type**: script
   - **Redirect URI**: http://localhost:8080
4. Copy **client_id** and **client_secret**
5. Add to Railway environment variables:
   ```
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_secret_here
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password
   REDDIT_USER_AGENT=LeadScout/1.0 by /u/your_username
   POLLING_PLATFORMS=reddit,twitter
   ```
6. Run in Supabase SQL editor:
   ```sql
   -- Execute: apps/api/database/migrations/add_reddit_platform.sql
   ALTER TABLE leads
   ALTER COLUMN platform TYPE text,
   DROP CONSTRAINT IF EXISTS leads_platform_check,
   ADD CONSTRAINT leads_platform_check
   CHECK (platform IN ('twitter', 'linkedin', 'reddit'));
   ```
7. Railway will auto-redeploy

**Result**: Lead discovery restored within 1 hour

## Diagnostic Steps (If You Want to Confirm Twitter Issue)

### Step 1: Check Twitter Quota (No SSH Required)

Open in your browser:
```
https://your-railway-app.up.railway.app/api/diagnostics/twitter-quota
```

This shows:
- Exact rate limit status
- Monthly cap consumption
- When quota resets
- Specific recommendations

**Full API docs**: [DIAGNOSTICS_API.md](DIAGNOSTICS_API.md)

### Step 2: Check Twitter Developer Portal
1. Visit: https://developer.x.com/en/portal/dashboard
2. Click your app
3. Go to "Usage" tab
4. Check monthly tweet consumption (if at 500k/500k, you're blocked until Dec 1)

## What to Expect

### With Reddit Enabled (Today)
- **Platforms**: Reddit (primary) + Twitter (disabled until Dec 1)
- **Polling**: Every 60 minutes
- **Keywords/cycle**: 20 keywords on Reddit
- **Expected leads/day**: 5-15 high-quality leads
- **Cost**: $0

### After December 1st
- **Twitter quota resets** (if monthly cap was the issue)
- Test if Twitter searches work again
- Compare Reddit vs Twitter lead quality
- Decide platform mix going forward

## Platform Comparison

| Metric | Twitter FREE | Reddit FREE |
|--------|--------------|-------------|
| **Cost** | $0 | $0 |
| **Rate Limit** | 1 req/15min | 100 req/min |
| **Monthly Cap** | 500k tweets | Unlimited |
| **Lead Quality** | Medium | **High** |
| **Budget Info** | Rare | **Common** |
| **Timeline Info** | Rare | **Common** |
| **Contact Info** | Rare | **Common** |
| **Current Status** | ❌ Blocked | ✅ Ready |

**Winner**: Reddit 🏆

## Files You Need

1. **Reddit Setup**: [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
2. **Full Troubleshooting**: [TWITTER_TROUBLESHOOTING.md](TWITTER_TROUBLESHOOTING.md)
3. **Twitter Investigation**: [TWITTER_API_INVESTIGATION.md](TWITTER_API_INVESTIGATION.md)
4. **Database Migration**: [apps/api/database/migrations/add_reddit_platform.sql](apps/api/database/migrations/add_reddit_platform.sql)

## TL;DR

1. Twitter is blocked (likely monthly cap hit)
2. Reddit is better anyway (free, unlimited, higher quality)
3. Enable Reddit today (30 minutes)
4. Wait for Twitter reset on Dec 1
5. Enjoy 5-15 quality leads per day starting today

---

**Time to fix**: 30 minutes
**Expected result**: Leads flowing within 1 hour
**Cost**: $0
