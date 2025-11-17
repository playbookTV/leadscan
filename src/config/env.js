import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID'
];

const optionalEnvVars = {
  NODE_ENV: 'development',
  TWITTER_ACCESS_TOKEN: null,
  TWITTER_REFRESH_TOKEN: null,
  TWITTER_BEARER_TOKEN: null,
  LINKEDIN_ACCESS_TOKEN: null,
  LINKEDIN_REFRESH_TOKEN: null,
  OPENAI_MODEL: 'gpt-4',
  POLLING_CRON_SCHEDULE: '*/30 * * * *',
  POLLING_PLATFORMS: 'twitter,linkedin',
  NOTIFICATION_MIN_SCORE: '8',
  AI_ANALYSIS_MIN_SCORE: '5',
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
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY')
  },
  
  twitter: {
    clientId: getEnv('TWITTER_CLIENT_ID'),
    clientSecret: getEnv('TWITTER_CLIENT_SECRET'),
    accessToken: getEnv('TWITTER_ACCESS_TOKEN', optionalEnvVars.TWITTER_ACCESS_TOKEN),
    refreshToken: getEnv('TWITTER_REFRESH_TOKEN', optionalEnvVars.TWITTER_REFRESH_TOKEN),
    bearerToken: getEnv('TWITTER_BEARER_TOKEN', optionalEnvVars.TWITTER_BEARER_TOKEN)
  },
  
  linkedin: {
    clientId: getEnv('LINKEDIN_CLIENT_ID'),
    clientSecret: getEnv('LINKEDIN_CLIENT_SECRET'),
    accessToken: getEnv('LINKEDIN_ACCESS_TOKEN', optionalEnvVars.LINKEDIN_ACCESS_TOKEN),
    refreshToken: getEnv('LINKEDIN_REFRESH_TOKEN', optionalEnvVars.LINKEDIN_REFRESH_TOKEN)
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: getEnv('OPENAI_MODEL', optionalEnvVars.OPENAI_MODEL)
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },
  
  polling: {
    cronSchedule: getEnv('POLLING_CRON_SCHEDULE', optionalEnvVars.POLLING_CRON_SCHEDULE),
    platforms: getEnv('POLLING_PLATFORMS', optionalEnvVars.POLLING_PLATFORMS).split(',').map(p => p.trim())
  },
  
  scoring: {
    notificationMinScore: getEnvInt('NOTIFICATION_MIN_SCORE', parseInt(optionalEnvVars.NOTIFICATION_MIN_SCORE, 10)),
    aiAnalysisMinScore: getEnvInt('AI_ANALYSIS_MIN_SCORE', parseInt(optionalEnvVars.AI_ANALYSIS_MIN_SCORE, 10))
  },
  
  logging: {
    level: getEnv('LOG_LEVEL', optionalEnvVars.LOG_LEVEL),
    filePath: getEnv('LOG_FILE_PATH', optionalEnvVars.LOG_FILE_PATH)
  }
};

export default config;
