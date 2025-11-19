#!/usr/bin/env node

/**
 * Twitter API Diagnostic Script
 *
 * This script tests Twitter API access and provides detailed error information
 * to help diagnose rate limiting issues.
 *
 * Usage:
 *   node scripts/test-twitter-api.js
 *
 * Requires:
 *   - TWITTER_BEARER_TOKEN environment variable
 */

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testTwitterAPI() {
  logSection('Twitter API Diagnostic Tool');

  // Step 1: Check if bearer token exists
  log('Step 1: Checking environment variables...', 'blue');
  if (!BEARER_TOKEN) {
    log('❌ TWITTER_BEARER_TOKEN not found in environment', 'red');
    log('   Please set TWITTER_BEARER_TOKEN in your .env file', 'yellow');
    process.exit(1);
  }
  log('✅ TWITTER_BEARER_TOKEN found', 'green');
  log(`   Length: ${BEARER_TOKEN.length} characters`, 'blue');
  log(`   Prefix: ${BEARER_TOKEN.substring(0, 20)}...`, 'blue');

  // Step 2: Initialize Twitter client
  log('\nStep 2: Initializing Twitter API client...', 'blue');
  let client;
  try {
    client = new TwitterApi(BEARER_TOKEN);
    log('✅ Twitter client initialized', 'green');
  } catch (error) {
    log('❌ Failed to initialize Twitter client', 'red');
    log(`   Error: ${error.message}`, 'red');
    process.exit(1);
  }

  // Step 3: Test API access with minimal query
  logSection('Step 3: Testing API Access (Minimal Query)');
  log('Query: "hello" (should use ~10 tweets from quota)', 'blue');

  try {
    const result = await client.readOnly.v2.search('hello', {
      max_results: 10,
      'tweet.fields': ['created_at', 'author_id']
    });

    log('✅ API request successful!', 'green');

    // Display rate limit information
    log('\nRate Limit Information:', 'cyan');
    if (result.rateLimit) {
      const resetDate = new Date(result.rateLimit.reset * 1000);
      const resetIn = Math.round((resetDate - Date.now()) / 1000 / 60);

      console.log({
        limit: result.rateLimit.limit,
        remaining: result.rateLimit.remaining,
        used: result.rateLimit.limit - result.rateLimit.remaining,
        reset: resetDate.toISOString(),
        resetInMinutes: resetIn
      });

      // Calculate percentage used
      const percentUsed = ((result.rateLimit.limit - result.rateLimit.remaining) / result.rateLimit.limit * 100).toFixed(1);

      if (result.rateLimit.remaining === 0) {
        log(`\n⚠️  Rate limit exhausted (${percentUsed}% used)`, 'yellow');
        log(`   Resets in ${resetIn} minutes`, 'yellow');
      } else if (result.rateLimit.remaining < 50) {
        log(`\n⚠️  Rate limit low (${percentUsed}% used)`, 'yellow');
        log(`   ${result.rateLimit.remaining} requests remaining`, 'yellow');
      } else {
        log(`\n✅ Rate limit healthy (${percentUsed}% used)`, 'green');
        log(`   ${result.rateLimit.remaining} requests remaining`, 'green');
      }
    } else {
      log('⚠️  No rate limit information in response', 'yellow');
    }

    // Display results
    log('\nSearch Results:', 'cyan');
    const tweets = result.data?.data || [];
    console.log({
      tweetsReturned: tweets.length,
      meta: result.data?.meta
    });

    if (tweets.length > 0) {
      log(`\n✅ Successfully retrieved ${tweets.length} tweets`, 'green');
      log('\nSample Tweet:', 'cyan');
      const sample = tweets[0];
      console.log({
        id: sample.id,
        text: sample.text?.substring(0, 100) + '...',
        created_at: sample.created_at
      });
    } else {
      log('\n⚠️  No tweets returned (this is okay, just means no recent "hello" tweets)', 'yellow');
    }

  } catch (error) {
    log('❌ API request failed!', 'red');

    log('\nError Details:', 'cyan');
    console.log({
      code: error.code,
      message: error.message,
      type: error.type,
      title: error.title
    });

    // Check if it's a rate limit error
    if (error.code === 429) {
      log('\n⚠️  RATE LIMIT ERROR (429)', 'yellow');

      if (error.rateLimit) {
        const resetDate = new Date(error.rateLimit.reset * 1000);
        const resetIn = Math.round((resetDate - Date.now()) / 1000 / 60);

        log('\nRate Limit Info:', 'cyan');
        console.log({
          limit: error.rateLimit.limit,
          remaining: error.rateLimit.remaining,
          reset: resetDate.toISOString(),
          resetInMinutes: resetIn
        });

        // Analyze the rate limit situation
        if (error.rateLimit.remaining === 0 && resetIn < 15) {
          log('\n📊 Analysis: Endpoint rate limit exhausted', 'yellow');
          log(`   This is normal - limits reset every 15 minutes`, 'yellow');
          log(`   Wait ${resetIn} minutes and try again`, 'yellow');
        } else if (error.rateLimit.remaining === 0 && resetIn > 60) {
          log('\n📊 Analysis: Possible monthly quota exhaustion', 'yellow');
          log(`   Reset time is ${resetIn} minutes away (not typical 15-min pattern)`, 'yellow');
          log(`   This might indicate monthly tweet cap reached`, 'yellow');
        } else {
          log('\n📊 Analysis: Unusual rate limit pattern', 'yellow');
          log(`   Check Twitter Developer Portal for quota usage`, 'yellow');
        }
      } else {
        log('\n⚠️  No rate limit information available', 'yellow');
        log('   This might indicate a higher-level rate limit (app or account)', 'yellow');
      }

      // Additional error data
      if (error.data) {
        log('\nAdditional Error Data:', 'cyan');
        console.log(JSON.stringify(error.data, null, 2));
      }
    } else if (error.code === 403) {
      log('\n❌ FORBIDDEN ERROR (403)', 'red');
      log('   This usually means:', 'yellow');
      log('   - Invalid or expired credentials', 'yellow');
      log('   - App suspended or restricted', 'yellow');
      log('   - Insufficient permissions', 'yellow');
      log('\n   Check Twitter Developer Portal for account status', 'yellow');
    } else if (error.code === 401) {
      log('\n❌ UNAUTHORIZED ERROR (401)', 'red');
      log('   This means your bearer token is invalid', 'yellow');
      log('   - Check if token is correct in .env file', 'yellow');
      log('   - Regenerate token in Twitter Developer Portal', 'yellow');
    } else {
      log('\n❌ Unknown error type', 'red');
      log('   Full error object:', 'cyan');
      console.error(error);
    }

    process.exit(1);
  }

  // Step 4: Recommendations
  logSection('Recommendations');
  log('✅ Diagnosis complete!', 'green');
  log('\nNext steps:', 'cyan');
  log('1. Check Twitter Developer Portal:', 'blue');
  log('   https://developer.twitter.com/en/portal/dashboard', 'blue');
  log('2. Review monthly quota usage (500k tweets/month for free tier)', 'blue');
  log('3. Check for any account warnings or suspensions', 'blue');
  log('4. If quota exceeded, consider:', 'blue');
  log('   - Enable Reddit as alternative (free)', 'blue');
  log('   - Upgrade to Twitter Basic tier ($100/mo for 10M tweets)', 'blue');
  log('   - Wait until Dec 1 for quota reset', 'blue');

  logSection('Test Complete');
}

// Run the diagnostic
testTwitterAPI().catch(error => {
  log('\n❌ Unexpected error during diagnostic:', 'red');
  console.error(error);
  process.exit(1);
});
