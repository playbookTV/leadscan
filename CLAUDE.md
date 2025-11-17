# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ovalay Lead Finder** - An automated lead generation system that monitors Twitter and LinkedIn 24/7 for web development project opportunities. The system scores leads, sends instant Telegram notifications, and tracks conversions.

**Status**: Pre-development (no code implemented yet)
**Target Launch**: Q1 2026

## Current Implementation Status

### ✅ Completed
- **Documentation & Planning**
  - [CLAUDE.md](CLAUDE.md) - Comprehensive guidance for Claude Code sessions
  - [AGENTS.md](AGENTS.md) - Architecture summary and build guidelines
  - [Doc/Project-Doc.md](Doc/Project-Doc.md) - Complete PRD and technical specification
  - [.mcp.json](.mcp.json) - HeySol MCP server configuration for persistent memory
  - [.cursor/rules/codacy.mdc](.cursor/rules/codacy.mdc) - Codacy integration rules
  - [.env.example](.env.example) - Environment variables template
  - [.gitignore](.gitignore) - Git ignore patterns

- **Initial Implementation**
  - [package.json](package.json) - Dependencies and npm scripts configured
  - [src/index.js](src/index.js) - Application entry point with graceful shutdown
  - [src/config/env.js](src/config/env.js) - Environment configuration loader
  - [src/config/database.js](src/config/database.js) - Supabase client initialization
  - [src/utils/logger.js](src/utils/logger.js) - Winston logger setup

### 🚧 In Progress
- Supabase database schema creation
- API client configurations (Twitter, LinkedIn, OpenAI, Telegram)
- Core services implementation

### ⏳ Not Yet Implemented
- Polling service and cron jobs
- Platform-specific pollers (Twitter, LinkedIn)
- Lead scoring algorithms (quick score + AI analysis)
- Notification service (Telegram integration)
- Analytics and reporting
- Railway deployment configuration
- Database migrations tooling
- Test suite

**Current Phase**: Initial infrastructure complete, building core services

## Build/Lint/Test Commands

**Package Manager**: This project uses **pnpm** (not npm)

### Essential Commands
```bash
pnpm install              # Install dependencies
pnpm start                # Start the polling service (production)
pnpm run dev              # Development mode with hot reload via nodemon
pnpm test                 # Run tests (not yet implemented)
```

### Planned Commands (not yet implemented)
- `pnpm run db:migrate` - Run database migrations
- `pnpm run lint` - Run ESLint
- `pnpm run test:watch` - Run tests in watch mode

## High-Level Architecture

### System Design

```
External APIs (Twitter, LinkedIn, OpenAI, Telegram)
          ↓
Railway-hosted Node.js Polling Service (runs every 30 minutes)
          ↓
  ┌───────┴────────┐
  ↓                ↓
Platform Pollers → Lead Processor (deduplication, scoring, AI analysis)
          ↓
Notification Service (Telegram alerts)
          ↓
Supabase PostgreSQL Database
```

### Core Components

1. **Polling Service** (Node.js, Railway)
   - Cron scheduler: runs every 30 minutes
   - Platform pollers: Twitter and LinkedIn API integration
   - Runs 24/7 with auto-restart on failure

2. **Lead Processor**
   - **Stage 1**: Quick regex-based scoring (0-10 scale)
   - **Stage 2**: AI analysis via OpenAI (only for quick_score ≥ 5)
   - Deduplication: checks by post_id and text similarity
   - Extraction: budget, timeline, technologies, project type

3. **Notification Service**
   - Sends Telegram alerts for leads scoring ≥ 8
   - Inline buttons: "Contacted", "Remind Later", "Skip", "Review Later"
   - Direct links to post and author profile

4. **Database** (Supabase PostgreSQL)
   - `leads` - All discovered opportunities with scores, status, metadata
   - `oauth_tokens` - Twitter/LinkedIn tokens (encrypted at rest)
   - `keywords` - Search terms with performance metrics
   - `polling_logs` - Execution history and system health
   - `notifications` - Delivery tracking and engagement
   - `user_actions` - Button clicks and status updates

