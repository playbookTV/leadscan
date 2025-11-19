import twitterClient from '../src/config/twitter.js';
import logger from '../src/utils/logger.js';

/**
 * Diagnostic script to check Twitter API quota and account status
 * Run: node scripts/check-twitter-quota.js
 */

async function checkTwitterQuota() {
  console.log('\n=== Twitter API Quota Diagnostic ===\n');

  try {
    // 1. Verify credentials
    console.log('1. Verifying credentials...');
    const client = await twitterClient.v2.me();
    console.log(`✅ Authenticated as: @${client.data.username} (ID: ${client.data.id})`);

    // 2. Check rate limit status for search endpoint
    console.log('\n2. Checking rate limit status for /tweets/search/recent...');
    const rateLimitStatus = await twitterClient.v2.get('tweets/search/recent', {
      query: 'test',
      max_results: 10
    }, {
      fullResponse: true
    });

    const headers = rateLimitStatus.headers;
    const rateLimit = {
      limit: headers['x-rate-limit-limit'],
      remaining: headers['x-rate-limit-remaining'],
      reset: new Date(headers['x-rate-limit-reset'] * 1000).toISOString()
    };

    console.log('Rate Limit Info:');
    console.log(`  - Limit: ${rateLimit.limit} requests per 15 minutes`);
    console.log(`  - Remaining: ${rateLimit.remaining} requests`);
    console.log(`  - Resets at: ${rateLimit.reset}`);

    if (rateLimit.remaining === '0') {
      console.log('\n⚠️  WARNING: Rate limit exhausted!');
      console.log(`   Next reset: ${rateLimit.reset}`);
    } else {
      console.log(`\n✅ ${rateLimit.remaining} requests available`);
    }

    // 3. Check for monthly cap headers
    console.log('\n3. Checking for monthly tweet cap...');
    const monthlyHeaders = {
      'x-app-limit-24hour-limit': headers['x-app-limit-24hour-limit'],
      'x-app-limit-24hour-remaining': headers['x-app-limit-24hour-remaining'],
      'x-app-limit-24hour-reset': headers['x-app-limit-24hour-reset']
    };

    if (monthlyHeaders['x-app-limit-24hour-limit']) {
      console.log('Monthly Cap Info:');
      console.log(`  - 24h Limit: ${monthlyHeaders['x-app-limit-24hour-limit']} tweets`);
      console.log(`  - 24h Remaining: ${monthlyHeaders['x-app-limit-24hour-remaining']} tweets`);
      console.log(`  - Resets at: ${new Date(monthlyHeaders['x-app-limit-24hour-reset'] * 1000).toISOString()}`);

      if (monthlyHeaders['x-app-limit-24hour-remaining'] === '0') {
        console.log('\n❌ CRITICAL: Monthly tweet cap exhausted!');
        console.log('   This is why all searches are failing.');
        console.log('   Cap resets on December 1st or upgrade to Basic tier.');
      }
    } else {
      console.log('No monthly cap headers found (may not be exposed in FREE tier)');
    }

    // 4. Try a minimal search to test
    console.log('\n4. Testing actual search...');
    try {
      const testSearch = await twitterClient.v2.search('developer', {
        max_results: 10
      });
      console.log(`✅ Search successful! Found ${testSearch.meta.result_count} results`);
    } catch (searchError) {
      if (searchError.code === 429) {
        console.log('❌ Search failed with 429 Rate Limit');
        console.log('   Error:', searchError.message);
        console.log('\n   This confirms account-level rate limiting.');
      } else {
        console.log('❌ Search failed:', searchError.message);
      }
    }

    // 5. Summary and recommendations
    console.log('\n=== Summary ===\n');

    if (rateLimit.limit === '1') {
      console.log('📊 Tier: FREE (1 request per 15 minutes)');
      console.log('💰 Cost: $0/month');
      console.log('📈 Upgrade to Basic: $200/month for 60 requests per 15 minutes');
    } else if (rateLimit.limit === '60') {
      console.log('📊 Tier: BASIC (60 requests per 15 minutes)');
      console.log('💰 Cost: $200/month');
    }

    console.log('\n=== Recommendations ===\n');

    if (rateLimit.remaining === '0') {
      console.log('1. Wait until rate limit resets:', rateLimit.reset);
      console.log('2. Consider enabling Reddit immediately (free, unlimited)');
      console.log('3. Keep Twitter as supplementary source');
    } else {
      console.log('1. Rate limits available, but searches still failing');
      console.log('2. Check Twitter Developer Portal: https://developer.x.com/en/portal/dashboard');
      console.log('3. Verify app not suspended or restricted');
      console.log('4. Enable Reddit as primary platform while investigating');
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);

    if (error.code === 401) {
      console.log('\nPossible causes:');
      console.log('- Invalid API credentials');
      console.log('- App access revoked');
      console.log('- Check Railway environment variables');
    } else if (error.code === 429) {
      console.log('\nCRITICAL: Rate limit exhausted at authentication level');
      console.log('This suggests monthly cap reached or account restricted.');
      console.log('\nImmediate action:');
      console.log('1. Check https://developer.x.com/en/portal/dashboard');
      console.log('2. View usage statistics and quota');
      console.log('3. Enable Reddit to restore lead discovery');
    } else {
      console.log('\nError details:', error);
    }
  }
}

// Run diagnostic
checkTwitterQuota().catch(error => {
  logger.error('Quota check failed', { error: error.message });
  process.exit(1);
});
