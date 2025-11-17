import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID'
];

const optionalEnvVars = {
  NODE_ENV: 'development',
  TWITTER_API_KEY: null,
  TWITTER_API_SECRET: null,
  TWITTER_BEARER_TOKEN: null,
  TWITTER_ACCESS_TOKEN: null,
  TWITTER_ACCESS_SECRET: null,
  LINKEDIN_CLIENT_ID: null,
  LINKEDIN_CLIENT_SECRET: null,
  LINKEDIN_ACCESS_TOKEN: null,
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_MAX_DAILY_COST: '2.00',
  POLLING_CRON_SCHEDULE: '*/30 * * * *',
  POLLING_PLATFORMS: 'twitter,linkedin',
  POLLING_INTERVAL_MINUTES: '30',
  MIN_NOTIFICATION_SCORE: '8',
  ENABLE_AI_ANALYSIS: 'true',
  AI_MIN_SCORE_THRESHOLD: '5',
  LOG_LEVEL: 'info',
  LOG_FILE_PATH: 'logs/app.log',
  PORT: '3000'
};

function validateEnv() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file against .env.example'
    );
  }
}

function getEnv(key, defaultValue = null) {
  return process.env[key] || defaultValue;
}

function getEnvInt(key, defaultValue) {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer`);
  }
  return parsed;
}

validateEnv();

const config = {
  nodeEnv: getEnv('NODE_ENV', optionalEnvVars.NODE_ENV),
  port: getEnvInt('PORT', parseInt(optionalEnvVars.PORT, 10)),
  
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  twitter: {
    apiKey: getEnv('TWITTER_API_KEY', optionalEnvVars.TWITTER_API_KEY),
    apiSecret: getEnv('TWITTER_API_SECRET', optionalEnvVars.TWITTER_API_SECRET),
    bearerToken: getEnv('TWITTER_BEARER_TOKEN', optionalEnvVars.TWITTER_BEARER_TOKEN),
    accessToken: getEnv('TWITTER_ACCESS_TOKEN', optionalEnvVars.TWITTER_ACCESS_TOKEN),
    accessSecret: getEnv('TWITTER_ACCESS_SECRET', optionalEnvVars.TWITTER_ACCESS_SECRET)
  },

  linkedin: {
    clientId: getEnv('LINKEDIN_CLIENT_ID', optionalEnvVars.LINKEDIN_CLIENT_ID),
    clientSecret: getEnv('LINKEDIN_CLIENT_SECRET', optionalEnvVars.LINKEDIN_CLIENT_SECRET),
    accessToken: getEnv('LINKEDIN_ACCESS_TOKEN', optionalEnvVars.LINKEDIN_ACCESS_TOKEN)
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: getEnv('OPENAI_MODEL', optionalEnvVars.OPENAI_MODEL),
    maxDailyCost: parseFloat(getEnv('OPENAI_MAX_DAILY_COST', optionalEnvVars.OPENAI_MAX_DAILY_COST))
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },
  
  polling: {
    cronSchedule: getEnv('POLLING_CRON_SCHEDULE', optionalEnvVars.POLLING_CRON_SCHEDULE),
    intervalMinutes: getEnvInt('POLLING_INTERVAL_MINUTES', parseInt(optionalEnvVars.POLLING_INTERVAL_MINUTES, 10)),
    platforms: getEnv('POLLING_PLATFORMS', optionalEnvVars.POLLING_PLATFORMS).split(',').map(p => p.trim())
  },

  scoring: {
    notificationMinScore: getEnvInt('MIN_NOTIFICATION_SCORE', parseInt(optionalEnvVars.MIN_NOTIFICATION_SCORE, 10)),
    aiAnalysisMinScore: getEnvInt('AI_MIN_SCORE_THRESHOLD', parseInt(optionalEnvVars.AI_MIN_SCORE_THRESHOLD, 10)),
    enableAiAnalysis: getEnv('ENABLE_AI_ANALYSIS', optionalEnvVars.ENABLE_AI_ANALYSIS) === 'true'
  },
  
  logging: {
    level: getEnv('LOG_LEVEL', optionalEnvVars.LOG_LEVEL),
    filePath: getEnv('LOG_FILE_PATH', optionalEnvVars.LOG_FILE_PATH)
  }
};

export default config;