### Tech Stack

- **Runtime**: Node.js 20.x (minimum required: >=20.0.0)
- **Language**: JavaScript with ES Modules (`"type": "module"`)
- **Package Manager**: pnpm (not npm or yarn)
- **Hosting**: Railway (planned)
- **Database**: Supabase (PostgreSQL 15)

**Dependencies** (installed):
- `@supabase/supabase-js` ^2.39.0 - Supabase client
- `twitter-api-v2` ^1.15.2 - Twitter API integration
- `axios` ^1.6.2 - HTTP client for LinkedIn/general API calls
- `openai` ^4.20.1 - OpenAI API for lead analysis
- `node-telegram-bot-api` ^0.64.0 - Telegram notifications
- `node-cron` ^3.0.3 - Cron job scheduling
- `rss-parser` ^3.13.0 - LinkedIn RSS feed parsing
- `winston` ^3.11.0 - Structured logging
- `dotenv` ^16.3.1 - Environment variable management
- `nodemon` ^3.0.2 (dev) - Auto-restart during development

### Key Data Flows

**Lead Discovery Flow**:
1. Cron triggers polling every 30 minutes
2. Fetch posts from Twitter/LinkedIn APIs using keywords
3. Check for duplicates (post_id + text similarity)
4. Calculate quick_score (regex patterns)
5. If quick_score ≥ 5: run AI analysis with OpenAI
6. Combine scores → final score (0-10)
7. Save to `leads` table
8. If score ≥ 8: send Telegram notification

**Scoring Algorithm**:
- Budget mentioned: +3 points
- Urgency signals: +2 points
- Timeline mentioned: +1 point
- Contact method provided: +2 points
- Technology match: +1-2 points
- Project type clarity: +1 point
- Red flags (free, unpaid, equity-only): -2 to -4 points

**AI Analysis** (GPT-4o-mini):
- Input: post_text
- Output: score (0-5), summary, projectType, estimatedBudget, timeline, technologies, redFlags, reasoning
- Cost control: only runs for quick_score ≥ 5, max $2/day budget

## File Structure

```
leadscan/
├── src/
│   ├── index.js              # Main entry, cron setup, health check
│   ├── config/
│   │   ├── database.js       # Supabase client
│   │   ├── twitter.js        # Twitter API client
│   │   ├── linkedin.js       # LinkedIn API client
│   │   └── openai.js         # OpenAI client
│   ├── services/
│   │   ├── polling.js        # Main polling orchestrator
│   │   ├── twitter-poller.js # Twitter-specific polling
│   │   ├── linkedin-poller.js# LinkedIn-specific polling
│   │   ├── lead-scorer.js    # Scoring algorithms
│   │   ├── notifier.js       # Telegram notifications
│   │   └── analytics.js      # Performance tracking
│   ├── utils/
│   │   ├── logger.js         # Winston logger
│   │   ├── errors.js         # Error handling
│   │   └── helpers.js        # Utility functions
│   └── cron/
│       └── jobs.js           # Cron job definitions
├── Doc/
│   └── Project-Doc.md        # Complete PRD and technical spec
├── AGENTS.md                 # Build/architecture summary
├── CLAUDE.md                 # This file
├── .env.example
├── package.json
└── railway.json
```

## MCP Server: HeySol Memory & Context

**CRITICAL**: This project uses the HeySol MCP server for persistent memory and context across Claude Code sessions.

