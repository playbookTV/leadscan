# IMPLEMENTATION AGENT - Phase 1: Foundation

## Your Mission
Create the foundational infrastructure for the Lead Finder system based on Doc/Project-Doc.md section 3 (Database Schema) and section 2 (Tech Stack).

## Requirements

### 1. Database Schema
Create `database/schema.sql` with ALL tables from Project-Doc.md:
- `leads` table (complete with all fields from doc)
- `oauth_tokens` table
- `keywords` table  
- `polling_logs` table
- All indexes, constraints, and triggers

### 2. Package Configuration
Create `package.json` with:
- Node.js 20.x compatibility
- Dependencies: @supabase/supabase-js, twitter-api-v2, openai, node-telegram-bot-api, axios, node-cron, winston, dotenv
- Scripts: start, dev, test
- Type: "module" (ES Modules)

### 3. Environment Template
Create `.env.example` with ALL required variables:
- Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY)
- Twitter OAuth (CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN, REFRESH_TOKEN)
- LinkedIn OAuth (CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN)
- OpenAI (API_KEY)
- Telegram (BOT_TOKEN, CHAT_ID)
- App config (NODE_ENV, POLLING_INTERVAL)

### 4. Project Structure
Create directory structure:
```
src/
  config/
    database.js (Supabase client initialization)
    env.js (environment variable validation)
  services/
    (empty for now - pollers/scoring/notifications later)
  utils/
    logger.js (Winston configured with file + console transport)
  index.js (main entry point with placeholder)
```

### 5. Core Utilities
- **logger.js**: Winston configured with timestamps, log levels, file rotation
- **database.js**: Supabase client with error handling
- **env.js**: Validate all required env vars on startup, throw descriptive errors if missing

### 6. Entry Point
Create `src/index.js`:
- Import and validate environment
- Initialize logger
- Test database connection
- Log startup success
- NO MOCKS, NO PLACEHOLDERS - actual working initialization

## Deliverables Checklist
- [ ] database/schema.sql (complete, runnable)
- [ ] package.json (all dependencies, correct scripts)
- [ ] .env.example (all required variables documented)
- [ ] src/config/database.js (Supabase client)
- [ ] src/config/env.js (validation logic)
- [ ] src/utils/logger.js (Winston setup)
- [ ] src/index.js (initialization logic)
- [ ] README.md (setup instructions, architecture overview)

## Success Criteria
- Running `pnpm install` succeeds
- Running `node src/index.js` with valid .env connects to Supabase successfully
- No console.log statements (use winston)
- No TODO comments
- No placeholder functions that don't work
- All errors have descriptive messages
- Code follows ES Module syntax

## Report Back
Provide:
1. List of files created with one-line description each
2. Any decisions made or assumptions
3. Confirmation all success criteria met
