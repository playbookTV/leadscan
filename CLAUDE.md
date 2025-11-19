# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Leadscout** - Automated lead generation system for Ovalay Studios that monitors Twitter and LinkedIn for web development opportunities. Uses AI to score leads, sends Telegram notifications for high-value opportunities, and provides a React dashboard for lead management.

**Architecture**: pnpm monorepo with backend API (Node.js) and frontend dashboard (React + Vite + TypeScript)
**Status**: Core engine complete (Phase 2), frontend dashboard operational with advanced features
**Tech Stack**: Node.js 20+, React 18, TypeScript, Supabase PostgreSQL, OpenAI GPT-4o-mini

## Monorepo Structure

This is a **pnpm workspace monorepo**:

```
leadscout-monorepo/
├── apps/
│   ├── api/              # @leadscout/api - Backend service (Node.js ES Modules)
│   │   ├── src/
│   │   │   ├── index.js          # Entry: HTTP server, cron, graceful shutdown
│   │   │   ├── server.js         # Express app with routes
│   │   │   ├── config/           # API clients (Twitter, LinkedIn, OpenAI, Telegram)
│   │   │   ├── services/         # Polling, scoring, notifications, email, websocket
│   │   │   ├── routes/           # HTTP endpoints
│   │   │   └── utils/            # Logger, helpers
│   │   └── database/
│   │       └── schema.sql        # PostgreSQL schema
│   │
│   └── web/              # @leadscout/web - Frontend dashboard (React + TypeScript)
│       └── src/
│           ├── main.tsx          # Vite entry point
│           ├── App.tsx           # Root with routing
│           ├── pages/            # Dashboard, Leads, Analytics, Keywords, Settings
│           ├── components/       # UI components (BulkActions, EmailComposer, etc.)
│           ├── contexts/         # React Context (ThemeContext, AuthContext)
│           ├── hooks/            # Custom hooks (useKeyboardShortcuts, useRealtime)
│           ├── lib/              # Supabase client
│           └── utils/            # Helpers, export utilities
│
└── packages/
    └── types/            # @leadscout/types - Shared TypeScript types
```

## Build/Lint/Test Commands

**Package Manager**: This project uses **pnpm workspaces** (NOT npm or yarn)

### Root-Level Commands

```bash
# Install all workspace dependencies
pnpm install

# Run both API and Web dev servers in parallel
pnpm dev

# Run individual workspace dev servers
pnpm dev:api              # Backend only (port 3000)
pnpm dev:web              # Frontend only (port 5173)

# Production
pnpm start:api            # Start backend in production mode
pnpm build:web            # Build frontend for production
pnpm build                # Build all workspaces

# Maintenance
pnpm clean                # Remove all node_modules and dist folders
```

### Workspace-Specific Commands

```bash
# Run command in specific workspace
pnpm --filter @leadscout/api <command>
pnpm --filter @leadscout/web <command>
pnpm --filter @leadscout/types <command>

# Examples:
pnpm --filter @leadscout/api run dev
pnpm --filter @leadscout/web run build
```

### Backend (apps/api)

```bash
cd apps/api
pnpm start                # Production (node src/index.js)
pnpm dev                  # Development with --watch flag
pnpm test                 # Run Node.js native tests
```

### Frontend (apps/web)

```bash
cd apps/web
pnpm dev                  # Start Vite dev server (port 5173)
pnpm build                # Build for production
pnpm preview              # Preview production build
```

## High-Level Architecture

### System Design

```
User ──────────────────────────┐
                               ↓
                    Frontend Dashboard (React)
                               ↓
                          Supabase PostgreSQL
                               ↑
                          Backend API
                               ↑
            ┌──────────────────┴─────────────────┐
            ↓                  ↓                  ↓
     Twitter API         LinkedIn RSS        OpenAI API
            ↓                  ↓                  ↓
         Polling → Lead Scoring → Telegram Notifications
```

### Core Data Flow - Lead Discovery Pipeline

1. **Cron trigger** (every 30 minutes) → fetch active keywords from database
2. **Platform pollers** query Twitter API + LinkedIn RSS in parallel
3. **Deduplication** checks post_id and text similarity (80% threshold)
4. **Stage 1 scoring** (regex-based, 0-10 scale) - fast pre-filter
5. **Stage 2 scoring** (AI analysis via GPT-4o-mini, only if quick_score ≥ 5)
6. **Combined score** = 30% quick score + 70% AI score
7. **Save to database** (all leads saved, regardless of score)
8. **Send notification** if final score ≥ 8 (Telegram with action buttons)
9. **WebSocket broadcast** to connected dashboard clients
10. **Log results** to polling_logs table

