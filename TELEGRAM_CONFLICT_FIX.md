# Telegram Bot 409 Conflict - Fix Guide

## Error Description

```
Telegram polling error {
  "error": "ETELEGRAM: 409 Conflict: terminated by other getUpdates request;
           make sure that only one bot instance is running",
  "code": "ETELEGRAM"
}
```

## Root Cause

**Multiple instances of your Leadscout API are running simultaneously**, and they're all trying to poll the same Telegram bot. Telegram only allows **one active polling connection** per bot at a time.

## Common Scenarios

1. **Multiple Railway Deployments** - Old deployments still running alongside new ones
2. **Local + Production** - Your local dev server is running while Railway is also running
3. **Railway Scaling** - Railway auto-scaled to multiple instances (should be set to 1)
4. **Restart Loop** - App crashes and restarts repeatedly, creating overlapping instances

## Solutions

### Solution 1: Check Railway Deployments (Most Common)

**Step 1: View Active Deployments**
1. Go to Railway dashboard: https://railway.app
2. Select your `@leadscout/api` service
3. Click "Deployments" tab
4. Look for multiple "Active" or "Building" deployments

**Step 2: Stop Old Deployments**
1. For each OLD deployment (not the latest):
   - Click the three dots (⋮)
   - Select "Remove"
2. Keep only the **latest successful deployment** running

**Step 3: Set Replicas to 1**
1. In Railway service settings
2. Go to "Settings" tab
3. Under "Deploy", find "Replicas"
4. Set to **1** (not auto-scale)
5. Save changes

### Solution 2: Stop Local Development Server

If you're running the bot locally while Railway is also running:

**Check if local server is running:**
```bash
# Check for Node processes
ps aux | grep "node.*index.js"

# Or check port 3000
lsof -i :3000
```

**Stop local server:**
```bash
# Find the process ID (PID)
ps aux | grep "node.*src/index.js"

# Kill the process
kill -9 <PID>

# Or use pkill
pkill -f "node.*src/index.js"
```

**Best Practice:**
- **Production**: Only Railway should run
- **Development**: Stop Railway or use `TELEGRAM_USE_POLLING=false` locally

### Solution 3: Use Webhook Mode in Production (Recommended)

Webhook mode prevents conflicts because Telegram pushes updates to your server instead of polling.

**Step 1: Update Railway Environment Variables**
```bash
TELEGRAM_USE_POLLING=false
TELEGRAM_WEBHOOK_URL=https://your-app.railway.app/telegram/webhook
```

**Step 2: Deploy Changes**
Railway will auto-deploy with webhook mode enabled.

**Step 3: Set Telegram Webhook**
The app will automatically set the webhook on startup, but you can verify:

```bash
# Check webhook status
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

**Benefits:**
- ✅ No polling conflicts
- ✅ Instant notifications (no 1-2 second polling delay)
- ✅ Less resource usage
- ✅ Works with multiple Railway replicas

**Drawbacks:**
- ⚠️ Requires public HTTPS URL (Railway provides this automatically)
- ⚠️ More complex local development setup

### Solution 4: Disable Telegram in Local Development

If you want to run the API locally but avoid Telegram conflicts:

**Option A: Comment out Telegram initialization**

Edit `apps/api/src/index.js` (local only, don't commit):
```javascript
// Skip Telegram in local dev
if (process.env.NODE_ENV !== 'development') {
  await initializeTelegramBot();
  await testTelegramConnection();
}
```

**Option B: Use different bot token locally**

Create `apps/api/.env.local`:
```bash
# Use a separate bot for local dev
TELEGRAM_BOT_TOKEN=<your-dev-bot-token>
TELEGRAM_CHAT_ID=<your-dev-chat-id>
```

Then create a second bot via [@BotFather](https://t.me/botfather) for local testing.

## Verification Steps

After applying a fix, verify it worked:

**Step 1: Check Railway Logs**
```bash
railway logs --tail 100
```

**Look for:**
```
✅ Telegram bot initialized successfully
✅ Telegram bot connection test successful
```

**Should NOT see:**
```
❌ Telegram polling error { "code": "ETELEGRAM" }
❌ 409 Conflict
```

**Step 2: Test Telegram Notifications**

Trigger a test notification:
```bash
curl -X POST https://your-app.railway.app/api/poll/trigger
```

You should receive a Telegram message if a high-score lead is found.

## Technical Details

### Why This Happens

Telegram's `getUpdates` API (used for polling) can only have **one active connection** at a time. When a second instance tries to poll:

1. Telegram sends a `409 Conflict` response
2. The first instance's connection is terminated
3. Both instances fight for control, causing continuous errors
4. The bot becomes unreliable and may miss notifications

### Code Changes Made

The error handler now detects 409 conflicts and automatically stops polling:

**File:** `apps/api/src/config/telegram.js`
```javascript
// 409 Conflict = Another bot instance is running (don't retry)
if (error.code === 'ETELEGRAM' && error.message?.includes('409 Conflict')) {
  logger.error('🚨 CRITICAL: Multiple Telegram bot instances detected');
  await telegramBot.stopPolling({ cancel: true });
  return; // Don't attempt reconnection
}
```

This prevents infinite retry loops that waste resources.

## Recommended Production Setup

**Railway Environment Variables:**
```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>
TELEGRAM_USE_POLLING=false              # Use webhooks in production
TELEGRAM_WEBHOOK_URL=https://your-app.railway.app/telegram/webhook

# Ensure single instance
NODE_ENV=production
```

**Railway Service Settings:**
- **Replicas:** 1 (fixed, not auto-scale)
- **Health Check:** `/health` endpoint
- **Deploy on push:** Enabled (auto-deploy from GitHub)

## Still Having Issues?

### Check for Ghost Processes

Sometimes processes don't shut down cleanly:

```bash
# List all node processes
ps aux | grep node

# Kill all node processes (be careful!)
pkill -9 node

# Or kill specific process
kill -9 <PID>
```

### Verify Bot Token

Make sure you're using the correct bot token:

```bash
# Check bot info
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe

# Expected response:
# {"ok":true,"result":{"id":123456,"is_bot":true,"first_name":"Lead Scan",...}}
```

### Check Railway Replica Count

```bash
# Via Railway CLI
railway status

# Should show: 1/1 replicas running
```

If it shows `2/2` or more, scale down:
```bash
railway service scale --replicas 1
```

## Summary

**Most Common Fix:**
1. Go to Railway dashboard
2. Check "Deployments" tab
3. Remove all old/duplicate deployments
4. Keep only the latest one
5. Set "Replicas" to 1 in Settings

**Best Long-term Solution:**
1. Set `TELEGRAM_USE_POLLING=false` in Railway
2. Use webhook mode for production
3. Keep polling for local development only

---

**Related Files:**
- [apps/api/src/config/telegram.js](apps/api/src/config/telegram.js) - Telegram client configuration
- [apps/api/src/index.js](apps/api/src/index.js) - Service initialization
- [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) - Deployment guide
