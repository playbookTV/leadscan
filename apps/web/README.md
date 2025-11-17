# 🚀 Leadscout Dashboard

A beautiful, modern dashboard built with **Vite + React + TypeScript + Hero UI** for managing your lead generation system.

## ✨ Features

- 🎨 **Beautiful UI** - Built with Hero UI component library
- 🔐 **Authentication** - Secure login with Supabase Auth
- 📊 **Analytics** - Interactive charts and performance metrics
- 🔍 **Advanced Filtering** - Search and filter leads by platform, status, score
- 📱 **Responsive** - Works perfectly on desktop, tablet, and mobile
- 🌙 **Dark Mode** - Full dark mode support
- ⚡ **Fast** - Built with Vite for lightning-fast development

## 📋 Prerequisites

- Node.js >= 18
- pnpm package manager
- Supabase account and project

## 🛠️ Installation

1. **Clone and navigate to the dashboard**
   ```bash
   cd leadscout-dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

   The dashboard will open at `http://localhost:5173`

## 📱 Pages

### Dashboard Home
- Overview stats (total leads, high priority, contacted, revenue)
- Recent leads list with quick actions
- At-a-glance metrics

### Leads Page
- Full leads list with pagination
- Advanced filtering (platform, status, score, search)
- Export to CSV
- Quick status updates

### Lead Detail Page
- Complete lead information
- Author profile and bio
- AI analysis and summary
- Project details (budget, timeline, technologies)
- Status management
- Notes and comments

### Analytics Page
- Platform distribution charts
- Lead status breakdown
- Score distribution analysis
- Performance metrics

### Keywords (Coming Soon)
- Manage search keywords
- Performance tracking
- Optimization suggestions

### Templates (Coming Soon)
- Pre-written response templates
- AI-generated personalized messages
- Template library

### Settings
- User preferences
- Notification settings
- API configuration

## 🎨 Tech Stack

- **Frontend Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **UI Library:** Hero UI 2
- **Styling:** Tailwind CSS 3
- **Routing:** React Router DOM 6
- **Backend:** Supabase (PostgreSQL + Auth)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Formatting:** date-fns

## 📂 Project Structure

```
leadscout-dashboard/
├── src/
│   ├── components/
│   │   └── layouts/
│   │       └── DashboardLayout.tsx    # Main layout with sidebar
│   ├── contexts/
│   │   └── AuthContext.tsx            # Authentication context
│   ├── lib/
│   │   └── supabase.ts                # Supabase client & types
│   ├── pages/
│   │   ├── LoginPage.tsx              # Login/auth page
│   │   ├── DashboardHome.tsx          # Home dashboard
│   │   ├── LeadsPage.tsx              # Leads list with filters
│   │   ├── LeadDetailPage.tsx         # Individual lead view
│   │   ├── AnalyticsPage.tsx          # Charts and analytics
│   │   ├── KeywordsPage.tsx           # Keyword management
│   │   ├── TemplatesPage.tsx          # Response templates
│   │   └── SettingsPage.tsx           # User settings
│   ├── App.tsx                        # Main app component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── public/                            # Static assets
├── index.html                         # HTML template
├── vite.config.ts                     # Vite configuration
├── tsconfig.json                      # TypeScript config
├── tailwind.config.js                 # Tailwind config
└── package.json                       # Dependencies

## 🔑 Authentication

The dashboard uses Supabase Auth for authentication. Users must sign in before accessing any pages.

**Demo Credentials:**
- Email: `admin@ovalay.com`
- Password: `demo1234`

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

The optimized build will be in the `dist/` directory.

### Deploy to Vercel

```bash
vercel --prod
```

### Deploy to Netlify

```bash
netlify deploy --prod --dir=dist
```

## 🎯 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Hero UI](https://heroui.com) - Beautiful component library
- [Supabase](https://supabase.com) - Backend as a service
- [Vite](https://vitejs.dev) - Next generation frontend tooling
- [Lucide](https://lucide.dev) - Beautiful icon library

---

Built with ❤️ by Ovalay Studios