### Tech Stack

**Backend** (`apps/api`):
- Runtime: Node.js >=20.0.0
- Language: JavaScript ES Modules (`.js` extensions required in imports)
- Database: Supabase PostgreSQL via `@supabase/supabase-js`
- APIs: `twitter-api-v2`, `rss-parser`, `openai`, `node-telegram-bot-api`
- Email: `nodemailer`, `@sendgrid/mail`, `resend` (multi-provider support)
- Real-time: `socket.io` (WebSocket server)
- Scheduling: `node-cron` (runs every 30 minutes)
- Logging: `winston` (structured JSON logs)
- Health Check: HTTP endpoints (`/health`, `/stats`)

**Frontend** (`apps/web`):
- Framework: React 18 with TypeScript
- Build Tool: Vite 5
- UI Library: HeroUI (NextUI-based component library)
- Routing: `react-router-dom` v6
- Charts: `recharts`
- State: React Context + `@tanstack/react-query`
- Database: Supabase client with real-time subscriptions
- Styling: TailwindCSS + PostCSS
- Icons: `lucide-react`
- Notifications: `sonner` (toast notifications)
- Real-time: `socket.io-client` (WebSocket client)

**Shared** (`packages/types`):
- TypeScript type definitions shared between API and Web
- Exports: `Lead`, `Keyword`, `PollingLog`, `Notification`, `UserAction`

## Environment Configuration

### Backend (`apps/api/.env`)

```bash
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
NODE_ENV=development
PORT=3000
POLLING_INTERVAL_MINUTES=30
MIN_NOTIFICATION_SCORE=8
ENABLE_AI_ANALYSIS=true
AI_MIN_SCORE_THRESHOLD=5
```

### Frontend (`apps/web/.env`)

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:3000
```

## Development Workflow

### Initial Setup

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm@10.22.0
   ```

2. **Install all dependencies**:
   ```bash
   pnpm install              # Installs for all workspaces
   ```

3. **Configure environment**:
   ```bash
   # Backend
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env with your API keys

   # Frontend
   cp apps/web/.env.example apps/web/.env
   # Edit apps/web/.env with Supabase URL and anon key
   ```

4. **Verify Node version**:
   ```bash
   node --version            # Must be >= 20.0.0
   pnpm --version            # Must be >= 8.0.0
   ```

### Daily Development

**Run both frontend and backend**:
```bash
pnpm dev                  # Runs both in parallel
```

**Run separately** (useful for debugging):
```bash
# Terminal 1: Backend
pnpm dev:api

# Terminal 2: Frontend
pnpm dev:web
```

**Access points**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health
- Stats endpoint: http://localhost:3000/stats

### Code Style & Implementation Patterns

**Backend (JavaScript ES Modules)**:
- All imports MUST include `.js` extension: `import logger from './utils/logger.js'`
- Configuration centralized in `apps/api/src/config/env.js`
- Logging: Use winston logger, NEVER `console.log`
- Error handling: Use `retryWithBackoff()` for API calls, graceful degradation
- Database: Supabase client from `apps/api/src/config/database.js`
- Naming: camelCase for variables/functions, UPPER_SNAKE_CASE for constants

**Frontend (TypeScript + React)**:
- Use TypeScript for all new files (`.tsx` for components, `.ts` for utilities)
- Import shared types from `@leadscout/types`
- Components: Functional components with hooks
- Styling: TailwindCSS utility classes
- State: React Context for global state, local useState for component state
- Data fetching: Supabase client with real-time subscriptions
- Naming: PascalCase for React components, camelCase for functions/variables

**Shared Types** (`packages/types`):
- Define all database models and API contracts here
- Export from `packages/types/src/index.ts`
- Import in API: `import type { Lead } from '@leadscout/types'`
- Import in Web: `import type { Lead } from '@leadscout/types'`

## Lead Scoring Algorithm

### Stage 1: Quick Regex Scoring (0-10)
- Budget mentioned: +3 points
- Urgency signals ("ASAP", "urgent"): +2 points
- Timeline mentioned: +1 point
- Contact method provided: +2 points
- Technology match (React, Node.js, etc.): +1-2 points
- Project type clarity: +1 point
- Red flags ("free", "unpaid", "equity only"): -2 to -4 points

### Stage 2: AI Analysis (GPT-4o-mini)
- Only runs if quick_score ≥ 5 (cost optimization)
- Prompt extracts: score (0-5), summary, projectType, estimatedBudget, timeline, technologies, redFlags, reasoning
- Cost tracking: logs per-analysis cost to database, enforces $2/day limit
- Combined score: `(quick_score * 0.3) + (ai_score * 2 * 0.7)` → normalized to 0-10

