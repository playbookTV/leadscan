#!/usr/bin/env node

/**
 * Test Twitter Bearer Token authentication
 *
 * Usage:
 *   node scripts/test-twitter-bearer-token.js
 *
 * Or with custom token:
 *   TWITTER_BEARER_TOKEN=your_token node scripts/test-twitter-bearer-token.js
 */

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const bearerToken = process.env.TWITTER_BEARER_TOKEN;

console.log('🔍 Testing Twitter Bearer Token Authentication\n');
console.log('━'.repeat(60));

if (!bearerToken) {
  console.error('❌ ERROR: TWITTER_BEARER_TOKEN not found in environment variables');
  console.log('\n💡 Add TWITTER_BEARER_TOKEN to apps/api/.env file');
  process.exit(1);
}

console.log('✅ Bearer Token found');
console.log(`   Token preview: ${bearerToken.substring(0, 20)}...${bearerToken.substring(bearerToken.length - 5)}`);
console.log(`   Token length: ${bearerToken.length} characters\n`);

console.log('━'.repeat(60));
console.log('📡 Testing Twitter API connection...\n');

// Create Twitter client with Bearer Token
const client = new TwitterApi(bearerToken);
const readOnlyClient = client.readOnly;

async function testAuthentication() {
  try {
    // Test 1: Simple search query
    console.log('Test 1: Performing test search query...');
    const searchResponse = await readOnlyClient.v2.search('test', {
      max_results: 10,
      'tweet.fields': ['created_at', 'author_id']
    });

    console.log('✅ Authentication successful!');
    console.log(`   Results found: ${searchResponse.meta?.result_count || 0}`);

    // Extract rate limit info
    if (searchResponse.rateLimit) {
      const rateLimit = searchResponse.rateLimit;
      const percentUsed = Math.round(((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100);

      console.log('\n📊 Rate Limit Status:');
      console.log(`   Limit: ${rateLimit.limit} requests per 15 minutes`);
      console.log(`   Remaining: ${rateLimit.remaining} requests`);
      console.log(`   Used: ${percentUsed}%`);
      console.log(`   Resets at: ${new Date(rateLimit.reset * 1000).toLocaleString()}`);

      // Determine tier
      let tier = 'UNKNOWN';
      if (rateLimit.limit === 1) {
        tier = 'FREE (1 request per 15 min)';
      } else if (rateLimit.limit === 60) {
        tier = 'BASIC ($100/month)';
      } else if (rateLimit.limit >= 300) {
        tier = 'PRO ($5,000/month)';
      }

      console.log(`   API Tier: ${tier}\n`);

      // Warnings
      if (rateLimit.limit === 1) {
        console.log('⚠️  WARNING: Free tier detected');
        console.log('   Recommendation: Set TWITTER_MAX_KEYWORDS_PER_CYCLE=1 in Railway');
      }

      if (rateLimit.remaining === 0) {
        console.log('⚠️  WARNING: Rate limit exhausted');
        console.log(`   Wait until: ${new Date(rateLimit.reset * 1000).toLocaleString()}`);
      }
    } else {
      console.log('\n⚠️  Rate limit info not available in response');
    }

    console.log('\n━'.repeat(60));
    console.log('✅ SUCCESS: Bearer Token is valid and working!\n');
    console.log('Next steps:');
    console.log('1. Update TWITTER_BEARER_TOKEN in Railway environment variables');
    console.log('2. Railway will auto-redeploy in ~2 minutes');
    console.log('3. Check Railway logs for: "Twitter authentication successful"');
    console.log('━'.repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR: Authentication failed\n');
    console.error(`Error code: ${error.code}`);
    console.error(`Error message: ${error.message}`);

    if (error.data) {
      console.error(`API response: ${JSON.stringify(error.data, null, 2)}`);
    }

    console.log('\n━'.repeat(60));
    console.log('🔧 TROUBLESHOOTING:\n');

    if (error.code === 403) {
      console.log('⚠️  403 Forbidden - Bearer Token is invalid or expired\n');
      console.log('Steps to fix:');
      console.log('1. Go to https://developer.twitter.com/en/portal/dashboard');
      console.log('2. Click your app → "Keys and tokens" tab');
      console.log('3. Under "Bearer Token", click "Regenerate"');
      console.log('4. Copy the new token (starts with AAAAAAAAAA...)');
      console.log('5. Update TWITTER_BEARER_TOKEN in apps/api/.env');
      console.log('6. Run this test script again to verify');
    } else if (error.code === 429) {
      console.log('⚠️  429 Rate Limit Exceeded\n');
      console.log('Your Twitter API quota is exhausted.');
      console.log('Wait for the rate limit to reset (15 minutes)');
      console.log('Or upgrade your Twitter API tier for higher limits.');
    } else if (error.code === 401) {
      console.log('⚠️  401 Unauthorized\n');
      console.log('Bearer Token format is invalid.');
      console.log('Make sure you copied the entire token correctly.');
    } else {
      console.log('Unknown error occurred.');
      console.log('Check Twitter API status: https://api.twitterstat.us/');
      console.log('Or review Twitter API docs: https://developer.twitter.com/en/docs');
    }

    console.log('\n━'.repeat(60));

    process.exit(1);
  }
}

// Run the test
testAuthentication();