### Configuration
- **MCP Server**: HeySol (https://core.heysol.ai/api/v1/mcp?source=claude)
- **Purpose**: Store and retrieve project context, decisions, and important information
- **Authentication**: Uses `HEYSOL_API_KEY` from `.env` file
- **Configuration File**: `.mcp.json` (checked into version control)

### When to Use HeySol MCP

**MUST use HeySol MCP tools in these situations:**

1. **At the start of EVERY session**: Retrieve stored context about project state, recent decisions, and pending tasks
2. **After making important decisions**: Store architectural choices, API integrations, scoring algorithm changes
3. **When completing major milestones**: Save progress on features, database schema updates, deployment configs
4. **After debugging critical issues**: Record root causes, fixes applied, and lessons learned
5. **Before ending a session**: Store current state, next steps, and any blockers

### What to Store in HeySol

- Project configuration decisions (API keys needed, service selections)
- Database schema changes and migration history
- Scoring algorithm tuning results (what worked, what didn't)
- API integration learnings (rate limits encountered, authentication issues)
- Performance optimizations applied
- Testing results and known issues
- Deployment configurations and Railway setup
- Keyword performance metrics and tuning decisions

### Example Memory Entries

```
- "Twitter API integration complete with rate limiting, using twitter-api-v2 v1.15.0"
- "Lead scoring algorithm: quick_score threshold set to 5, AI analysis for score ≥ 5"
- "Supabase schema created with 6 tables, indexes on post_id and created_at"
- "HeySol MCP configured for persistent context storage across sessions"
```

## Code Style Guidelines

- **Language**: JavaScript with ES Modules (`import`/`export`)
- **Naming**:
  - camelCase for variables and functions
  - UPPER_SNAKE_CASE for constants
- **Error Handling**:
  - Use winston for all logging
  - Graceful API rate limit handling with exponential backoff
  - Never expose API keys or tokens in logs/errors
- **Security**:
  - NEVER log secrets, tokens, or API keys
  - Store OAuth tokens encrypted at rest
  - Sanitize stack traces before logging
  - Respect platform rate limits
- **Comments**: Minimal - code should be self-documenting
- **Dependencies**: Use npm for package management

## Critical: Codacy Integration

**IMPORTANT**: This project uses Codacy for code quality and security analysis.

### After ANY file edit:
- MUST immediately run `codacy_cli_analyze` on edited files
- If issues found, propose and apply fixes
- Do not proceed until issues are resolved

### After installing dependencies:
- MUST run `codacy_cli_analyze` with `tool="trivy"` for security scanning
- If vulnerabilities found, stop and fix before continuing

See [.cursor/rules/codacy.mdc](.cursor/rules/codacy.mdc) for complete Codacy rules.

## Environment Variables

Required environment variables (local: `.env` file, production: Railway dashboard):

```bash
# HeySol MCP (for Claude Code persistent memory)
HEYSOL_API_KEY=rc_pat_xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Twitter
TWITTER_API_KEY=xxx
TWITTER_API_SECRET=xxx
TWITTER_BEARER_TOKEN=xxx
TWITTER_ACCESS_TOKEN=xxx
TWITTER_ACCESS_SECRET=xxx

# LinkedIn
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
LINKEDIN_ACCESS_TOKEN=xxx

# OpenAI
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MAX_DAILY_COST=2.00

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=123456789

# App Config
POLLING_INTERVAL_MINUTES=30
MIN_NOTIFICATION_SCORE=8
ENABLE_AI_ANALYSIS=true
AI_MIN_SCORE_THRESHOLD=5
```

## API Rate Limits & Constraints

- **Twitter API**: 450 requests per 15-min window, 500k tweets/month (free tier)
- **LinkedIn API**: 100 requests/day for search (very restrictive - may use RSS fallback)
- **OpenAI API**: 10k requests/min, track costs in database
- **Telegram Bot**: 30 messages/second per chat

## Key Design Decisions

1. **Two-stage scoring**: Quick regex filter first, then expensive AI analysis only for promising leads (quick_score ≥ 5)
2. **Deduplication**: Check by post_id AND text similarity (80%+ match from same author within 24 hours)
3. **Notification threshold**: Only send Telegram alerts for score ≥ 8 to reduce noise
4. **Token management**: Auto-refresh OAuth tokens before expiration, alert on failure
5. **Cost control**: Max $2/day OpenAI spend, track per-analysis cost in database
6. **Polling frequency**: Every 30 minutes (balance between freshness and API limits)

## Success Metrics

**Technical Targets**:
- Uptime: >99%
- Polling cycle: <2 minutes completion time
- Lead processing: <5 seconds per lead
- Notification delivery: <2 minutes from post creation
- Database queries: <100ms (95th percentile)

**Business Targets** (90 days):
- Find 60+ qualified leads (score ≥ 7)
- 10%+ conversion rate (leads → projects)
- $18k+ revenue attributed to system
- Response time average <30 minutes
- False positive rate <15%

## Development Workflow

### Before Starting Development
1. **Install dependencies**: Run `pnpm install` (NOT npm install)
2. **Set up environment**: Copy `.env.example` to `.env` and fill in API keys
3. **Verify Node version**: Ensure Node.js >=20.0.0 (`node --version`)

### When Implementing Features
1. **Database First**: Create/update Supabase schema before writing code
2. **API Integration**: Test API connectivity with small scripts before full implementation
3. **Scoring Tuning**: Start with conservative thresholds, tune based on real data
4. **Logging**: Use the winston logger from `src/utils/logger.js` (ERROR, WARN, INFO, DEBUG levels)
5. **Error Recovery**: Implement retry logic with exponential backoff for all API calls
6. **Testing**: Manual testing checklist in Doc/Project-Doc.md section 9

### Current Implementation Pattern
- **ES Modules**: All imports use `.js` extension (e.g., `import logger from './utils/logger.js'`)
- **Configuration**: Centralized in `src/config/env.js`, loaded via dotenv
- **Database**: Supabase client initialized in `src/config/database.js`
- **Entry Point**: `src/index.js` handles startup, graceful shutdown, and error handling
- **Logging**: Structured JSON logging via winston (configured in `src/utils/logger.js`)

## Security Considerations

- OAuth tokens stored encrypted in Supabase (encrypted at rest)
- Use Supabase service role key (not anon key) for backend operations
- Never commit .env files to git
- Sanitize all error messages before logging
- Only store publicly available post data (no private DMs)
- Comply with Twitter/LinkedIn Terms of Service
- Rate limit all API calls to respect platform limits

## Monitoring & Health Checks

**Health Indicators**:
- System uptime and memory usage
- Last polling time (<30 min ago = healthy)
- Database connectivity
- OAuth token validity
- API health checks (Twitter, LinkedIn, OpenAI, Telegram)
- Today's stats (leads found, notifications sent)

**Critical Alerts** (sent via Telegram):
- System down >30 minutes
- No leads found in 24 hours (possible API issue)
- OAuth tokens invalid
- Database connection lost
- Daily cost exceeds $5

**Analytics Views** (Supabase SQL):
- Daily performance by platform
- Conversion funnel (leads → contacted → won)
- Top keywords by revenue
- Response time analysis

## LinkedIn Implementation Note

LinkedIn API is extremely restrictive for public search. Implementation options:
1. **LinkedIn API**: Only accesses user's network posts (limited value)
2. **RSS Feeds**: Parse company pages and hashtag feeds (recommended approach)
3. **Scraping**: Against ToS, risk of account ban (NOT recommended)

**Decision**: Use RSS feeds for LinkedIn, reduce polling frequency to every 2 hours.

## Reference Documentation

- **Complete PRD & Technical Spec**: [Doc/Project-Doc.md](Doc/Project-Doc.md)
- **Architecture Summary**: [AGENTS.md](AGENTS.md)
- **Codacy Rules**: [.cursor/rules/codacy.mdc](.cursor/rules/codacy.mdc)

## Quick Reference

**Database Schema**: See Doc/Project-Doc.md Section 3 (lines 465-742)
**Scoring Algorithm**: See Doc/Project-Doc.md Section 5.1 (lines 1016-1146)
**API Integration Details**: See Doc/Project-Doc.md Section 4 (lines 743-1006)
**Deployment Config**: See Doc/Project-Doc.md Section 6 (lines 1230-1408)