### Deduplication
- Exact match by `post_id` (primary check)
- Text similarity: 80%+ Jaccard similarity from same author within 24 hours

## Key Features Implemented

### Backend Services
- **Multi-Platform Monitoring**: Twitter & LinkedIn polling every 30 minutes
- **Two-Stage Scoring**: Regex + AI analysis for cost-effective lead qualification
- **Telegram Notifications**: Instant alerts with interactive action buttons
- **Email Service**: Multi-provider support (SMTP, SendGrid, Resend)
- **WebSocket Server**: Real-time updates to dashboard clients
- **Health Monitoring**: HTTP endpoints for Railway/Docker health checks

### Frontend Dashboard
- **Dark Mode**: Full dark/light theme support with system preference detection
- **Keyboard Shortcuts**: Global shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+F, Cmd/Ctrl+E, Cmd/Ctrl+A)
- **Bulk Operations**: Multi-select leads with bulk status updates
- **CSV Export**: Export leads and keywords with UTF-8 BOM for Excel
- **Email Composer**: Template-based email system with tracking
- **Real-time Updates**: WebSocket integration + browser push notifications
- **Advanced Filtering**: Search and filter by platform, status, score
- **Analytics Dashboard**: Interactive charts with Recharts

## Database Schema (Supabase)

**Tables**:
- `leads` - All discovered opportunities with scores, status, metadata, platform info
- `keywords` - Search terms with performance metrics (leads_found, conversion_rate)
- `oauth_tokens` - Twitter/LinkedIn tokens (encrypted at rest)
- `polling_logs` - Execution history, API costs, errors
- `notifications` - Telegram delivery tracking and engagement
- `user_actions` - Button clicks and status updates from Telegram callbacks
- `email_logs` - Email tracking and delivery status

See [apps/api/database/schema.sql](apps/api/database/schema.sql) for complete schema.

## API Rate Limits & Cost Controls

- **Twitter API**: 450 requests per 15-min window (free tier), 500k tweets/month
  - **Optimizations implemented**: Reduces 129 keyword searches to 20 per cycle (84% reduction)
  - See [TWITTER_OPTIMIZATION.md](TWITTER_OPTIMIZATION.md) for detailed configuration
- **LinkedIn RSS**: No official limits, but feeds polled every 2 hours to be respectful
- **OpenAI API**: $2/day budget enforced in code, tracks usage in database
- **Telegram Bot**: 30 messages/second per chat (very generous)

### Twitter API Optimization Features

The system implements multiple strategies to stay within Twitter's free tier limits:

1. **Keyword Prioritization**: Searches only high-performing keywords based on conversion rate, recent activity, and lead quality
2. **Keyword Rotation**: Distributes searches over time using round-robin (20 keywords per 30-min cycle)
3. **Query Batching** (optional): Combines related keywords using OR operators to reduce API calls
4. **Rate Limit Monitoring**: Stops polling when approaching rate limits to prevent errors
5. **Production Optimization**: Skips connection test in production to save 1 API call per restart

**Default Configuration** (apps/api/.env):
```bash
TWITTER_MAX_KEYWORDS_PER_CYCLE=20           # Keywords per cycle
TWITTER_ENABLE_KEYWORD_ROTATION=true        # Enable rotation
TWITTER_ENABLE_KEYWORD_PRIORITIZATION=true  # Prioritize by performance
TWITTER_ENABLE_BATCHING=false               # Disable batching (experimental)
TWITTER_RATE_LIMIT_THRESHOLD=50             # Stop when ≤50 calls remaining
```

**Impact**: Reduces API usage from ~6,192 calls/day to ~960 calls/day (84% reduction)

## Deployment

### Backend (Railway)
- Service: apps/api
- Build Command: None (Node.js runtime)
- Start Command: `pnpm --filter @leadscout/api run start`
- Health Check: `/health` endpoint
- Environment: Set all backend .env variables in Railway dashboard
- Files: `railway.json`, `nixpacks.toml`, `Procfile` in apps/api/

### Frontend (Vercel/Netlify)
- Root Directory: apps/web
- Build Command: `cd ../.. && pnpm --filter @leadscout/web run build`
- Output Directory: apps/web/dist
- Environment: Set all frontend .env variables (VITE_ prefixed)
- Files: `railway.json`, `nixpacks.toml` in apps/web/

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

## Critical: Codacy Integration

**IMPORTANT**: This project uses Codacy for code quality and security analysis.

### After ANY file edit:
- MUST immediately run `codacy_cli_analyze` on edited files
- If issues found, propose and apply fixes
- Do not proceed until issues are resolved

