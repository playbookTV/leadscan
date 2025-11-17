# Lead Finder - Automated Lead Generation System

An intelligent lead generation system that monitors Twitter and LinkedIn 24/7 for web development project opportunities, automatically scoring and notifying you via Telegram when high-quality leads are discovered.

## Features

- **Multi-Platform Monitoring**: Automated polling of Twitter and LinkedIn every 30 minutes
- **Intelligent Scoring**: Two-stage lead scoring with regex-based quick scoring and AI-powered analysis
- **Instant Notifications**: Telegram alerts for high-quality leads (score ≥ 8)
- **Budget Detection**: Automatic extraction of budget ranges from posts
- **Deduplication**: Smart duplicate detection using post IDs and text similarity
- **Technology Matching**: Identifies mentioned technologies and project types
- **Performance Tracking**: Analytics on keyword performance and conversion rates

## Tech Stack

- **Runtime**: Node.js 20.x (ES Modules)
- **Database**: Supabase (PostgreSQL 15)
- **APIs**: Twitter API v2, LinkedIn API, OpenAI GPT-4, Telegram Bot API
- **Hosting**: Railway (planned)
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 20.0.0
- pnpm package manager
- Supabase account and project
- Twitter Developer account with API access
- LinkedIn Developer account (optional)
- OpenAI API key
- Telegram Bot created via BotFather
- PostgreSQL database (via Supabase)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/leadscout.git
cd leadscout
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- Supabase URL and Service Role Key
- Twitter API credentials
- LinkedIn OAuth tokens (optional)
- OpenAI API key
- Telegram Bot token and Chat ID

4. **Create database schema**

Run the SQL script in your Supabase SQL editor:
```bash
# Copy contents of database/schema.sql to Supabase SQL editor
# This creates all required tables, indexes, and seed data
```

5. **Verify installation**
```bash
# Test the application
node src/index.js
```

You should see:
- "Starting Ovalay Lead Finder"
- "Database connection successful"
- "Application started successfully"

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | Yes | Your Supabase project URL | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key | - |
| `TWITTER_API_KEY` | No* | Twitter API key | - |
| `TWITTER_API_SECRET` | No* | Twitter API secret | - |
| `TWITTER_BEARER_TOKEN` | No* | Twitter Bearer token | - |
| `TWITTER_ACCESS_TOKEN` | No* | Twitter access token | - |
| `TWITTER_ACCESS_SECRET` | No* | Twitter access secret | - |
| `LINKEDIN_CLIENT_ID` | No* | LinkedIn client ID | - |
| `LINKEDIN_CLIENT_SECRET` | No* | LinkedIn client secret | - |
| `LINKEDIN_ACCESS_TOKEN` | No* | LinkedIn access token | - |
| `OPENAI_API_KEY` | Yes | OpenAI API key | - |
| `OPENAI_MAX_DAILY_COST` | No | Maximum daily OpenAI spend | 2.00 |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token | - |
| `TELEGRAM_CHAT_ID` | Yes | Telegram chat ID for notifications | - |
| `POLLING_INTERVAL_MINUTES` | No | Polling frequency in minutes | 30 |
| `MIN_NOTIFICATION_SCORE` | No | Minimum score for Telegram alerts | 8 |
| `AI_MIN_SCORE_THRESHOLD` | No | Minimum score for AI analysis | 5 |

*Required for the respective platform polling

### Scoring Configuration

The system uses a two-stage scoring approach:

1. **Quick Score (0-10)**: Regex-based pattern matching
   - Budget mentioned: +3 points
   - Urgency signals: +2 points
   - Timeline specified: +1 point
   - Contact method: +2 points
   - Technology match: +1-2 points

2. **AI Analysis**: GPT-4 analysis for leads scoring ≥ 5
   - Adds 0-5 additional points
   - Extracts budget, timeline, technologies
   - Identifies red flags (free work, equity-only)

## Project Structure

```
leadscout/
├── src/
│   ├── index.js              # Application entry point
│   ├── config/
│   │   ├── database.js       # Supabase client initialization
│   │   └── env.js            # Environment configuration
│   ├── services/             # Core services (Phase 2)
│   │   ├── polling.js        # Main polling orchestrator
│   │   ├── twitter-poller.js # Twitter-specific polling
│   │   ├── linkedin-poller.js# LinkedIn-specific polling
│   │   ├── lead-scorer.js    # Scoring algorithms
│   │   └── notifier.js       # Telegram notifications
│   └── utils/
│       └── logger.js         # Winston logger setup
├── database/
│   └── schema.sql            # PostgreSQL schema
├── logs/                     # Application logs (auto-created)
├── .env.example              # Environment template
├── package.json              # Dependencies
└── README.md                 # This file
```

## Database Schema

The system uses 6 main tables:

- **leads**: Discovered opportunities with scores and metadata
- **keywords**: Search terms with performance tracking (155+ preloaded)
- **oauth_tokens**: Platform authentication tokens
- **polling_logs**: Execution history and health monitoring
- **notifications**: Telegram notification tracking
- **user_actions**: User interactions with notifications

## Running the Application

### Development Mode
```bash
pnpm run dev
```

### Production Mode
```bash
pnpm start
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm start` | Start production server |
| `pnpm run dev` | Start development server with hot reload |
| `pnpm test` | Run tests (not yet implemented) |

## API Rate Limits

- **Twitter**: 450 requests/15min, 500k tweets/month
- **LinkedIn**: 100 requests/day (very restrictive)
- **OpenAI**: 10k requests/min, $2/day budget limit
- **Telegram**: 30 messages/second per chat

## Monitoring & Health

The application logs to both console and file:
- **Console**: Colored, human-readable format
- **File**: JSON format in `logs/app.log`
- **Log rotation**: 10MB max file size, keeps 5 files

Health indicators tracked:
- System uptime and memory usage
- Database connectivity
- Last polling timestamp
- Daily lead count and notification stats
- API token validity

## Development Workflow

1. **Database First**: Update schema.sql before implementing features
2. **API Testing**: Test API connectivity with small scripts first
3. **Logging**: Use Winston logger (ERROR, WARN, INFO, DEBUG levels)
4. **Error Handling**: Implement exponential backoff for API calls
5. **Security**: Never log API keys or sensitive data

## Security Considerations

- OAuth tokens stored encrypted in database
- Service role key used for backend operations only
- All sensitive configuration via environment variables
- Error messages sanitized before logging
- Compliance with platform Terms of Service

## Performance Targets

- **Uptime**: >99%
- **Polling cycle**: <2 minutes completion
- **Lead processing**: <5 seconds per lead
- **Notification delivery**: <2 minutes from post
- **Database queries**: <100ms (95th percentile)

## Future Enhancements

- [ ] Web dashboard for analytics
- [ ] Machine learning for scoring optimization
- [ ] Additional platforms (Reddit, Discord)
- [ ] Email notifications as alternative to Telegram
- [ ] Automated response templates
- [ ] CRM integration

## Troubleshooting

### Database Connection Failed
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Check if schema.sql has been executed
- Ensure Supabase project is active

### No Leads Found
- Check API credentials for platforms
- Verify keywords table has entries
- Review polling_logs table for errors

### Notifications Not Received
- Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
- Ensure bot has permission to send messages
- Check MIN_NOTIFICATION_SCORE threshold

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with passion for automating lead generation by Ovalay Studios