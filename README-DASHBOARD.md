# Leadscout Dashboard - Setup & Testing Guide

## Overview
The Leadscout Dashboard is now fully implemented with:
- **Backend API** (Express.js) at `/apps/api`
- **Frontend Dashboard** (React + TypeScript) at `/apps/web`

## Project Structure
```
/home/dsgn_api/Leadscout/
├── apps/
│   ├── api/               # Backend API
│   │   ├── src/
│   │   │   ├── routes/     # API endpoints
│   │   │   │   ├── leads.js
│   │   │   │   ├── keywords.js
│   │   │   │   ├── analytics.js
│   │   │   │   └── settings.js
│   │   │   ├── config/     # Configuration
│   │   │   ├── services/   # Business logic
│   │   │   ├── utils/      # Utilities
│   │   │   ├── server.js   # Express app
│   │   │   └── index.js    # Entry point
│   │   └── .env.example
│   └── web/               # Frontend Dashboard
│       ├── src/
│       │   ├── components/
│       │   │   ├── layout/  # Layout components
│       │   │   └── ui/      # UI components
│       │   ├── hooks/       # React Query hooks
│       │   ├── lib/         # API client & utils
│       │   ├── pages/       # Page components
│       │   └── App.tsx      # Main app with routing
│       └── .env.example
└── test-api.sh            # API testing script
```

## Setup Instructions

### 1. Backend API Setup

```bash
cd /home/dsgn_api/Leadscout/apps/api

# Copy environment variables
cp .env.example .env
# Edit .env and add your API keys:
# - Supabase credentials
# - Twitter API keys
# - LinkedIn credentials
# - OpenAI API key
# - Telegram bot token

# Install dependencies (if not already installed)
npm install

# Start the API server
npm start

# Or for development with auto-reload
npm run dev
```

The API will start on http://localhost:3000

### 2. Frontend Dashboard Setup

```bash
cd /home/dsgn_api/Leadscout/apps/web

# Copy environment variables
cp .env.example .env
# Edit .env if needed (default should work)

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dashboard will be available at http://localhost:5173

### 3. Test the API

```bash
cd /home/dsgn_api/Leadscout

# Run the test script
./test-api.sh
```

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /stats` - Polling statistics

### Leads API
- `GET /api/leads` - List leads with filters
- `GET /api/leads/stats/summary` - Get lead statistics
- `GET /api/leads/:id` - Get single lead
- `PATCH /api/leads/:id` - Update lead
- `POST /api/leads/:id/notes` - Add note to lead
- `POST /api/leads/:id/action` - Perform action on lead
- `DELETE /api/leads/:id` - Delete lead

### Keywords API
- `GET /api/keywords` - List all keywords
- `GET /api/keywords/:id` - Get single keyword
- `POST /api/keywords` - Create keyword
- `PATCH /api/keywords/:id` - Update keyword
- `DELETE /api/keywords/:id` - Delete keyword

### Analytics API
- `GET /api/analytics/overview` - Analytics overview
- `GET /api/analytics/platforms` - Platform breakdown
- `GET /api/analytics/conversion` - Conversion funnel
- `GET /api/analytics/keywords` - Keyword performance

### Settings API
- `GET /api/settings/config` - Get configuration
- `GET /api/settings/health` - System health
- `PATCH /api/settings/config` - Update settings

## Dashboard Features

### Pages
1. **Dashboard** (`/`) - Overview with key metrics and quick stats
2. **Leads** (`/leads`) - Browse, filter, and manage leads
3. **Lead Detail** (`/leads/:id`) - Detailed view with actions and notes
4. **Analytics** (`/analytics`) - Performance insights (coming soon)
5. **Keywords** (`/keywords`) - Manage search keywords
6. **Settings** (`/settings`) - System configuration

### Key Features
- **Real-time Updates** - React Query for data synchronization
- **Filtering & Search** - Advanced lead filtering by platform, status, score
- **Quick Actions** - Mark as contacted, skip, win/lose directly from the table
- **Lead Scoring** - Visual indicators for lead quality
- **Notes System** - Add timestamped notes to leads
- **Responsive Design** - Works on desktop and mobile

## Testing Checklist

### Backend Testing
- [ ] API starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Database connection successful
- [ ] All route endpoints respond correctly
- [ ] CORS allows frontend connection

### Frontend Testing
- [ ] Dashboard loads without errors
- [ ] Stats display correctly
- [ ] Leads table populates
- [ ] Filtering works
- [ ] Lead detail page opens
- [ ] Actions update lead status
- [ ] Navigation between pages works

### Integration Testing
- [ ] Frontend connects to backend API
- [ ] Data flows correctly from database to UI
- [ ] Actions trigger backend updates
- [ ] Error handling works properly

## Common Issues & Solutions

### Issue: API not starting
- Check `.env` file has all required variables
- Verify Supabase credentials are correct
- Check Node.js version (requires >= 20.0.0)

### Issue: Frontend can't connect to API
- Verify API is running on port 3000
- Check VITE_API_URL in frontend .env
- Ensure CORS is configured correctly

### Issue: No data showing
- Check database has test data
- Verify Supabase connection
- Check browser console for errors

## Development Tips

### Adding New Features
1. Create API endpoint in `/apps/api/src/routes/`
2. Add TypeScript types in `/apps/web/src/lib/api.ts`
3. Create React Query hook in `/apps/web/src/hooks/`
4. Build UI component in `/apps/web/src/components/`
5. Add page if needed in `/apps/web/src/pages/`

### Database Changes
1. Update schema in `/apps/api/database/schema.sql`
2. Run migrations in Supabase
3. Update API routes to handle new fields
4. Update TypeScript types in frontend

## Next Steps

1. **Add Authentication** - Implement user login system
2. **Enhanced Analytics** - Add charts with Recharts
3. **Email Templates** - Create response templates
4. **Bulk Actions** - Select multiple leads for actions
5. **Export Functionality** - Export leads to CSV
6. **Advanced Filters** - Save filter presets
7. **Webhooks** - Real-time notifications
8. **API Rate Limiting** - Protect against abuse

## Support

For issues or questions about the dashboard:
1. Check the error logs in browser console
2. Review API logs with `npm run dev` in verbose mode
3. Verify all environment variables are set
4. Check database connectivity

## Tech Stack Summary

### Backend
- Node.js 20.x
- Express.js
- Supabase (PostgreSQL)
- Winston (logging)
- Node-cron (scheduling)

### Frontend
- React 18
- TypeScript
- Vite
- TanStack Query
- React Router DOM
- Tailwind CSS
- Lucide Icons
- Sonner (toasts)

## License
Private - Ovalay Lead Finder System