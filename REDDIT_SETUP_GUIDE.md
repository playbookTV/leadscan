# Reddit API Setup Guide

Complete guide for setting up Reddit API credentials for Leadscout.

---

## Step 1: Create Reddit App

1. **Log in to Reddit** with the account you want to use for lead generation

2. **Go to Reddit Apps page**: https://www.reddit.com/prefs/apps

3. **Click "Create App" or "Create Another App"** (at the bottom)

4. **Fill in the form:**
   - **Name**: `Leadscout` (or any name you prefer)
   - **App Type**: Select **"script"** (important!)
   - **Description**: `Automated lead generation for Ovalay Studios`
   - **About URL**: Leave blank (optional)
   - **Redirect URI**: `https://leadscoutapi-production.up.railway.app/reddit/callback`
   - **Permissions**: Default is fine (read-only)

5. **Click "Create app"**

6. **Save your credentials:**
   - **Client ID**: The string under "personal use script" (looks like: `abc123XYZ456`)
   - **Client Secret**: The string next to "secret" (looks like: `def789ABC012-ghi345JKL678`)

---

## Step 2: Generate Refresh Token

You need a refresh token to authenticate the app. Use the **OAuth Helper Tool**:

### Option A: Online Tool (Easiest)

1. **Go to**: https://not-an-aardvark.github.io/reddit-oauth-helper/

2. **Fill in the form:**
   - **App type**: `Script app`
   - **Client ID**: Paste your client ID from Step 1
   - **Client Secret**: Paste your client secret from Step 1
   - **Username**: Your Reddit username
   - **Password**: Your Reddit password
   - **Scopes**: Leave default (read, submit, identity)

3. **Click "Generate tokens"**

4. **Copy the Refresh Token** (long string starting with something like `123456-abc...`)

### Option B: Manual Script (Advanced)

If the online tool doesn't work, create this script:

```bash
# In your project root
cd /Users/leslieisah/leadscan
```

Create `scripts/get-reddit-token.js`:

```javascript
import snoowrap from 'snoowrap';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getRefreshToken() {
  console.log('\n=== Reddit Refresh Token Generator ===\n');

  const clientId = await question('Enter Client ID: ');
  const clientSecret = await question('Enter Client Secret: ');
  const username = await question('Enter Reddit Username: ');
  const password = await question('Enter Reddit Password: ');

  try {
    const r = new snoowrap({
      userAgent: 'Leadscout/1.0 by /u/' + username,
      clientId: clientId,
      clientSecret: clientSecret,
      username: username,
      password: password
    });

    // Test connection
    const me = await r.getMe();

    console.log('\n✅ Authentication successful!');
    console.log(`Logged in as: u/${me.name}`);
    console.log(`Karma: ${me.link_karma + me.comment_karma}\n`);
    console.log('🔑 Your Refresh Token:');
    console.log(r.refreshToken);
    console.log('\nCopy this token and add it to your Railway environment variables.\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  rl.close();
}

getRefreshToken();
```

Run it:
```bash
node scripts/get-reddit-token.js
```

---

## Step 3: Add Credentials to Railway

1. **Go to Railway Dashboard**: https://railway.app/

2. **Select your project**: `leadscoutapi-production`

3. **Go to Variables tab**

4. **Add these environment variables:**

```bash
REDDIT_CLIENT_ID=abc123XYZ456
REDDIT_CLIENT_SECRET=def789ABC012-ghi345JKL678
REDDIT_REFRESH_TOKEN=123456-abc...your-long-refresh-token...xyz
REDDIT_USER_AGENT=Leadscout/1.0
```

5. **Update POLLING_PLATFORMS** (if not already set):
```bash
POLLING_PLATFORMS=twitter,reddit
```

6. **Click "Save"** - Railway will automatically redeploy

---

## Step 4: Run Database Migration

The database needs to allow 'reddit' as a platform value.

### Option A: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard

2. **Select your project**

3. **Go to SQL Editor**

4. **Run this migration:**

```sql
-- Drop existing CHECK constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_platform_check;

-- Add new CHECK constraint that includes 'reddit'
ALTER TABLE leads ADD CONSTRAINT leads_platform_check
  CHECK (platform IN ('twitter', 'linkedin', 'reddit'));

-- Verify constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
AND conname = 'leads_platform_check';
```

5. **Click "Run"**

6. **Verify output** shows the new constraint with all three platforms

### Option B: Using Migration File

The migration is already in the repo at:
```
apps/api/database/migrations/add_reddit_platform.sql
```

Execute it in your Supabase SQL editor.

---

## Step 5: Verify Integration

After Railway redeploys:

1. **Check deployment logs** in Railway:
   ```
   ✅ Reddit API client initialized successfully
   ✅ Reddit API connection test successful
   ```

2. **Check health endpoint**:
   ```bash
   curl https://leadscoutapi-production.up.railway.app/health
   ```

   Look for Reddit in the response.

3. **Wait 30 minutes** for first polling cycle, then check:
   ```bash
   curl https://leadscoutapi-production.up.railway.app/stats
   ```

   Should show Reddit leads being found.

---

## Important Notes

- **Refresh tokens don't expire** unless you revoke them or change your Reddit password
- **Rate limits**: 100 requests/minute (plenty for our 30-min polling cycle)
- **Subreddits monitored**: forhire, freelance, slavelabour, webdev, Entrepreneur, startups, Jobs4Bitcoins, hiring
- **Expected lead volume**: 20-40 leads/day from Reddit

---

## Troubleshooting

### "Reddit client not initialized"
- Check that all 4 environment variables are set in Railway
- Verify no typos in variable names
- Check Railway logs for specific error messages

### "Authentication failed"
- Refresh token might be invalid
- Regenerate refresh token using Step 2
- Make sure Reddit account password hasn't changed

### "No Reddit leads found"
- This is normal initially - subreddits may not have recent posts
- Check after 24 hours
- Verify keywords exist in database (default keywords are auto-created)

### "Rate limit exceeded"
- Should not happen with our settings (1 second delay between requests)
- Check Railway logs for excessive API calls
- Reddit allows 100 req/min, we use ~20-30 per 30-min cycle

---

## Security Best Practices

- ✅ Never commit credentials to git
- ✅ Keep refresh token secret (treat like a password)
- ✅ Use environment variables only
- ✅ Monitor API usage in Railway logs
- ✅ Revoke app access if credentials are compromised: https://www.reddit.com/prefs/apps

---

**Setup Complete!** 🎉

Your Leadscout system will now poll both Twitter and Reddit every 30 minutes for high-quality leads.
