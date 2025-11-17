# Leadscout API

Backend service for the Leadscout lead generation system.

## Overview

This service handles:
- Automated polling of Twitter and LinkedIn for leads
- Lead scoring using regex patterns and AI analysis
- Real-time notifications via Telegram
- Database persistence with Supabase

## Setup

1. Copy `.env.example` to `.env`
2. Fill in all required API keys and tokens
3. Install dependencies: `pnpm install`
4. Run development server: `pnpm dev`

## Architecture

```
src/
├── index.js              # Entry point with cron scheduler
├── config/               # API client configurations
│   ├── database.js       # Supabase client
│   ├── env.js            # Environment validation
│   ├── twitter.js        # Twitter API setup
│   ├── linkedin.js       # LinkedIn API setup
│   └── openai.js         # OpenAI client
├── services/             # Core business logic
│   ├── polling.js        # Main polling orchestrator
│   ├── twitter-poller.js # Twitter-specific polling
│   ├── linkedin-poller.js# LinkedIn RSS polling
│   ├── lead-scorer.js    # Scoring algorithms
│   └── notifier.js       # Telegram notifications
└── utils/                # Shared utilities
    ├── logger.js         # Winston logger
    └── helpers.js        # Common functions
```

## Environment Variables

Required environment variables:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for backend operations
- `TWITTER_API_KEY` - Twitter API credentials
- `LINKEDIN_CLIENT_ID` - LinkedIn OAuth credentials
- `OPENAI_API_KEY` - OpenAI API key for lead analysis
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Target chat for notifications

## Development

```bash
# Run development server with hot reload
pnpm dev

# Run production server
pnpm start

# Run tests
pnpm test
```

## API Rate Limits

- Twitter: 450 requests per 15-min window
- LinkedIn: RSS feeds polled every 2 hours
- OpenAI: Max $2/day budget enforced
- Telegram: 30 messages/second per chat

## Scoring Algorithm

1. **Quick Score (0-10)**: Regex-based pattern matching
   - Budget mentioned: +3 points
   - Urgency signals: +2 points
   - Timeline: +1 point
   - Contact method: +2 points
   - Technology match: +1-2 points

2. **AI Analysis**: Only for quick_score ≥ 5
   - Uses GPT-4o-mini for cost efficiency
   - Extracts: budget, timeline, technologies, red flags
   - Returns refined score (0-5)

3. **Final Score**: Combination of quick + AI scores
   - Score ≥ 8 triggers Telegram notification