# Railway Deployment Guide - Leadscout Monorepo

## Architecture Overview

Leadscout deploys as **two separate Railway services** in one project:

1. **Backend API Service** - Node.js Express server (apps/api)
2. **Frontend Dashboard Service** - Static React app (apps/web)

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with the Leadscout code
- Supabase database (https://supabase.com)
- API keys:
  - Twitter API credentials
  - OpenAI API key
  - Telegram Bot token

## Step 1: Prepare Your Repository

```bash
cd /home/dsgn_api/Leadscout

# Initialize git if not already done
git init
git add .
git commit -m "Initial Leadscout monorepo setup"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/leadscout.git
git branch -M main
git push -u origin main
```

## Step 2: Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub account
4. Select your Leadscout repository
5. **Don't deploy yet** - we need to configure two separate services

## Step 3: Deploy Backend API (Service 1)

### In Railway Dashboard:

1. Click "New Service" → "GitHub Repo"
2. **Service Settings**:
   - Service Name: `leadscout-api`
   - Root Directory: `apps/api`
   - Branch: `main`

3. **Environment Variables** - Click on the service and go to "Variables" tab:
   ```env
   # Node Environment
   NODE_ENV=production
   PORT=3000

   # Supabase
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

   # Twitter
   TWITTER_API_KEY=xxx
   TWITTER_API_SECRET=xxx
   TWITTER_BEARER_TOKEN=xxx
   TWITTER_ACCESS_TOKEN=xxx-xxx
   TWITTER_ACCESS_SECRET=xxx

   # LinkedIn
   LINKEDIN_CLIENT_ID=xxx
   LINKEDIN_CLIENT_SECRET=xxx
   LINKEDIN_ACCESS_TOKEN=xxx

   # OpenAI
   OPENAI_API_KEY=sk-proj-xxx
   OPENAI_MAX_DAILY_COST=2.00
   OPENAI_MODEL=gpt-4o-mini

   # Telegram
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF
   TELEGRAM_CHAT_ID=123456789

   # App Configuration
   POLLING_INTERVAL_MINUTES=30
   MIN_NOTIFICATION_SCORE=8
   ENABLE_AI_ANALYSIS=true
   AI_MIN_SCORE_THRESHOLD=5

   # CORS (update after frontend deploys)
   FRONTEND_URL=https://your-frontend-url.railway.app
   ```

4. Click **Deploy**

5. Once deployed, Railway will provide a URL like:
   ```
   https://leadscout-api-production.up.railway.app
   ```
   **Copy this URL** - you'll need it for the frontend configuration

## Step 4: Deploy Frontend Dashboard (Service 2)

### In Same Railway Project:

1. Click "New Service" → "GitHub Repo" (same repository)
2. **Service Settings**:
   - Service Name: `leadscout-web`
   - Root Directory: `apps/web`
   - Branch: `main`

3. **Environment Variables**:
   ```env
   VITE_API_URL=https://leadscout-api-production.up.railway.app
   ```
   (Use the API URL from Step 3.5)

4. Click **Deploy**

5. Once deployed, Railway will provide a URL like:
   ```
   https://leadscout-web-production.up.railway.app
   ```
   **Copy this URL**

## Step 5: Update CORS Configuration

1. Go back to the **Backend Service** (`leadscout-api`)
2. Update the environment variable:
   ```env
   FRONTEND_URL=https://leadscout-web-production.up.railway.app
   ```
   (Use the frontend URL from Step 4.5)

3. The service will **automatically redeploy** with the updated configuration

## Step 6: Verify Deployment

### Test Backend API:

```bash
# Check health endpoint
curl https://leadscout-api-production.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T12:00:00.000Z"}

# Check analytics endpoint
curl https://leadscout-api-production.up.railway.app/api/analytics/overview

# Should return analytics data (or empty array if no data yet)
```

### Test Frontend:

1. Visit `https://leadscout-web-production.up.railway.app`
2. You should see the Leadscout dashboard
3. Navigate to different pages (Leads, Keywords, Analytics)
4. Verify data loads correctly from the API

## Troubleshooting

### Backend Service Not Starting

**Check logs in Railway:**
1. Click on the backend service
2. Go to "Deployments" tab
3. Click on the latest deployment
4. View logs for errors

**Common issues:**
- Missing environment variables
- Supabase connection errors
- Port binding issues

**Solutions:**
- Verify all required env vars are set
- Check Supabase allows connections from Railway IPs
- Ensure PORT env var is set to 3000

### Frontend Shows API Connection Errors

**Check browser console:**
- Press F12 in browser
- Look for CORS errors or 404s

**Common issues:**
- Wrong VITE_API_URL
- CORS not configured properly
- API service is down

**Solutions:**
- Verify VITE_API_URL matches backend URL
- Ensure FRONTEND_URL is set correctly in backend
- Check backend service is running

### Build Failures

**Check build logs:**
1. Click on the service with issues
2. View deployment logs during build phase

**Common issues:**
- pnpm lock file not committed
- Missing dependencies
- TypeScript errors

**Solutions:**
```bash
# Ensure lock file is committed
pnpm install
git add pnpm-lock.yaml
git commit -m "Add pnpm lock file"
git push

# Fix TypeScript errors locally first
cd apps/web
pnpm build
```

## Monitoring & Logs

### View Service Metrics

Railway provides built-in monitoring:

1. CPU usage
2. Memory usage
3. Network I/O
4. Request count

Access via: Service → Metrics tab

### View Logs

Real-time logs available:
- Service → Deployments → View Logs
- Logs persist for 7 days (free tier)

### Set Up Alerts (Optional)

1. Go to Project Settings
2. Add webhook for deployment status
3. Configure Slack/Discord notifications

## Database Migrations

When updating database schema:

1. Update schema in Supabase dashboard
2. Redeploy backend service
3. Monitor logs for connection issues

## Scaling

### Vertical Scaling

Upgrade service resources:
1. Service → Settings → Resources
2. Adjust CPU and RAM
3. Save changes (auto-redeploy)

### Horizontal Scaling

For production traffic:
1. Backend: Add more instances
2. Frontend: Already scales automatically (static hosting)

## Custom Domains

### Add Custom Domain

1. Service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed:
   ```
   Type: CNAME
   Name: api
   Value: leadscout-api-production.up.railway.app
   ```

### SSL Certificates

Railway provides automatic SSL via Let's Encrypt:
- No configuration needed
- Auto-renewal
- Works with custom domains

## Cost Estimation

### Railway Pricing (as of 2024)

**Hobby Plan** - $5/month:
- $5 monthly credit
- Up to 10 services
- Ideal for getting started

**Pro Plan** - $20/month:
- More resources
- Priority support
- Production ready

### Estimated Monthly Costs

- Backend API: ~$3-5/month
- Frontend: ~$1-2/month (mostly static)
- **Total: ~$5-7/month** (Hobby plan covers it)

## Backup & Recovery

### Database Backups

Supabase provides automatic backups:
- Daily backups (7 day retention)
- Point-in-time recovery (Pro plan)

### Code Backups

GitHub serves as code backup:
- All deployments linked to git commits
- Easy rollback via Railway dashboard

## Security Best Practices

1. **Never commit secrets**:
   - Use Railway environment variables
   - Keep .env files in .gitignore

2. **API Key Rotation**:
   - Rotate keys quarterly
   - Update via Railway variables (auto-redeploy)

3. **Access Control**:
   - Use Supabase Row Level Security
   - Implement rate limiting in API

4. **Monitoring**:
   - Watch for unusual API usage
   - Set up cost alerts for OpenAI

## Continuous Deployment

### Automatic Deployments

Railway auto-deploys on push to main:

```bash
# Make changes locally
git add .
git commit -m "Update feature X"
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Builds services
# 3. Deploys if successful
```

### Manual Deployments

To deploy a specific commit:
1. Service → Deployments
2. Click "Trigger Deployment"
3. Select commit or branch

### Rollback

To rollback to previous version:
1. Service → Deployments
2. Find working deployment
3. Click "Rollback to this deployment"

## Environment-Specific Configurations

### Development vs Production

**Local Development:**
```bash
# apps/api/.env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# apps/web/.env
VITE_API_URL=http://localhost:3000
```

**Production (Railway):**
- All configs via Railway environment variables
- No .env files in production

### Feature Flags

Use environment variables for feature toggles:
```env
ENABLE_AI_ANALYSIS=true
ENABLE_LINKEDIN_POLLING=false
```

## Support & Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Status Page**: https://status.railway.app
- **Support Email**: support@railway.app

## Next Steps

After successful deployment:

1. **Set up monitoring alerts** for service health
2. **Configure custom domains** for professional appearance
3. **Implement CI/CD pipeline** with GitHub Actions
4. **Add error tracking** (e.g., Sentry)
5. **Set up analytics** (e.g., Plausible, Umami)

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Supabase database schema created
- [ ] API keys obtained and tested
- [ ] CORS settings configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Rate limiting enabled
- [ ] Security headers added
- [ ] SSL certificates active
- [ ] Monitoring alerts set up
- [ ] Backup strategy in place
- [ ] Cost alerts configured

## Common Commands

```bash
# Check service status
curl https://your-api-url.railway.app/health

# Test API endpoints
curl https://your-api-url.railway.app/api/leads/stats/summary

# View recent deployments (Railway CLI)
railway status

# Connect to service logs (Railway CLI)
railway logs

# Set environment variable (Railway CLI)
railway variables set KEY=value
```

---

**Remember**: Railway makes deployment simple, but always test thoroughly before promoting to production. Happy deploying!