# Leadscout Monorepo

Lead generation system for Ovalay Studios - automatically finds and qualifies web development opportunities from Twitter and LinkedIn.

## Project Structure

```
Leadscout/
├── apps/
│   ├── api/                     # Backend service (Node.js)
│   │   ├── src/                 # Source code
│   │   ├── database/            # SQL schemas
│   │   └── logs/                # Application logs
│   │
│   └── web/                     # Frontend dashboard (React)
│       ├── src/                 # React components
│       └── public/              # Static assets
│
├── packages/
│   └── types/                   # Shared TypeScript types
│
└── Doc/                         # Project documentation
```

## Tech Stack

- **Backend**: Node.js 20+, ES Modules
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: pnpm workspaces
- **APIs**: Twitter, LinkedIn, OpenAI, Telegram

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Leadscout

# Install all dependencies
pnpm install
```

### Configuration

1. **Backend** (`apps/api/.env`):
   - Copy `apps/api/.env.example` to `apps/api/.env`
   - Fill in all required API keys and tokens

2. **Frontend** (`apps/web/.env`):
   - Copy `apps/web/.env.example` to `apps/web/.env`
   - Update API_URL if backend runs on different port

### Development

```bash
# Run both backend and frontend in parallel
pnpm dev

# Or run separately:

# Backend only (port 3000)
pnpm dev:api

# Frontend only (port 5173)
pnpm dev:web
```

### Production

```bash
# Build frontend
pnpm build:web

# Start backend
pnpm start:api
```

## Monorepo Commands

```bash
# Install dependencies for all workspaces
pnpm install

# Run command in specific workspace
pnpm --filter @leadscout/api <command>
pnpm --filter @leadscout/web <command>

# Clean all node_modules
pnpm clean

# Run dev servers in parallel
pnpm dev
```

## Architecture

### Backend Service (`apps/api`)

Handles automated polling, lead scoring, and notifications:

- **Polling**: Runs every 30 minutes via cron
- **Scoring**: Two-stage system (regex patterns + AI analysis)
- **Notifications**: Real-time Telegram alerts for high-score leads
- **Health Check**: HTTP endpoint at `/health`

### Frontend Dashboard (`apps/web`)

React-based dashboard for lead management:

- **Lead List**: View and filter all discovered leads
- **Analytics**: Track performance metrics and conversion rates
- **Settings**: Manage keywords and notification preferences

### Shared Types (`packages/types`)

TypeScript interfaces shared between frontend and backend:

- `Lead`: Complete lead data structure
- `Keyword`: Search keyword configuration
- `PollingLog`: Execution history
- `Notification`: Alert tracking

## API Integrations

### Required API Keys

- **Supabase**: Database and authentication
- **Twitter**: Search API for finding leads
- **LinkedIn**: RSS feeds for public posts
- **OpenAI**: GPT-4o-mini for lead analysis
- **Telegram**: Bot for instant notifications

### Rate Limits

- Twitter: 450 requests per 15-min window
- LinkedIn: RSS feeds polled every 2 hours
- OpenAI: Max $2/day budget enforced
- Telegram: 30 messages/second per chat

## Features

- **Multi-Platform Monitoring**: Automated polling of Twitter and LinkedIn every 30 minutes
- **Intelligent Scoring**: Two-stage lead scoring with regex-based quick scoring and AI-powered analysis
- **Instant Notifications**: Telegram alerts for high-quality leads (score ≥ 8)
- **Budget Detection**: Automatic extraction of budget ranges from posts
- **Deduplication**: Smart duplicate detection using post IDs and text similarity
- **Technology Matching**: Identifies mentioned technologies and project types
- **Performance Tracking**: Analytics on keyword performance and conversion rates

## Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Testing**: Manual testing checklist in `Doc/Project-Doc.md`
3. **Code Quality**: Follow ES Module patterns, use winston for logging
4. **Deployment**: Railway for backend, Vercel/Netlify for frontend

## Documentation

- **Project Specification**: `Doc/Project-Doc.md` - Complete PRD and technical details
- **Backend README**: `apps/api/README.md` - API service documentation
- **Frontend README**: `apps/web/README.md` - Dashboard documentation
- **Architecture Guide**: `AGENTS.md` - System design and build guidelines
- **Claude Integration**: `CLAUDE.md` - Guidance for Claude Code sessions

## Support

For questions or issues, contact Leslie at Ovalay Studios.