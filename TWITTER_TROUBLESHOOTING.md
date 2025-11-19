# Twitter API Troubleshooting - Current Status

## Current Situation

**Status**: ❌ Twitter searches failing with 429 errors on EVERY request
**Configuration**: ✅ Optimized (1 keyword/hour, polling every 60 minutes)
**Infrastructure**: ✅ Working (cron schedule valid, retry logic deployed)

## Latest Evidence (Railway Logs)

```
17:00:00 - Starting Twitter polling with optimized keywords {"optimizedCount":1}
17:00:00 - Twitter rate limit hit, retry 1/3 {"resetTime":"2025-11-19T17:15:00.000Z"}
17:00:01 - Twitter rate limit hit, retry 2/3
17:00:03 - Twitter rate limit hit, retry 3/3
17:00:03 - Twitter search failed

18:00:01 - Starting Twitter polling with optimized keywords {"optimizedCount":1}
18:00:01 - Twitter rate limit hit, retry 1/3 {"resetTime":"2025-11-19T18:15:01.000Z"}
18:00:02 - Twitter rate limit hit, retry 2/3
18:00:04 - Twitter rate limit hit, retry 3/3
18:00:04 - Twitter search failed
```

**Analysis**:
- ✅ Polling every hour (17:00, 18:00) as configured
- ✅ Only 1 keyword per cycle
- ❌ **EVERY** API call returns 429 immediately
- ❌ Reset times show 15-minute windows, but quota never refills

## Root Cause: Account-Level Rate Limiting

This pattern indicates **monthly tweet cap exhaustion** or **account restriction**, NOT endpoint-level limits.

### Why Endpoint Limits Aren't the Issue

FREE tier allows:
- **1 request per 15 minutes** (4 per hour)
- You're making **1 request per hour**
- Math: 1 < 4, so endpoint limit should NOT be hit

### Why It's Monthly Cap

FREE tier also has:
- **500,000 tweets per month** cap
- Once hit, ALL requests return 429 until month resets (December 1st)
- This matches your symptoms: immediate 429 regardless of timing

## Diagnostic Steps

### Step 1: Check Twitter Quota (Via API - Easiest)

**No SSH access needed!** Access diagnostics from your browser:

```
https://your-railway-app.up.railway.app/api/diagnostics/twitter-quota
```

Replace `your-railway-app.up.railway.app` with your actual Railway deployment URL.

This will show:
- Exact rate limit remaining
- Monthly cap status
- Account tier confirmation (FREE, BASIC, PRO)
- Specific recommendations

**See**: [DIAGNOSTICS_API.md](DIAGNOSTICS_API.md) for complete API documentation

### Step 1b: Run Quota Check Script (Local Only)

If running locally:
```bash
cd apps/api
node scripts/check-twitter-quota.js
```

### Step 2: Check Twitter Developer Portal

