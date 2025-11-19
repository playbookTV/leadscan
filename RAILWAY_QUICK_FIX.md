# Railway Quick Fix - Twitter FREE Tier

## Step-by-Step Instructions

### 1. Go to Railway Dashboard
**URL**: https://railway.app/

### 2. Select Your Project
Click on `leadscoutapi-production`

### 3. Click "Variables" Tab
Look for the tab that says "Variables" or "Environment Variables"

### 4. Update These 4 Variables

Find each variable and change its value:

#### Variable 1: POLLING_CRON_SCHEDULE
```
Current: */30 * * * *  OR  */1 * * * *
Change to: 0 */1 * * *

IMPORTANT: Note the "0" at the start - this means "at minute 0 of every hour"
- WRONG: */1 * * * * (runs every MINUTE)
- RIGHT:  0 */1 * * * (runs every HOUR)
```

#### Variable 2: POLLING_INTERVAL_MINUTES
```
Current: 30
Change to: 60
```

#### Variable 3: TWITTER_MAX_KEYWORDS_PER_CYCLE
```
Current: 3
Change to: 1
```

#### Variable 4: POLLING_PLATFORMS
```
Current: twitter,reddit  OR  twitter
Change to: twitter
```

### 5. Save Changes
Click "Save" or "Update" button

### 6. Wait for Redeployment
Railway will automatically redeploy (takes ~2 minutes)

You'll see:
```
Building...
Deploying...
Deployed ✓
```

### 7. Verify in Logs

After deployment, check the logs. You should see:

```
Configuration loaded {"platforms":["twitter"]}
Keyword optimization complete {"optimized":1,"reduction":"99%"}
```

### 8. Wait for Next Poll

The system will poll at the top of each hour:
- If current time is 14:30 → Next poll at 15:00
- If current time is 14:55 → Next poll at 15:00

### 9. Check for Success

In the logs, you should see (after the next hour):

```
✅ Twitter search completed
✅ Twitter polling completed {"totalLeads": X}
✅ Polling cycle completed successfully
```

**NO MORE** rate limit errors! 🎉

---

## Quick Reference Card

**Copy this for Railway dashboard:**

```bash
POLLING_CRON_SCHEDULE=0 */1 * * *
POLLING_INTERVAL_MINUTES=60
TWITTER_MAX_KEYWORDS_PER_CYCLE=1
POLLING_PLATFORMS=twitter
```

---

## Expected Timeline

| Time | Action |
|------|--------|
| **Now** | Update Railway variables (2 minutes) |
| **+2 min** | Railway redeploys (automatic) |
| **+5 min** | App restarts with new config |
| **Next hour** | First successful Twitter search |
| **+1 day** | 24 successful searches, 5-15 leads found |

---

## What This Achieves

✅ Stays within Twitter FREE tier limit (1 request per 15 minutes)
✅ No more rate limit errors
✅ Successful searches every hour
✅ 24 different keywords per day (rotation)
✅ 5-15 leads per day expected
✅ $0 cost

---

**Time Required**: 5 minutes
**Expected Result**: Working Twitter lead discovery within 1 hour
