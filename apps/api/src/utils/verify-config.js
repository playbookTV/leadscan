import config from '../config/env.js';
import logger from './logger.js';

/**
 * Verify all required environment variables are configured
 * @returns {Object} Verification results with status and missing variables
 */
export function verifyConfiguration() {
  const results = {
    success: true,
    errors: [],
    warnings: [],
    info: []
  };

  // Critical required variables
  const criticalVars = {
    'Supabase URL': config.supabase.url,
    'Supabase Service Role Key': config.supabase.serviceRoleKey,
    'OpenAI API Key': config.openai.apiKey,
    'Telegram Bot Token': config.telegram.botToken,
    'Telegram Chat ID': config.telegram.chatId
  };

  // Check critical variables
  for (const [name, value] of Object.entries(criticalVars)) {
    if (!value) {
      results.success = false;
      results.errors.push(`Missing critical variable: ${name}`);
    }
  }

  // Optional platform variables
  const twitterConfigured = !!(
    config.twitter.apiKey &&
    config.twitter.apiSecret &&
    config.twitter.bearerToken &&
    config.twitter.accessToken &&
    config.twitter.accessSecret
  );

  const redditConfigured = !!(
    config.reddit.clientId &&
    config.reddit.clientSecret &&
    config.reddit.refreshToken
  );

  if (!twitterConfigured && !redditConfigured) {
    results.warnings.push('No social media platforms configured (Twitter or Reddit)');
  } else {
    if (twitterConfigured) {
      results.info.push('✅ Twitter API configured');
    } else {
      results.warnings.push('Twitter API not configured - Twitter polling disabled');
    }

    if (redditConfigured) {
      results.info.push('✅ Reddit API configured');
    } else {
      results.warnings.push('Reddit API not configured - Reddit polling disabled');
    }
  }

  // Check configuration values
  if (config.openai.maxDailyCost <= 0) {
    results.warnings.push('OpenAI max daily cost is 0 or negative - AI analysis may be disabled');
  }

  if (config.scoring.notificationMinScore < 0 || config.scoring.notificationMinScore > 10) {
    results.warnings.push(`Invalid notification score threshold: ${config.scoring.notificationMinScore} (should be 0-10)`);
  }

  if (config.polling.intervalMinutes < 1) {
    results.warnings.push('Polling interval is less than 1 minute - may cause rate limiting');
  }

  // Log summary
  if (results.success) {
    logger.info('✅ Configuration verification passed', {
      environment: config.nodeEnv,
      twitterEnabled: twitterConfigured,
      redditEnabled: redditConfigured,
      aiEnabled: config.scoring.enableAiAnalysis,
      pollingInterval: config.polling.intervalMinutes
    });
  } else {
    logger.error('❌ Configuration verification failed', {
      errors: results.errors,
      warnings: results.warnings
    });
  }

  return results;
}

/**
 * Print configuration verification results to console
 */
export function printConfigVerification() {
  console.log('\n=== Configuration Verification ===\n');

  const results = verifyConfiguration();

  // Print errors
  if (results.errors.length > 0) {
    console.log('❌ ERRORS (Critical - must be fixed):');
    results.errors.forEach(error => console.log(`   - ${error}`));
    console.log('');
  }

  // Print warnings
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS (Optional features may be disabled):');
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }

  // Print info
  if (results.info.length > 0) {
    console.log('ℹ️  INFO:');
    results.info.forEach(info => console.log(`   - ${info}`));
    console.log('');
  }

  // Print configuration summary
  console.log('📋 Configuration Summary:');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Polling Interval: ${config.polling.intervalMinutes} minutes`);
  console.log(`   Polling Platforms: ${config.polling.platforms.join(', ')}`);
  console.log(`   AI Analysis: ${config.scoring.enableAiAnalysis ? 'Enabled' : 'Disabled'}`);
  console.log(`   OpenAI Model: ${config.openai.model}`);
  console.log(`   Notification Threshold: Score >= ${config.scoring.notificationMinScore}`);
  console.log('');

  if (results.success) {
    console.log('✅ All critical configuration verified!\n');
  } else {
    console.log('❌ Configuration has critical errors. Please fix before deploying.\n');
    process.exit(1);
  }

  return results;
}

export default {
  verifyConfiguration,
  printConfigVerification
};
