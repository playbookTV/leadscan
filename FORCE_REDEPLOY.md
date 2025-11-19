# Force Railway Redeploy - Deployment Stuck

## Problem
Railway deployment stuck on "Initializing" stage after updating Bearer Token.

## Solution: Force Redeploy

### Option 1: Trigger Redeploy via Git Push (Recommended)

Make a trivial change and push to trigger new deployment:

```bash
# In your terminal
cd /Users/leslieisah/leadscan

# Make a small change (add empty line to README)
echo "" >> README.md

# Commit and push
git add README.md
git commit -m "Trigger Railway redeploy"
git push
```

Railway will detect the new commit and start fresh deployment.

### Option 2: Manual Redeploy in Railway Dashboard

1. Go to Railway dashboard: https://railway.app/
2. Click your project: `leadscoutapi-production`
3. Click your service
4. Click "Deployments" tab
5. Find the stuck deployment
6. Click the **three dots (...)** menu
7. Click **"Redeploy"**

This forces Railway to restart the deployment from scratch.

### Option 3: Restart Service (If Deployed but Not Starting)

1. Go to Railway dashboard
2. Click your project
3. Click your service
4. Click "Settings" tab
5. Scroll down to "Danger Zone"
6. Click **"Restart Service"**

### Option 4: Cancel Stuck Deployment

If deployment is truly stuck (5+ minutes on "Initializing"):

1. Go to Railway dashboard
2. Click "Deployments" tab
3. Find the stuck deployment
4. Click **"Cancel"**
5. Then trigger new deployment via git push or manual redeploy

## Expected Timeline

After triggering redeploy:
- **+30 sec**: Railway starts building
- **+1 min**: Building container
- **+2 min**: Deploying
- **+2.5 min**: Starting
- **+3 min**: Running, logs available

## Check Deployment Status

Railway dashboard shows status:
- ⏳ **Initializing** - Starting up
- 🔨 **Building** - Creating container
- 🚀 **Deploying** - Pushing to production
- ✅ **Deployed** - Running successfully
- ❌ **Failed** - Something went wrong

## Common Causes of Stuck Deployments

1. **Environment variable validation** - Invalid Bearer Token format
2. **Build cache issues** - Railway reusing old cache
3. **Network timeouts** - Railway can't reach image registry
4. **Resource limits** - Not enough memory/CPU

## If Still Stuck After Redeploy

Try clearing build cache:

1. Railway dashboard → Settings
2. Scroll to "Build Configuration"
3. Enable "Clear build cache"
4. Trigger redeploy

---

**Next Step**: Choose Option 1 (git push) or Option 2 (manual redeploy)
**Time Required**: <1 minute to trigger
**Expected Result**: Fresh deployment in 3 minutes
