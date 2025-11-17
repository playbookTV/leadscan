# AGENTS.md - Lead Finder Project

## Build/Lint/Test Commands
- **Not yet implemented** - Project is in pre-development phase
- Planned tech: Node.js 20.x, JavaScript (ES Modules)
- Future commands will likely include: `pnpm test`, `pnpm run lint`, `pnpm start`

## Architecture & Codebase Structure
- **Node.js polling service** hosted on Railway, runs every 30 minutes
- **Database:** Supabase PostgreSQL (tables: leads, oauth_tokens, keywords, polling_logs)
- **External APIs:** Twitter API v2, LinkedIn API, OpenAI API, Telegram Bot API
- **Key components:** Platform Pollers → Lead Processor (scoring/AI) → Notification Service
- See [Doc/Project-Doc.md](Doc/Project-Doc.md) for complete architecture diagrams and schema

## Code Style Guidelines
- **Language:** JavaScript with ES Modules
- **Error handling:** Use winston for logging, graceful API rate limit handling
- **Naming:** camelCase for variables/functions, UPPER_SNAKE for constants
- **Security:** NEVER log secrets/tokens, store OAuth tokens encrypted at rest
- **Comments:** Minimal - code should be self-documenting

## Codacy Integration (CRITICAL)
- After ANY `edit_file`, MUST run `codacy_cli_analyze` on edited files immediately
- After installing dependencies, MUST run `codacy_cli_analyze` with tool="trivy" for security
- See [.cursor/rules/codacy.mdc](.cursor/rules/codacy.mdc) for complete Codacy rules