1. Visit: https://developer.x.com/en/portal/dashboard
2. Select your app/project
3. Go to **Usage** tab
4. Check:
   - **Monthly tweet consumption** (if at 500k, you're blocked until Dec 1)
   - **Daily API calls** (should show request counts)
   - **Account status** (ensure not suspended)

### Step 3: Verify API Credentials

In Railway dashboard, confirm these are set correctly:
- `TWITTER_BEARER_TOKEN`
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_SECRET`

## Possible Outcomes

### Outcome A: Monthly Cap Exhausted (Most Likely)

**Evidence**:
- Quota check shows 0 tweets remaining
- Developer Portal shows 500k/500k used

**Solution**:
- **Wait until December 1st** for monthly reset
- **Enable Reddit immediately** (code ready, 30-minute setup)
- Keep Twitter as supplementary source starting Dec 1

**Action Plan**:
1. Enable Reddit today → [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
2. Wait for Twitter reset (Dec 1)
3. Verify Twitter working again in December

### Outcome B: Account Suspended/Restricted

**Evidence**:
- Quota check fails with 401 Unauthorized
- Developer Portal shows app suspended

**Solution**:
- Contact Twitter Support
- Review Terms of Service violations
- **Enable Reddit immediately** as replacement

### Outcome C: Configuration Issue

**Evidence**:
- Quota check shows requests available
- No monthly cap hit
- But searches still fail

**Solution**:
- Verify bearer token vs OAuth 1.0a credentials
- Check app permissions in Developer Portal
- Regenerate API keys

### Outcome D: Twitter API Degradation

**Evidence**:
- Quota available but all searches return 429
- Status page shows issues: https://api.twitterstat.us/

**Solution**:
- Wait for Twitter to resolve
- Enable Reddit as backup

## Immediate Action: Enable Reddit

**Why**:
- ✅ Free forever (no monthly caps)
- ✅ 100 requests per minute (600x faster than Twitter FREE)
- ✅ Better lead quality (budgets, timelines included)
- ✅ Code already implemented and tested
- ✅ 30-minute setup time

**How**:
1. Follow [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
2. Create Reddit app at: https://www.reddit.com/prefs/apps
3. Add credentials to Railway:
   ```bash
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USERNAME=your_username
   REDDIT_PASSWORD=your_password
   REDDIT_USER_AGENT=LeadScout/1.0 by /u/your_username
   ```
4. Update platform config:
   ```bash
   POLLING_PLATFORMS=reddit,twitter
   ```
5. Run migration: [apps/api/database/migrations/add_reddit_platform.sql](apps/api/database/migrations/add_reddit_platform.sql)

**Expected Result**: Lead discovery restored within 1 hour

## Long-Term Strategy

### December 2025 (After Twitter Reset)

If Twitter quota resets on Dec 1:
1. Verify searches work again
2. Compare Reddit vs Twitter lead quality
3. Decide platform mix:
   - **Primary**: Reddit (free, unlimited)
   - **Secondary**: Twitter FREE (1 keyword/hour, supplementary)

### Upgrade Decision Matrix

| Monthly Leads Found | Action |
|---------------------|--------|
| Reddit: 50+ quality leads | Keep both FREE, no upgrade needed |
| Reddit: 20-50 leads | Monitor, consider Twitter Basic if more volume needed |
| Reddit: <20 leads | Upgrade Twitter to Basic ($200/mo) for 60 req/15min |

## Cost-Benefit Analysis

### Option A: Reddit Only (FREE)
- **Cost**: $0
- **Leads/day**: 5-15 (estimated)
- **Quality**: High (budgets, timelines, contact info)
- **Risk**: None

### Option B: Reddit + Twitter FREE
- **Cost**: $0
- **Leads/day**: 8-20 (estimated)
- **Quality**: Mixed (Reddit high, Twitter medium)
- **Risk**: Twitter monthly cap exhaustion

### Option C: Reddit + Twitter Basic
- **Cost**: $200/month ($2,400/year)
- **Leads/day**: 20-50 (estimated)
- **Quality**: Mixed
- **ROI**: Need 0.5 clients/year at $5k each to break even

**Recommendation**: Start with **Option A** (Reddit only), evaluate for 2 weeks, then decide if Twitter upgrade worth it.

## Summary

### What's Working ✅
- Cron schedule fixed (hourly polling)
- 1 keyword per cycle
- Retry logic and Telegram auto-reconnect deployed
- Polling infrastructure solid

### What's Not Working ❌
- Twitter API returns 429 on EVERY request
- Likely monthly cap exhausted (500k tweets)
- Won't reset until December 1st

### Next Steps (In Priority Order)

1. **Today (30 minutes)**:
   - Run `node scripts/check-twitter-quota.js`
   - Check Twitter Developer Portal quota
   - Enable Reddit following [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)

2. **This Week**:
   - Monitor Reddit lead quality
   - Adjust keyword strategy for Reddit
   - Wait for Twitter quota diagnosis

3. **December 1st**:
   - Test if Twitter quota reset
   - Compare Reddit vs Twitter performance
   - Decide long-term platform strategy

## Quick Reference

**Twitter Developer Portal**: https://developer.x.com/en/portal/dashboard
**Twitter API Status**: https://api.twitterstat.us/
**Reddit Setup Guide**: [REDDIT_SETUP_GUIDE.md](REDDIT_SETUP_GUIDE.md)
**Quota Check Script**: `node scripts/check-twitter-quota.js`

---

**Document Status**: Ready for Action
**Priority**: HIGH - Enable Reddit today to restore lead discovery
**Expected Resolution**: Within 24 hours (with Reddit enabled)
