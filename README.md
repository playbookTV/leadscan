# 🎯 Leadscout - Automated Lead Generation System

Lead generation system for Ovalay Studios - automatically finds and qualifies web development opportunities from Twitter and LinkedIn.

## 📁 Project Structure

```
Leadscout/
├── src/                      # Backend service (Node.js)
│   ├── config/               # API clients and configuration
│   ├── services/             # Polling, scoring, notifications
│   ├── utils/                # Helpers and logging
│   └── index.js              # Entry point with cron
│
├── dashboard/                # Frontend dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/            # Dashboard pages
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts (Auth)
│   │   └── lib/              # Supabase client
│   ├── package.json
│   └── README.md
│
├── database/                 # PostgreSQL schemas
│   └── schema.sql            # Complete database schema
│
├── Doc/                      # Project documentation
│   └── Project-Doc.md        # Complete PRD & technical spec
│
├── .ampagent/                # Build automation agents
├── package.json              # Backend dependencies
└── README.md                 # This file
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 20+, ES Modules
- **Database**: Supabase (PostgreSQL 15)
- **Package Manager**: pnpm
- **APIs**: Twitter API v2, LinkedIn RSS, OpenAI GPT-4o-mini, Telegram Bot

### Frontend (Dashboard)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **UI Library**: Hero UI 2.0
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts
- **Routing**: React Router DOM 6

## ⚡ Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Supabase account
- API keys (Twitter, OpenAI, Telegram)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Leadscout

# Install backend dependencies
pnpm install

# Install dashboard dependencies
cd dashboard
pnpm install
cd ..
```

### Configuration

#### 1. Backend Configuration

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and add:
- **Supabase**: URL and Service Role Key
- **Twitter**: API credentials (Bearer Token, Access Token, etc.)
- **LinkedIn**: OAuth credentials (optional)
- **OpenAI**: API key
- **Telegram**: Bot token and Chat ID

#### 2. Dashboard Configuration

```bash
cd dashboard
cp .env.example .env
```

Edit `dashboard/.env` and add:
- **VITE_SUPABASE_URL**: Your Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Supabase anonymous/public key

#### 3. Database Setup

1. Go to your Supabase project dashboard
2. Open SQL Editor
3. Copy contents of `database/schema.sql`
4. Execute the SQL script
5. This creates all tables, indexes, triggers, and seed data (155+ keywords)

### Running the Application

#### Backend Service (Lead Finder Engine)

```bash
# Development mode with auto-restart
pnpm run dev

# Production mode
pnpm start

# Check system health
curl http://localhost:3000/health
```

The backend will:
- Poll Twitter & LinkedIn every 30 minutes
- Score leads using AI
- Send Telegram notifications for high-scoring leads (≥8)
- Log all activity to Supabase

#### Frontend Dashboard

```bash
cd dashboard

# Start development server
pnpm dev

# Build for production
pnpm build
```

Dashboard runs at `http://localhost:5173`

**Demo Login:**
- Email: `admin@ovalay.com`
- Password: `demo1234`

## 📊 Features

### Backend Service
- ✅ **Multi-Platform Monitoring**: Twitter & LinkedIn polling every 30 minutes
- ✅ **Intelligent Scoring**: Two-stage system (regex patterns + GPT-4 AI analysis)
- ✅ **Instant Notifications**: Telegram alerts for high-quality leads (score ≥ 8)
- ✅ **Budget Detection**: Automatic extraction of budget ranges
- ✅ **Deduplication**: Smart duplicate detection via post IDs and text similarity
- ✅ **Technology Matching**: Identifies mentioned technologies and project types
- ✅ **Performance Tracking**: Analytics on keyword performance and conversion rates
- ✅ **Health Monitoring**: HTTP health check endpoint with detailed metrics

### Frontend Dashboard
- 🎨 **Beautiful UI**: Built with Hero UI component library
- 🔐 **Authentication**: Secure login with Supabase Auth
- 📊 **Analytics**: Interactive charts (platform distribution, status breakdown, score distribution)
- 🔍 **Advanced Filtering**: Search and filter leads by platform, status, score
- 📝 **Lead Management**: View details, update status, add notes
- 💰 **Budget Tracking**: See budget mentions, project values, revenue metrics
- 🤖 **AI Insights**: View AI summaries, confidence scores, red flags
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile
- 🌙 **Dark Mode**: Full dark mode support
- 📤 **CSV Export**: Export filtered leads to CSV