### After installing dependencies:
- MUST run `codacy_cli_analyze` with `tool="trivy"` for security scanning
- If vulnerabilities found, stop and fix before continuing

### Codacy Configuration:
- Provider: `gh` (GitHub)
- Organization: `playbookTV`
- Repository: `leadscan`

See [.cursor/rules/codacy.mdc](../.cursor/rules/codacy.mdc) for complete Codacy rules.

## Key Design Decisions

1. **Monorepo Structure**: Separate API and Web apps for independent deployment, shared types package
2. **Two-Stage Scoring**: Cheap regex filter first, expensive AI only for promising leads (quick_score ≥ 5)
3. **Package Manager**: pnpm workspaces for faster installs and better dependency management
4. **Frontend Framework**: React + Vite for fast dev experience, TypeScript for type safety
5. **Database Access**: Backend uses service role key, frontend uses anon key with RLS policies
6. **Notification Threshold**: Only send Telegram alerts for score ≥ 8 to reduce noise
7. **Cost Control**: $2/day OpenAI budget enforced in code, tracked per-analysis
8. **LinkedIn Strategy**: RSS feeds instead of API due to restrictive access
9. **Polling Frequency**: Every 30 minutes (balance between freshness and API limits)
10. **Real-time Updates**: WebSocket for dashboard + Telegram for critical notifications

## Common Tasks

### Adding a New Feature to Frontend
1. Create TypeScript types in `packages/types/src/index.ts`
2. Create React component in `apps/web/src/components/`
3. Add page if needed in `apps/web/src/pages/`
4. Update routing in `apps/web/src/App.tsx`
5. Run `pnpm --filter @leadscout/web run dev` to test
6. Run `codacy_cli_analyze` on edited files

### Adding a New Backend Service
1. Create service in `apps/api/src/services/`
2. Use `.js` extension, ES Module imports
3. Import logger from `./utils/logger.js`
4. Import types from `@leadscout/types`
5. Export functions for use in index.js or other services
6. Test with `pnpm --filter @leadscout/api run dev`
7. Run `codacy_cli_analyze` on edited files

**Example**: See [keyword-optimizer.js](apps/api/src/services/keyword-optimizer.js) for a complete service implementation with:
- Performance-based keyword prioritization
- Round-robin keyword rotation
- Query batching with OR operators
- Rate limit monitoring

### Adding a New Database Table
1. Update `apps/api/database/schema.sql`
2. Execute SQL in Supabase dashboard
3. Add TypeScript type to `packages/types/src/index.ts`
4. Update RLS policies in Supabase if needed
5. Import type in both API and Web: `import type { NewType } from '@leadscout/types'`

### Debugging Lead Scoring Issues
1. Check polling logs: Query `polling_logs` table in Supabase
2. Review lead scores: Check `leads` table for `quick_score`, `ai_score`, and final `score`
3. Check OpenAI costs: Query `polling_logs` for `ai_cost` and `total_cost`
4. Test scoring: Edit `apps/api/src/services/lead-scorer.js` and run locally with `pnpm dev:api`
5. View logs: Check `apps/api/logs/` directory or Winston console output

## Security Guidelines

- **Secrets Management**: NEVER commit `.env` files, use `.env.example` templates
- **Logging**: NEVER log API keys, tokens, or sensitive user data
- **Database Access**: Backend uses SERVICE_ROLE_KEY (admin), frontend uses ANON_KEY (restricted by RLS)
- **Error Handling**: Sanitize error stack traces before sending to frontend
- **API Rate Limits**: Respect platform limits, use exponential backoff for retries
- **Dependencies**: Run `codacy_cli_analyze` with `tool="trivy"` after any dependency changes

## Reference Documentation

- **Complete PRD & Technical Spec**: [Doc/Project-Doc.md](Doc/Project-Doc.md)
- **Phase 2 Implementation Report**: [PHASE2_IMPLEMENTATION.md](PHASE2_IMPLEMENTATION.md)
- **Main README**: [README.md](README.md)
- **Deployment Guide**: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
- **Features Documentation**: [FEATURES.md](FEATURES.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Codacy Rules**: [.cursor/rules/codacy.mdc](../.cursor/rules/codacy.mdc)

## Quick Reference

**Database Schema**: [apps/api/database/schema.sql](apps/api/database/schema.sql)
**Scoring Algorithm**: [Doc/Project-Doc.md](Doc/Project-Doc.md) Section 5.1 (lines 1016-1146)
**API Integration Details**: [Doc/Project-Doc.md](Doc/Project-Doc.md) Section 4 (lines 743-1006)
**Backend Service Details**: [PHASE2_IMPLEMENTATION.md](PHASE2_IMPLEMENTATION.md)