## 🎯 How It Works

### 1. Discovery
The backend polls Twitter and LinkedIn using 155+ pre-configured keywords covering:
- Website Design (15 keywords)
- App Design (13 keywords)
- Branding (16 keywords)
- UI/UX Design (12 keywords)
- Web Development (10 keywords)
- And more...

### 2. Scoring
**Quick Score (0-10)** - Regex-based pattern matching:
- Budget mentioned: +3 points
- Urgency signals: +2 points
- Timeline specified: +1 point
- Contact method: +2 points
- Technology match: +1-2 points
- Red flags: -2 to -4 points

**AI Analysis** (for quick_score ≥ 5):
- GPT-4o-mini analyzes the post
- Extracts budget, timeline, technologies
- Identifies red flags
- Provides confidence score
- Final score = 30% quick + 70% AI

### 3. Notification
- High-scoring leads (≥8) trigger instant Telegram alerts
- Notifications include AI summary, budget, urgency, technologies
- Interactive buttons to update status directly from Telegram

### 4. Management
- View all leads in beautiful dashboard
- Filter by platform, status, score
- Update lead status (new → contacted → won)
- Add notes and track conversations
- Export data to CSV

## 📈 API Rate Limits

- **Twitter**: 450 requests/15min, 500k tweets/month
- **LinkedIn**: RSS feeds polled every 2 hours
- **OpenAI**: Max $2/day budget enforced (configurable)
- **Telegram**: 30 messages/second per chat

## 🗂️ Database Schema

6 main tables:

- **leads**: Discovered opportunities with scores and metadata
- **keywords**: Search terms with performance tracking (155+ preloaded)
- **oauth_tokens**: Platform authentication tokens
- **polling_logs**: Execution history and health monitoring
- **notifications**: Telegram notification tracking
- **user_actions**: User interactions with notifications

## 🚢 Deployment

### Backend (Railway)
```bash
# Configure environment variables in Railway dashboard
# Deploy from GitHub repository
# Service will auto-restart on failure
```

### Frontend (Vercel/Netlify)
```bash
# From dashboard directory
pnpm build

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## 📖 Documentation

- **[Project Specification](Doc/Project-Doc.md)** - Complete PRD with technical details
- **[Backend README](README.md)** - This file
- **[Dashboard README](dashboard/README.md)** - Frontend documentation
- **[Architecture Guide](AGENTS.md)** - System design and build guidelines
- **[Claude Integration](CLAUDE.md)** - Guidance for Claude Code sessions
- **[Phase 2 Report](PHASE2_IMPLEMENTATION.md)** - Implementation status

## 🛠️ Development Commands

### Backend
```bash
pnpm install          # Install dependencies
pnpm start            # Start production server
pnpm run dev          # Start with nodemon (auto-restart)
```

### Dashboard
```bash
cd dashboard
pnpm install          # Install dependencies
pnpm dev              # Start dev server (port 5173)
pnpm build            # Build for production
pnpm preview          # Preview production build
```

## 🔧 Troubleshooting

### Backend: Database Connection Failed
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check if `database/schema.sql` has been executed in Supabase
- Ensure Supabase project is active

### Backend: No Leads Found
- Check API credentials for platforms in `.env`
- Verify keywords table has entries (should have 155+ by default)
- Review `polling_logs` table for errors

### Backend: Notifications Not Received
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
- Ensure bot has permission to send messages
- Check `MIN_NOTIFICATION_SCORE` threshold (default: 8)

### Dashboard: Can't Login
- Verify Supabase credentials in `dashboard/.env`
- Create user in Supabase Auth dashboard
- Check browser console for errors

### Dashboard: No Leads Showing
- Ensure backend has run at least once
- Check Supabase `leads` table has data
- Verify Supabase RLS policies allow reads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Hero UI](https://heroui.com) - Beautiful React component library
- [Supabase](https://supabase.com) - Backend as a service
- [Vite](https://vitejs.dev) - Next generation frontend tooling
- [Lucide](https://lucide.dev) - Beautiful icon library
- [Recharts](https://recharts.org) - Composable charting library

---

**Built with ❤️ by Ovalay Studios**

For questions or support, open an issue on GitHub.

