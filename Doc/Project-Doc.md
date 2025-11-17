# 🎯 LEAD FINDER - COMPLETE DOCUMENTATION

Let me run this through the full documentation gauntlet for you.

---

## 📋 PRODUCT REQUIREMENTS DOCUMENT (PRD)

### **1. EXECUTIVE SUMMARY**

**Product Name:** Ovalay Lead Finder  
**Version:** 1.0  
**Owner:** Leslie (Ovalay Studios)  
**Status:** Pre-Development  
**Target Launch:** Q1 2026  

**Problem Statement:**  
Ovalay Studios currently relies on manual Twitter/LinkedIn browsing to find web development project opportunities. This process is time-consuming, inconsistent, and causes us to miss time-sensitive opportunities where first responders often win the contract.

**Solution:**  
An automated lead generation system that monitors Twitter and LinkedIn 24/7, identifies relevant project opportunities, scores them by quality, and sends instant notifications - enabling sub-hour response times.

**Success Metrics:**
- **Primary:** 2-3 additional qualified leads per week
- **Primary:** Response time under 1 hour for high-priority leads
- **Secondary:** 10%+ conversion rate from qualified leads to projects
- **Secondary:** ROI of 100x within 6 months ($3k+ revenue per month from system)

---

### **2. GOALS & OBJECTIVES**

**Business Goals:**
1. Increase Ovalay Studios monthly project pipeline by 30-50%
2. Reduce time spent on manual lead hunting by 80%
3. Improve client acquisition cost efficiency
4. Gain competitive advantage through response speed

**User Goals (Internal Team):**
1. Get notified of opportunities immediately, not hours/days later
2. Focus time on high-quality leads only (reduce noise)
3. Have context about each lead before reaching out
4. Track what's working and optimize over time

**Technical Goals:**
1. Achieve 99%+ uptime for polling service
2. Process leads within 5 minutes of posting
3. Keep false positive rate under 20%
4. Maintain cost under $30/month

---

### **3. USER PERSONAS**

**Primary User: Leslie (Founder/Developer)**
- **Role:** CEO, Lead Developer, Sales at Ovalay Studios
- **Current Behavior:** Manually checks Twitter/LinkedIn 2-3 times daily for opportunities
- **Pain Points:** 
  - Misses opportunities posted outside check times
  - Wastes time scrolling through irrelevant posts
  - Responds too late, project already claimed
  - No systematic way to track what works
- **Goals:**
  - Respond to opportunities within minutes
  - Only see pre-filtered, high-quality leads
  - Track conversion rates to optimize strategy
- **Tech Savviness:** High (can troubleshoot issues, comfortable with APIs)

**Secondary User: Future Ovalay Team Members**
- **Role:** Sales, Account Managers
- **Current Behavior:** N/A (not yet hired)
- **Future Needs:** 
  - Simple dashboard to see available leads
  - Templates for outreach
  - Lead assignment system
- **Tech Savviness:** Medium (non-technical users)

---

### **4. FEATURES & REQUIREMENTS**

#### **4.1 CORE FEATURES (MVP - Must Have)**

**F1: Automated Platform Monitoring**
- **Description:** System polls Twitter and LinkedIn APIs every 30 minutes for new posts
- **Requirements:**
  - Support Twitter API v2 with OAuth 2.0
  - Support LinkedIn API with OAuth 2.0
  - Configurable search keywords (minimum 10 keywords)
  - Search posts from last 30 minutes only (avoid duplicates)
  - Handle API rate limits gracefully
- **Acceptance Criteria:**
  - Successfully polls both platforms every 30 minutes
  - Processes 100+ posts per polling cycle
  - No duplicate leads created
  - System recovers automatically from API errors

**F2: Intelligent Lead Scoring**
- **Description:** Multi-stage scoring system combining regex patterns and AI analysis
- **Requirements:**
  - Quick scoring (regex-based) for all posts
  - AI analysis (OpenAI) for posts scoring 5+ on quick score
  - Score range: 0-10
  - Identify: budget mentions, urgency signals, timeline, contact methods
  - Flag red flags (unpaid, equity-only, unrealistic expectations)
- **Acceptance Criteria:**
  - All leads receive a score 0-10
  - High-scoring leads (8+) have AI summary
  - Scoring completes within 10 seconds per lead
  - False positive rate under 20%

**F3: Real-Time Notifications**
- **Description:** Instant Telegram alerts for high-priority leads
- **Requirements:**
  - Send Telegram message for leads scoring 8+
  - Include: post text, author, platform, score, AI summary, direct links
  - Inline buttons: "Responded", "Skip", "Remind Later"
  - Maximum 2-minute delay from post creation to notification
- **Acceptance Criteria:**
  - Notifications arrive within 2 minutes of lead detection
  - All links in notification are clickable and correct
  - Inline buttons update lead status in database
  - No duplicate notifications for same lead

**F4: Lead Database & Management**
- **Description:** Supabase database storing all leads with full metadata
- **Requirements:**
  - Store: post data, author info, scores, AI analysis, engagement metrics
  - Track lead status: new, contacted, responded, won, lost, ignored
  - Prevent duplicate posts
  - Support bulk updates
  - Maintain historical data indefinitely
- **Acceptance Criteria:**
  - No duplicate post_ids in database
  - All required fields populated
  - Status transitions logged with timestamps
  - Query response time under 100ms

**F5: OAuth Token Management**
- **Description:** Secure storage and automatic refresh of API tokens
- **Requirements:**
  - Store Twitter and LinkedIn OAuth tokens encrypted
  - Auto-refresh tokens before expiration
  - Track token health (last used, error count)
  - Alert if tokens become invalid
- **Acceptance Criteria:**
  - Tokens never expire during operation
  - System alerts within 5 minutes of token failure
  - Tokens stored encrypted at rest
  - Manual token refresh available

#### **4.2 SECONDARY FEATURES (Post-MVP)**

**F6: Web Dashboard**
- Lead list view with filters (platform, score, status, date)
- Individual lead detail pages
- Quick actions (mark contacted, add notes, update status)
- Analytics charts (conversion funnel, daily volume, keyword performance)

**F7: Response Templates**
- AI-generated personalized outreach messages
- Template library by project type
- One-click copy to clipboard
- Track which templates convert best

**F8: Keyword Optimization**
- Track keyword performance (leads found, conversion rate, revenue)
- Auto-disable low-performing keywords
- Suggest new keywords based on successful leads
- A/B test keyword variations

**F9: Multi-User Support**
- Role-based access (admin, sales, viewer)
- Lead assignment and routing
- Activity logs per user
- Team performance metrics

---

### **5. USER STORIES**

**Epic: Lead Discovery**
- US1: As Leslie, I want the system to scan Twitter every 30 minutes so that I don't miss new opportunities
- US2: As Leslie, I want leads to be scored automatically so that I can focus on high-potential opportunities first
- US3: As Leslie, I want AI summaries of complex posts so that I can quickly understand if it's worth pursuing
- US4: As Leslie, I want to see engagement metrics (likes, comments) so that I can gauge competition level

**Epic: Notification & Response**
- US5: As Leslie, I want instant Telegram alerts for high-score leads so that I can respond within minutes
- US6: As Leslie, I want notification to include all key info so that I don't have to open the app to decide
- US7: As Leslie, I want direct links to the post and author profile so that I can respond in one click
- US8: As Leslie, I want to mark leads as "responded" from Telegram so that I don't forget which I've contacted

**Epic: Lead Management**
- US9: As Leslie, I want to see all leads in one place so that I can review opportunities at the end of day
- US10: As Leslie, I want to filter leads by score/platform/status so that I can organize my pipeline
- US11: As Leslie, I want to add notes to leads so that I can remember conversation context
- US12: As Leslie, I want to track which leads converted so that I can calculate ROI

**Epic: Optimization**
- US13: As Leslie, I want to see which keywords find the most leads so that I can optimize my search terms
- US14: As Leslie, I want to know my conversion rate by platform so that I can focus efforts appropriately
- US15: As Leslie, I want to see revenue attribution per lead so that I can prove system value
- US16: As Leslie, I want alerts if the system stops working so that I can fix it before missing opportunities

---

### **6. TECHNICAL CONSTRAINTS**

**API Limitations:**
- Twitter API Free Tier: 500k tweets/month, 1,500 tweets per 15-min window
- LinkedIn API: Very restrictive, may need RSS feed fallback
- OpenAI API: Cost scales with usage (~$0.15 per 1M input tokens)

**Rate Limits:**
- Twitter: 450 requests per 15 minutes (user auth)
- LinkedIn: 100 requests per day for search
- Telegram: 30 messages per second

**Infrastructure:**
- Must run 24/7 with minimal downtime
- Budget constraint: <$30/month total
- Response time: <2 minutes from post to notification

**Data Privacy:**
- Only store publicly available post data
- Encrypt OAuth tokens at rest
- No sharing of lead data to third parties
- Comply with Twitter/LinkedIn ToS

---

### **7. SUCCESS CRITERIA**

**Launch Criteria (Must achieve before considering MVP complete):**
- ✅ System polls both platforms successfully for 7 consecutive days
- ✅ Zero critical bugs in production
- ✅ Average false positive rate under 25%
- ✅ Notification delivery time under 2 minutes
- ✅ At least 5 high-quality leads found in first week

**30-Day Success Metrics:**
- Find 20+ qualified leads (score 7+)
- Contact 15+ leads within 1 hour
- Convert 2+ leads to projects
- System uptime >99%
- Cost under $30/month

**90-Day Success Metrics:**
- Find 60+ qualified leads
- Convert 6+ leads to projects (10% conversion)
- Generate $18k+ in revenue from system
- Response time average under 30 minutes
- False positive rate under 15%

---

### **8. RISKS & MITIGATIONS**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Twitter API access revoked | Low | Critical | Have LinkedIn as backup, monitor API compliance closely |
| High false positive rate | Medium | High | Implement AI filtering, tune scoring over time |
| Competitors also automate | Medium | Medium | Differentiate on response quality, not just speed |
| API costs exceed budget | Low | Medium | Set hard limits, monitor usage daily |
| System downtime during peak hours | Low | High | Use Railway's auto-restart, set up uptime monitoring |
| OAuth tokens expire unexpectedly | Medium | High | Implement auto-refresh, set up alerts |
| LinkedIn heavily rate-limits | High | Medium | Reduce polling frequency for LinkedIn, use RSS feeds |

---

### **9. OUT OF SCOPE (V1)**

**Not included in MVP:**
- ❌ Automated response/DM sending (legal risk)
- ❌ CRM integration (Salesforce, HubSpot)
- ❌ Browser extension component
- ❌ Instagram/Facebook monitoring
- ❌ Email finding/enrichment
- ❌ Multi-language support
- ❌ White-label/resale capability
- ❌ Mobile app
- ❌ Slack/Discord notifications
- ❌ Lead scoring customization UI

---

### **10. TIMELINE & PHASES**

**Phase 0: Setup (Week 1)**
- Day 1-2: Supabase project setup, schema creation
- Day 3-4: Twitter/LinkedIn OAuth setup
- Day 5-7: Development environment configuration

**Phase 1: Core Engine (Week 2-3)**
- Week 2: Polling service, API integration
- Week 3: Lead scoring logic, Supabase integration

**Phase 2: Notifications (Week 4)**
- Telegram bot setup
- Notification formatting
- Inline button handlers

**Phase 3: Testing & Tuning (Week 5-6)**
- Run in production, collect real data
- Tune scoring thresholds
- Fix false positives
- Optimize performance

**Phase 4: Launch (Week 7)**
- Full production deployment
- Documentation
- Monitoring setup

**Phase 5: Optimization (Month 2-3)**
- Analyze conversion data
- Refine keywords
- Improve scoring algorithm
- Add secondary features based on usage

---

### **11. DEPENDENCIES**

**External Services:**
- Twitter API access (apply, wait for approval: 1-7 days)
- LinkedIn API access (instant)
- OpenAI API key (instant)
- Telegram Bot Token (instant)
- Supabase account (instant)
- Railway/Vercel account (instant)

**Internal Resources:**
- Leslie's time: ~40 hours development
- Leslie's Twitter/LinkedIn accounts for OAuth
- Leslie's Telegram for notifications

---

### **12. OPEN QUESTIONS**

1. **Should we include Instagram monitoring?**  
   - Pros: Another lead source
   - Cons: API very restrictive, mostly DMs (hard to monitor)
   - Decision: Not for MVP, evaluate after LinkedIn proves valuable

2. **Should we auto-respond to leads?**  
   - Pros: Even faster response time
   - Cons: Legal risk, could seem spammy, against platform ToS
   - Decision: No - keep human in the loop

3. **Should we track competitors' activities?**  
   - Pros: Know who we're competing against
   - Cons: Creepy, against ToS, not actionable
   - Decision: No

4. **Should we expand to Design Jobcaster community later?**  
   - Pros: 4,000+ potential users, revenue opportunity
   - Cons: Support burden, legal complexity, infrastructure scaling
   - Decision: Evaluate after 6 months of internal use

---

## 🔧 TECHNICAL SPECIFICATION

### **1. SYSTEM ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Twitter  │  │ LinkedIn │  │  OpenAI  │  │ Telegram │   │
│  │   API    │  │   API    │  │   API    │  │   Bot    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │   RAILWAY (Hosting Platform)      │
        │                                    │
        │  ┌──────────────────────────────┐ │
        │  │   Polling Service (Node.js)  │ │
        │  │                              │ │
        │  │  ┌────────────────────────┐ │ │
        │  │  │  Cron Scheduler        │ │ │
        │  │  │  (Every 30 minutes)    │ │ │
        │  │  └───────┬────────────────┘ │ │
        │  │          │                  │ │
        │  │  ┌───────▼────────────────┐ │ │
        │  │  │  Platform Pollers      │ │ │
        │  │  │  - Twitter Poller      │ │ │
        │  │  │  - LinkedIn Poller     │ │ │
        │  │  └───────┬────────────────┘ │ │
        │  │          │                  │ │
        │  │  ┌───────▼────────────────┐ │ │
        │  │  │  Lead Processor        │ │ │
        │  │  │  - Deduplication       │ │ │
        │  │  │  - Quick Scoring       │ │ │
        │  │  │  - AI Analysis         │ │ │
        │  │  └───────┬────────────────┘ │ │
        │  │          │                  │ │
        │  │  ┌───────▼────────────────┐ │ │
        │  │  │  Notification Service  │ │ │
        │  │  │  - Telegram Alerts     │ │ │
        │  │  │  - Email Digests       │ │ │
        │  │  └───────┬────────────────┘ │ │
        │  └──────────┼──────────────────┘ │
        └─────────────┼────────────────────┘
                      │
        ┌─────────────▼────────────────┐
        │   SUPABASE (Backend)         │
        │                              │
        │  ┌────────────────────────┐  │
        │  │  PostgreSQL Database   │  │
        │  │  - leads               │  │
        │  │  - oauth_tokens        │  │
        │  │  - keywords            │  │
        │  │  - polling_logs        │  │
        │  └────────────────────────┘  │
        │                              │
        │  ┌────────────────────────┐  │
        │  │  REST API              │  │
        │  │  (Auto-generated)      │  │
        │  └────────────────────────┘  │
        │                              │
        │  ┌────────────────────────┐  │
        │  │  Realtime (Optional)   │  │
        │  │  For future dashboard  │  │
        │  └────────────────────────┘  │
        └──────────────────────────────┘
```

---

### **2. TECH STACK**

**Backend Service:**
- **Runtime:** Node.js 20.x
- **Language:** JavaScript (ES Modules)
- **Hosting:** Railway
- **Process Manager:** PM2 (for production stability)

**Database:**
- **Platform:** Supabase
- **Database:** PostgreSQL 15
- **ORM:** Supabase JS Client (no ORM needed)

**APIs & SDKs:**
- **Twitter:** twitter-api-v2 npm package
- **LinkedIn:** axios + custom implementation
- **OpenAI:** openai npm package
- **Telegram:** node-telegram-bot-api

**Utilities:**
- **Cron:** node-cron
- **Logging:** winston
- **Environment:** dotenv
- **HTTP Client:** axios

---

### **3. DATABASE SCHEMA (Detailed)**

```sql
-- LEADS TABLE
CREATE TABLE leads (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Post Data
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'linkedin')),
  post_id VARCHAR(255) UNIQUE NOT NULL,
  post_text TEXT NOT NULL,
  post_url TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL,
  
  -- Author Information
  author_name VARCHAR(255),
  author_handle VARCHAR(255),
  author_profile_url TEXT,
  author_followers_count INTEGER DEFAULT 0,
  author_verified BOOLEAN DEFAULT FALSE,
  author_bio TEXT,
  author_location VARCHAR(255),
  
  -- Lead Scoring
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  quick_score INTEGER, -- Score from regex analysis
  ai_score INTEGER, -- Additional score from AI
  has_budget BOOLEAN DEFAULT FALSE,
  has_urgency BOOLEAN DEFAULT FALSE,
  has_timeline BOOLEAN DEFAULT FALSE,
  has_contact_method BOOLEAN DEFAULT FALSE,
  
  -- Extracted Details
  budget_amount VARCHAR(50),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  timeline VARCHAR(100),
  technologies TEXT[], -- Array of mentioned techs
  project_type VARCHAR(50), -- 'website', 'landing_page', 'app', etc.
  
  -- AI Analysis
  ai_summary TEXT,
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_red_flags TEXT[],
  ai_analysis_cost DECIMAL(6,4), -- Track API costs
  
  -- Lead Management
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN (
    'new', 'reviewed', 'contacted', 'responded', 
    'negotiating', 'won', 'lost', 'ignored'
  )),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  contacted_at TIMESTAMPTZ,
  contacted_method VARCHAR(20), -- 'dm', 'comment', 'email'
  response_received_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason VARCHAR(100),
  
  -- Project Details (if won)
  project_value DECIMAL(10,2),
  project_start_date DATE,
  project_duration_weeks INTEGER,
  
  -- Internal Notes
  notes TEXT,
  tags TEXT[],
  assigned_to VARCHAR(255),
  
  -- Engagement Metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2), -- Calculated field
  
  -- Competition Analysis
  competitor_comments TEXT[], -- Track who else is responding
  response_speed_rank INTEGER, -- Were we first? second?
  
  -- Metadata
  source_keyword VARCHAR(255), -- Which keyword found this
  matched_keywords TEXT[], -- All keywords that matched
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES leads(id)
);

-- Indexes
CREATE INDEX idx_leads_platform ON leads(platform);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_posted_at ON leads(posted_at DESC);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_post_id ON leads(post_id);

-- Full-text search index
CREATE INDEX idx_leads_text_search ON leads USING GIN(to_tsvector('english', post_text));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- KEYWORDS TABLE
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  keyword TEXT NOT NULL,
  platform VARCHAR(20), -- NULL means all platforms
  is_active BOOLEAN DEFAULT TRUE,
  is_negative BOOLEAN DEFAULT FALSE, -- Exclusion keyword
  
  -- Performance Metrics
  times_used INTEGER DEFAULT 0,
  leads_found INTEGER DEFAULT 0,
  high_score_leads INTEGER DEFAULT 0, -- Score >= 8
  leads_contacted INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Calculated Metrics
  conversion_rate DECIMAL(5,2),
  avg_lead_score DECIMAL(4,2),
  avg_response_time_hours DECIMAL(6,2),
  
  -- Optimization
  last_used_at TIMESTAMPTZ,
  last_lead_found_at TIMESTAMPTZ,
  auto_disabled_at TIMESTAMPTZ,
  auto_disabled_reason TEXT,
  
  -- Categories
  category VARCHAR(50), -- 'budget', 'urgency', 'technology', 'project_type'
  
  UNIQUE(keyword, platform)
);

CREATE INDEX idx_keywords_active ON keywords(is_active);
CREATE INDEX idx_keywords_performance ON keywords(conversion_rate DESC, leads_found DESC);

-- OAUTH TOKENS TABLE
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  platform VARCHAR(20) UNIQUE NOT NULL CHECK (platform IN ('twitter', 'linkedin')),
  
  -- Token Data (encrypted at application level)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(20) DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  
  -- Health Monitoring
  is_valid BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Rate Limiting
  requests_today INTEGER DEFAULT 0,
  requests_this_hour INTEGER DEFAULT 0,
  rate_limit_reset_at TIMESTAMPTZ
);

-- POLLING LOGS TABLE
CREATE TABLE polling_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  platform VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'error', 'rate_limited', 'skipped')),
  
  -- Execution Details
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  
  -- Results
  posts_fetched INTEGER DEFAULT 0,
  posts_processed INTEGER DEFAULT 0,
  leads_created INTEGER DEFAULT 0,
  leads_high_priority INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  
  -- API Usage
  api_calls_made INTEGER DEFAULT 0,
  api_rate_limit_remaining INTEGER,
  api_cost_usd DECIMAL(6,4),
  
  -- Keywords Used
  keywords_searched TEXT[],
  best_performing_keyword VARCHAR(255),
  
  -- Errors
  error_message TEXT,
  error_stack TEXT,
  warnings TEXT[],
  
  -- Resource Usage
  memory_used_mb DECIMAL(8,2),
  cpu_time_ms INTEGER
);

CREATE INDEX idx_polling_logs_platform ON polling_logs(platform);
CREATE INDEX idx_polling_logs_created_at ON polling_logs(created_at DESC);
CREATE INDEX idx_polling_logs_status ON polling_logs(status);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) CHECK (notification_type IN ('telegram', 'email', 'webhook')),
  
  -- Delivery
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Content
  subject VARCHAR(255),
  body TEXT,
  
  -- Telegram Specific
  telegram_message_id INTEGER,
  telegram_chat_id BIGINT,
  
  -- Email Specific
  email_to VARCHAR(255),
  email_opened BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- USER ACTIONS TABLE (Track button clicks, etc.)
CREATE TABLE user_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'marked_contacted', 'marked_ignored', 'added_note', etc.
  action_data JSONB,
  user_id VARCHAR(255), -- For future multi-user support
  
  -- Context
  source VARCHAR(20) -- 'telegram', 'dashboard', 'api'
);

CREATE INDEX idx_user_actions_lead_id ON user_actions(lead_id);
CREATE INDEX idx_user_actions_created_at ON user_actions(created_at DESC);
```

---

### **4. API INTEGRATIONS**

#### **4.1 Twitter API v2**

**Authentication:**
- OAuth 2.0 with Bearer Token
- Requires: API Key, API Secret, Bearer Token, Access Token, Access Secret

**Endpoints Used:**
```
GET /2/tweets/search/recent
Parameters:
  - query: search terms with operators
  - max_results: 100 (max per request)
  - tweet.fields: created_at,author_id,public_metrics,entities
  - expansions: author_id
  - user.fields: name,username,verified,public_metrics,description,location
  - start_time: ISO timestamp (polls from last check)
```

**Rate Limits:**
- App auth: 450 requests per 15-min window
- User auth: 180 requests per 15-min window
- Monthly tweet cap: 500k tweets (free tier)

**Search Operators:**
```javascript
const buildTwitterQuery = (keyword) => {
  return `${keyword} -is:retweet -is:reply lang:en`
  // Excludes retweets, replies, non-English
}

// Example queries:
"need website -job -hiring -is:retweet lang:en"
"(looking for web developer) OR (need web dev) -job lang:en"
```

**Response Handling:**
```javascript
// Extract relevant data
const parseTweet = (tweet, author) => ({
  id: tweet.id,
  text: tweet.text,
  created_at: tweet.created_at,
  url: `https://twitter.com/${author.username}/status/${tweet.id}`,
  author: {
    name: author.name,
    username: author.username,
    verified: author.verified || false,
    followers: author.public_metrics.followers_count,
    bio: author.description,
    location: author.location
  },
  metrics: {
    likes: tweet.public_metrics.like_count,
    retweets: tweet.public_metrics.retweet_count,
    replies: tweet.public_metrics.reply_count,
    quotes: tweet.public_metrics.quote_count
  }
})
```

**Error Handling:**
- 429 Rate Limited → Wait until reset time, log
- 401 Unauthorized → Refresh token, retry
- 503 Service Unavailable → Retry with exponential backoff (max 3 retries)
- All errors logged to polling_logs table

#### **4.2 LinkedIn API**

**Authentication:**
- OAuth 2.0 Authorization Code Flow
- Scopes needed: r_basicprofile, r_emailaddress, w_member_social

**Challenge:**
LinkedIn API is VERY restrictive for searching posts. Alternative approaches:

**Approach A: LinkedIn API (Limited)**
```
GET /v2/ugcPosts
- Can only get posts from authenticated user's network
- No public search capability
- Rate limit: 100 requests/day
```

**Approach B: RSS Feeds (Recommended)**
```
LinkedIn generates RSS feeds for:
- Company pages: https://www.linkedin.com/company/{id}/posts
- Personal profiles: Limited
- Hashtags: https://www.linkedin.com/feed/hashtag/{hashtag}
```

Parse RSS with `rss-parser` npm package

**Approach C: Scraping (Risky)**
- Use Puppeteer to scrape search results
- Against ToS, risk of account ban
- Not recommended for production

**Recommended Strategy:**
1. Use LinkedIn API for user's network posts
2. Use RSS feeds for company pages and hashtags
3. Limit polling frequency (every 2 hours vs. 30 mins for Twitter)
4. Focus on high-value sources only

#### **4.3 OpenAI API**

**Model:** GPT-4o-mini (cost-effective, fast)

**Request Format:**
```javascript
const analyzePost = async (postText) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a lead qualification AI for Ovalay Studios, a web development agency.
        
Analyze social media posts to determine if they represent genuine project opportunities.

Consider:
- Budget indicators (specific amounts, willingness to pay)
- Timeline/urgency (deadlines, "ASAP", etc.)
- Project clarity (specific requirements vs. vague ideas)
- Legitimacy (real company/person vs. spam/scam)
- Fit (web dev, design, technologies we use)

Return JSON:
{
  "score": 0-5 (0=not opportunity, 5=perfect opportunity),
  "confidence": 0.0-1.0,
  "summary": "One sentence explaining the opportunity",
  "projectType": "website|app|landing_page|redesign|other",
  "estimatedBudget": "$X-Y" or "unknown",
  "timeline": "ASAP|weeks|months|unclear",
  "technologies": ["react", "nextjs", etc.],
  "redFlags": ["array of concerns"] or [],
  "reasoning": "Why this score was given"
}`
      },
      {
        role: "user",
        content: postText
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3, // Lower = more consistent
    max_tokens: 300 // Control cost
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

**Cost Management:**
- Only analyze posts scoring 5+ on quick regex check
- Track cost per analysis in database
- Set daily spending limit ($2/day = ~130 analyses)
- Cache analysis results (don't re-analyze duplicates)

**Rate Limits:**
- 10,000 requests per minute
- 2M tokens per minute
- Not a concern for our volume

#### **4.4 Telegram Bot API**

**Setup:**
1. Create bot via @BotFather
2. Get bot token
3. Start chat with bot, get chat ID via getUpdates

**Send Notification:**
```javascript
const sendLeadAlert = async (lead) => {
  const message = formatLeadMessage(lead) // See below
  
  await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Contacted', callback_data: `contacted_${lead.id}` },
          { text: '⏰ Remind 1h', callback_data: `remind_${lead.id}_1h` }
        ],
        [
          { text: '👀 Review Later', callback_data: `review_${lead.id}` },
          { text: '❌ Not Interested', callback_data: `ignore_${lead.id}` }
        ],
        [
          { text: '🔗 View Post', url: lead.post_url },
          { text: '👤 View Profile', url: lead.author_profile_url }
        ]
      ]
    }
  })
}

const formatLeadMessage = (lead) => {
  const emoji = lead.score >= 9 ? '🔥' : lead.score >= 8 ? '⭐' : '💡'
  
  return `
${emoji} *NEW LEAD* - Score: ${lead.score}/10

*${lead.author_name}* (@${lead.author_handle})
${lead.author_verified ? '✓ Verified' : ''} | ${lead.author_followers_count.toLocaleString()} followers
Platform: ${lead.platform === 'twitter' ? '🐦 Twitter' : '💼 LinkedIn'}

Posted ${getTimeAgo(lead.posted_at)}

*Post:*
_${truncate(lead.post_text, 200)}_

${lead.has_budget ? `💰 Budget: ${lead.budget_amount || 'Mentioned'}` : ''}
${lead.has_urgency ? '⚡ *URGENT*' : ''}
${lead.has_timeline ? `📅 Timeline: ${lead.timeline}` : ''}
${lead.technologies?.length ? `🛠 Tech: ${lead.technologies.join(', ')}` : ''}

${lead.ai_summary ? `\n🤖 *AI Summary:*\n${lead.ai_summary}` : ''}
${lead.ai_red_flags?.length ? `\n⚠️ Red Flags: ${lead.ai_red_flags.join(', ')}` : ''}

*Engagement:* ${lead.likes_count} ❤️ | ${lead.comments_count} 💬 | ${lead.shares_count} 🔄
`.trim()
}
```

**Handle Button Callbacks:**
```javascript
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data
  const [action, leadId, ...params] = data.split('_')
  
  switch (action) {
    case 'contacted':
      await db.updateLeadStatus(leadId, 'contacted')
      await bot.answerCallbackQuery(callbackQuery.id, { text: '✅ Marked as contacted' })
      break
      
    case 'ignore':
      await db.updateLeadStatus(leadId, 'ignored')
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Lead ignored' })
      break
      
    case 'remind':
      const hours = parseInt(params[0].replace('h', ''))
      await scheduleReminder(leadId, hours)
      await bot.answerCallbackQuery(callbackQuery.id, { text: `Reminder set for ${hours}h` })
      break
      
    case 'review':
      await db.updateLeadStatus(leadId, 'reviewed', { priority: 'low' })
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Saved for later review' })
      break
  }
})
```

**Rate Limits:**
- 30 messages per second per chat
- Not a concern for our volume

---

### **5. CORE ALGORITHMS**

#### **5.1 Lead Scoring Algorithm**

**Two-Stage Process:**

**Stage 1: Quick Regex Scoring (runs on ALL posts)**
```javascript
function calculateQuickScore(text) {
  let score = 0
  const lower = text.toLowerCase()
  
  // Budget Signals (+3 points)
  const budgetPatterns = [
    /\$[\d,]+k?/,
    /\d+k budget/,
    /budget.*\$\d/,
    /paying \$\d/,
    /\d+ dollars?/,
    /budget of \$?[\d,]+/
  ]
  if (budgetPatterns.some(p => p.test(lower))) {
    score += 3
  }
  
  // Urgency Signals (+2 points)
  const urgencyPatterns = [
    /\burgent\b/,
    /\basap\b/,
    /immediately/,
    /quick turnaround/,
    /need (by|before|within)/,
    /deadline/,
    /time[- ]sensitive/
  ]
  if (urgencyPatterns.some(p => p.test(lower))) {
    score += 2
  }
  
  // Timeline Mentioned (+1 point)
  const timelinePatterns = [
    /this week/,
    /next week/,
    /end of (month|week)/,
    /within \d+ (days?|weeks?)/,
    /by \w+ \d+/
  ]
  if (timelinePatterns.some(p => p.test(lower))) {
    score += 1
  }
  
  // Contact Method Provided (+2 points)
  const contactPatterns = [
    /@[\w.]+/,
    /dm me/,
    /send me a dm/,
    /email me/,
    /contact me at/,
    /reach out to/
  ]
  if (contactPatterns.some(p => p.test(lower))) {
    score += 2
  }
  
  // Technology Match (+1 point each, max 2)
  const technologies = [
    'react', 'nextjs', 'next.js', 'vue', 'angular',
    'webflow', 'framer', 'figma',
    'tailwind', 'typescript', 'javascript',
    'nodejs', 'node.js', 'express',
    'mongodb', 'postgresql', 'supabase'
  ]
  const matchedTechs = technologies.filter(tech => lower.includes(tech))
  score += Math.min(2, matchedTechs.length)
  
  // Project Type Clarity (+1 point)
  const projectTypes = [
    'website', 'web app', 'landing page', 'portfolio',
    'e-commerce', 'dashboard', 'saas', 'mvp'
  ]
  if (projectTypes.some(type => lower.includes(type))) {
    score += 1
  }
  
  // RED FLAGS (subtract points)
  const redFlags = [
    { pattern: /\bfree\b/, penalty: -3 },
    { pattern: /no budget/, penalty: -3 },
    { pattern: /unpaid/, penalty: -3 },
    { pattern: /for exposure/, penalty: -4 },
    { pattern: /portfolio piece/, penalty: -2 },
    { pattern: /equity only/, penalty: -2 },
    { pattern: /rev(enue)? share/, penalty: -2 },
    { pattern: /\$0\b/, penalty: -3 },
    { pattern: /volunteer/, penalty: -2 }
  ]
  
  redFlags.forEach(({ pattern, penalty }) => {
    if (pattern.test(lower)) score += penalty
  })
  
  // Clamp score to 0-10 range
  return Math.max(0, Math.min(10, score))
}
```

**Stage 2: AI Analysis (only for score >= 5)**
```javascript
async function enhanceWithAI(lead) {
  const aiAnalysis = await analyzeWithOpenAI(lead.post_text)
  
  // Combine scores
  const finalScore = Math.min(10, lead.quick_score + aiAnalysis.score)
  
  return {
    ...lead,
    score: finalScore,
    ai_score: aiAnalysis.score,
    ai_summary: aiAnalysis.summary,
    ai_confidence: aiAnalysis.confidence,
    ai_red_flags: aiAnalysis.redFlags,
    project_type: aiAnalysis.projectType,
    technologies: aiAnalysis.technologies,
    budget_amount: aiAnalysis.estimatedBudget,
    timeline: aiAnalysis.timeline
  }
}
```

**Priority Calculation:**
```javascript
function calculatePriority(lead) {
  if (lead.score >= 9 && lead.has_urgency) return 'urgent'
  if (lead.score >= 8) return 'high'
  if (lead.score >= 6) return 'medium'
  return 'low'
}
```

#### **5.2 Deduplication Algorithm**

```javascript
async function checkDuplicate(lead) {
  // Exact match by post_id
  const exactMatch = await db.leadExists(lead.post_id)
  if (exactMatch) return { isDuplicate: true, duplicateId: exactMatch.id }
  
  // Fuzzy match by text similarity (within 24 hours)
  const recentLeads = await db.getRecentLeads(24) // Last 24 hours
  
  for (const existingLead of recentLeads) {
    const similarity = calculateTextSimilarity(lead.post_text, existingLead.post_text)
    
    // If >80% similar text from same author, likely duplicate
    if (similarity > 0.8 && lead.author_handle === existingLead.author_handle) {
      return { isDuplicate: true, duplicateId: existingLead.id, similarity }
    }
  }
  
  return { isDuplicate: false }
}

function calculateTextSimilarity(text1, text2) {
  // Simple Jaccard similarity on word sets
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}
```

#### **5.3 Keyword Performance Tracking**

```javascript
async function updateKeywordPerformance() {
  // Run daily to calculate keyword effectiveness
  
  const keywords = await db.getAllActiveKeywords()
  
  for (const keyword of keywords) {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as leads_found,
        COUNT(*) FILTER (WHERE score >= 8) as high_score_leads,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
        COUNT(*) FILTER (WHERE status = 'won') as converted,
        SUM(project_value) as total_revenue,
        AVG(score) as avg_score
      FROM leads
      WHERE source_keyword = $1
        AND created_at >= NOW() - INTERVAL '30 days'
    `, [keyword.keyword])
    
    const conversionRate = stats.contacted > 0 
      ? (stats.converted / stats.contacted) * 100 
      : 0
    
    await db.updateKeyword(keyword.id, {
      leads_found: stats.leads_found,
      high_score_leads: stats.high_score_leads,
      leads_contacted: stats.contacted,
      leads_converted: stats.converted,
      total_revenue: stats.total_revenue,
      conversion_rate: conversionRate,
      avg_lead_score: stats.avg_score
    })
    
    // Auto-disable low performers
    if (stats.leads_found >= 50 && conversionRate < 2) {
      await db.disableKeyword(keyword.id, 'Low conversion rate (<2%)')
    }
  }
}
```

---

### **6. DEPLOYMENT CONFIGURATION**

#### **6.1 Railway Deployment**

**Project Structure:**
```
ovalay-lead-finder/
├── src/
│   ├── index.js                 # Main entry point
│   ├── config/
│   │   ├── database.js         # Supabase client
│   │   ├── twitter.js          # Twitter API client
│   │   ├── linkedin.js         # LinkedIn API client
│   │   └── openai.js           # OpenAI client
│   ├── services/
│   │   ├── polling.js          # Main polling orchestrator
│   │   ├── twitter-poller.js   # Twitter-specific polling
│   │   ├── linkedin-poller.js  # LinkedIn-specific polling
│   │   ├── lead-scorer.js      # Scoring algorithms
│   │   ├── notifier.js         # Telegram notifications
│   │   └── analytics.js        # Performance tracking
│   ├── utils/
│   │   ├── logger.js           # Winston logger
│   │   ├── errors.js           # Error handling
│   │   └── helpers.js          # Utility functions
│   └── cron/
│       └── jobs.js              # Cron job definitions
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── railway.json
```

**package.json:**
```json
{
  "name": "ovalay-lead-finder",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "node --test",
    "db:migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "node-cron": "^3.0.3",
    "node-telegram-bot-api": "^0.64.0",
    "openai": "^4.20.1",
    "rss-parser": "^3.13.0",
    "twitter-api-v2": "^1.15.2",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Environment Variables (Railway Dashboard):**
```bash
# Node
NODE_ENV=production

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
MAX_LEADS_PER_POLL=50
ENABLE_AI_ANALYSIS=true
AI_MIN_SCORE_THRESHOLD=5
```

#### **6.2 Main Entry Point**

```javascript
// src/index.js
import cron from 'node-cron'
import { pollAllPlatforms } from './services/polling.js'
import { updateKeywordPerformance } from './services/analytics.js'
import logger from './utils/logger.js'

// Health check endpoint (for Railway)
import http from 'http'
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200)
    res.end('OK')
  }
})
server.listen(process.env.PORT || 3000)

logger.info('🚀 Ovalay Lead Finder starting...')

// Main polling job - every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  logger.info('Starting scheduled polling cycle')
  try {
    await pollAllPlatforms()
  } catch (error) {
    logger.error('Polling cycle failed:', error)
  }
})

// Keyword performance analysis - daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Starting keyword performance analysis')
  try {
    await updateKeywordPerformance()
  } catch (error) {
    logger.error('Performance analysis failed:', error)
  }
})

// Token health check - every 6 hours
cron.schedule('0 */6 * * *', async () => {
  logger.info('Checking OAuth token health')
  try {
    await checkAndRefreshTokens()
  } catch (error) {
    logger.error('Token health check failed:', error)
  }
})

// Run immediately on startup
logger.info('Running initial polling cycle...')
pollAllPlatforms()
  .then(() => logger.info('Initial polling complete'))
  .catch(error => logger.error('Initial polling failed:', error))

logger.info('✅ Ovalay Lead Finder is running')
logger.info(`⏰ Polling every ${process.env.POLLING_INTERVAL_MINUTES || 30} minutes`)
logger.info(`📊 Minimum notification score: ${process.env.MIN_NOTIFICATION_SCORE || 8}`)
```

---

### **7. MONITORING & OBSERVABILITY**

#### **7.1 Logging Strategy**

**Log Levels:**
- **ERROR:** System failures, API errors, crashes
- **WARN:** Rate limits hit, missing data, retries
- **INFO:** Polling cycles, leads found, notifications sent
- **DEBUG:** Detailed execution flow (only in dev)

**Logging Format:**
```javascript
// utils/logger.js
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})

export default logger
```

#### **7.2 Health Checks**

**System Health Indicators:**
```javascript
async function getSystemHealth() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabaseHealth(),
    apis: await checkAPIHealth(),
    lastPolling: await getLastPollingTime(),
    todayStats: await getTodayStats()
  }
}

async function checkDatabaseHealth() {
  try {
    await db.query('SELECT 1')
    return { status: 'healthy', latency: 'calculated' }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

async function checkAPIHealth() {
  const checks = await Promise.allSettled([
    checkTwitterHealth(),
    checkLinkedInHealth(),
    checkOpenAIHealth(),
    checkTelegramHealth()
  ])
  
  return {
    twitter: checks[0].status === 'fulfilled' ? checks[0].value : 'error',
    linkedin: checks[1].status === 'fulfilled' ? checks[1].value : 'error',
    openai: checks[2].status === 'fulfilled' ? checks[2].value : 'error',
    telegram: checks[3].status === 'fulfilled' ? checks[3].value : 'error'
  }
}
```

#### **7.3 Alerting**

**Critical Alerts (sent to Telegram):**
- System has been down for >30 minutes
- No leads found in last 24 hours (possible API issue)
- OAuth tokens invalid
- Database connection lost
- Daily cost exceeds $5

```javascript
async function sendCriticalAlert(title, message) {
  await bot.sendMessage(TELEGRAM_CHAT_ID, `
🚨 *CRITICAL ALERT*

*${title}*

${message}

Time: ${new Date().toISOString()}
  `, { parse_mode: 'Markdown' })
}
```

#### **7.4 Analytics Dashboard (Supabase SQL)**

**Key Metrics to Track:**

```sql
-- Daily Performance
CREATE VIEW daily_performance AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE score >= 8) as high_priority_leads,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
  COUNT(*) FILTER (WHERE status = 'won') as won,
  SUM(project_value) as revenue,
  AVG(score) as avg_score,
  platform
FROM leads
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at), platform
ORDER BY date DESC;

-- Conversion Funnel
CREATE VIEW conversion_funnel AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status != 'new') as reviewed,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
  COUNT(*) FILTER (WHERE status IN ('negotiating', 'responded')) as engaged,
  COUNT(*) FILTER (WHERE status = 'won') as won,
  ROUND(COUNT(*) FILTER (WHERE status = 'won')::DECIMAL / COUNT(*) * 100, 2) as conversion_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Top Keywords
CREATE VIEW top_keywords AS
SELECT 
  keyword,
  leads_found,
  leads_converted,
  total_revenue,
  ROUND(conversion_rate, 2) as conversion_rate,
  ROUND(total_revenue / NULLIF(leads_found, 0), 2) as revenue_per_lead
FROM keywords
WHERE is_active = true
  AND leads_found > 0
ORDER BY total_revenue DESC
LIMIT 20;

-- Response Time Analysis
CREATE VIEW response_time_analysis AS
SELECT 
  DATE(posted_at) as date,
  platform,
  COUNT(*) as leads,
  AVG(EXTRACT(EPOCH FROM (contacted_at - posted_at))/3600) as avg_response_hours,
  COUNT(*) FILTER (WHERE contacted_at - posted_at < INTERVAL '1 hour') as responded_under_1h,
  COUNT(*) FILTER (WHERE contacted_at - posted_at < INTERVAL '24 hours') as responded_under_24h
FROM leads
WHERE contacted_at IS NOT NULL
  AND posted_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(posted_at), platform
ORDER BY date DESC;
```

---

### **8. SECURITY CONSIDERATIONS**

**OAuth Token Security:**
- Tokens stored in Supabase (encrypted at rest by Supabase)
- Never log tokens
- Rotate tokens every 30 days
- Use service role key (not anon key) for backend

**API Key Security:**
- All keys in Railway environment variables (encrypted)
- Never commit .env files
- Use different keys for dev/production
- Monitor for unauthorized usage

**Rate Limiting:**
- Respect platform rate limits
- Implement exponential backoff
- Log all rate limit hits
- Alert if consistently hitting limits

**Data Privacy:**
- Only store publicly available data
- Don't store private messages or DMs
- Comply with Twitter/LinkedIn ToS
- Don't share data with third parties

**Error Handling:**
- Never expose API keys in error messages
- Sanitize stack traces in logs
- Don't leak internal system details
- Rate limit failed authentication attempts

---

### **9. TESTING STRATEGY**

**Unit Tests:**
- Lead scoring algorithm
- Text similarity calculation
- Deduplication logic
- Keyword matching

**Integration Tests:**
- API connectivity (Twitter, LinkedIn, OpenAI)
- Database operations
- Notification delivery
- Token refresh flow

**End-to-End Tests:**
- Full polling cycle
- Lead processing pipeline
- Notification → action → database update

**Manual Testing Checklist:**
- [ ] Twitter OAuth connects successfully
- [ ] LinkedIn OAuth connects successfully
- [ ] Polling finds real leads
- [ ] High-score leads trigger Telegram notifications
- [ ] Telegram buttons update database correctly
- [ ] AI analysis provides relevant summaries
- [ ] Duplicates are caught and not re-notified
- [ ] System recovers from API errors
- [ ] Tokens refresh automatically before expiry

---

### **10. PERFORMANCE TARGETS**

**System Performance:**
- Polling cycle completion: <2 minutes
- Lead processing: <5 seconds per lead
- AI analysis: <3 seconds per lead
- Notification delivery: <30 seconds from detection
- Database query response: <100ms (95th percentile)

**Reliability:**
- Uptime: >99% (less than 7 hours downtime per month)
- Data loss: 0 leads lost due to system errors
- Duplicate rate: <1% of leads are duplicates

**Cost Targets:**
- Total monthly cost: <$30
- Cost per lead found: <$0.50
- Cost per conversion: <$20

---

## 🎨 UX SPECIFICATION

Since this is primarily a **backend system with Telegram UI**, the UX is simpler than a traditional product. However, there are still important UX considerations.

---

### **1. USER JOURNEY MAP**

**Persona: Leslie (Ovalay Studios Founder)**

**Context:** Leslie is working on client projects during the day. She wants to find new opportunities without spending time manually scrolling social media.

#### **Journey Stages:**

**1. System Setup (One-time, 30 minutes)**
```
Touchpoints:
- Railway dashboard (deploy)
- Twitter Developer Portal (OAuth)
- LinkedIn (OAuth)
- Telegram app (setup bot)
- Supabase (database)

Experience:
- Technical but straightforward
- Clear documentation needed
- Success confirmation important

Pain Points:
- API approval wait times
- OAuth configuration complexity
- Environment variable management

Success Metrics:
- Setup completed in <1 hour
- System runs successfully first time
- All APIs connected correctly
```

**2. Daily Operation (Ongoing)**
```
Morning (9 AM):
└─> Receives Telegram digest: "3 new leads overnight"
    └─> Clicks to view first lead
        └─> Reads AI summary: "SaaS company needs landing page, $5k budget"
        └─> Views post and author profile
        └─> Decision point:
            ├─> High quality → Clicks "Contacted" → Reaches out via Twitter
            └─> Not interested → Clicks "Not Interested"

Throughout Day:
└─> Working on client project
    └─> Phone buzzes: "🔥 NEW LEAD - Score: 9/10"
        └─> Glances at notification
        └─> Decision point:
            ├─> Urgent + high budget → Responds within 5 mins
            ├─> Good but not urgent → Clicks "Remind 1h"
            └─> Not right fit → Clicks "Not Interested"

Evening (6 PM):
└─> Reviews dashboard (optional)
    └─> Sees today's leads in context
    └─> Adds notes to promising leads
    └─> Updates lead statuses based on responses received
```

**3. Weekly Review (15 minutes)**
```
End of Week:
└─> Opens dashboard
    └─> Views metrics:
        ├─> Leads found: 15
        ├─> Contacted: 8
        ├─> Responses: 3
        └─> Conversions: 1 ($4,500 project)
    └─> Analyzes:
        ├─> Which keywords performed best?
        ├─> Which platform (Twitter vs LinkedIn)?
        ├─> What time of day are best leads posted?
    └─> Optimizes:
        └─> Adjusts keyword list based on performance
```

---

### **2. PRIMARY INTERFACE: TELEGRAM NOTIFICATIONS**

#### **Notification Design Principles:**

1. **Scannable at a Glance**
   - Score upfront (🔥 9/10 vs 💡 6/10)
   - Key info above the fold
   - Visual hierarchy with emojis

2. **Actionable**
   - One-click actions (buttons)
   - Direct links to post/profile
   - No need to open separate app

3. **Contextual**
   - Time-sensitive urgency indicators
   - Competition signals (engagement metrics)
   - AI-powered insights

#### **Notification Variations:**

**A. High-Priority Lead (Score 9-10)**
```
🔥 URGENT LEAD - Score: 9/10

Sarah Chen (@sarahchen)
✓ Verified | 15.2K followers
🐦 Twitter | Posted 5 minutes ago

Post:
"Need a React developer ASAP for SaaS dashboard. 
Budget $5-8k. Must start this week. DM if interested."

💰 Budget: $5-8k
⚡ URGENT - needs to start this week
🛠 Tech: React, SaaS dashboard
⚠️ Competition: Already 3 comments

🤖 AI Summary:
Legitimate SaaS company needs experienced React dev
for internal dashboard. Timeline is tight but budget
is solid. Good fit for Ovalay.

Engagement: 12 ❤️ | 3 💬 | 2 🔄

[✅ Contacted] [⏰ Remind 1h]
[👀 Review Later] [❌ Skip]
[🔗 View Post] [👤 View Profile]
```

**B. Medium-Priority Lead (Score 7-8)**
```
⭐ NEW LEAD - Score: 7/10

TechCorp (@techcorp_io)
12.8K followers
💼 LinkedIn | Posted 45 minutes ago

Post:
"Looking for a web developer to help us rebuild
our company website. Interested in modern stack,
preferably Next.js. Timeline flexible."

📅 Timeline: Flexible
🛠 Tech: Next.js, company website

Engagement: 8 ❤️ | 1 💬

[✅ Contacted] [👀 Review Later] [❌ Skip]
[🔗 View Post] [👤 View Profile]
```

**C. Low-Priority Alert (Score 6)**
```
💡 Lead Found - Score: 6/10

Anonymous User (@anon123)
340 followers
🐦 Twitter | Posted 2 hours ago

Post:
"Does anyone know a good web developer?
Need to build something soon."

⚠️ Vague requirements
⚠️ No budget mentioned

[👀 Review Later] [❌ Skip]
[🔗 View Post]
```

**D. Daily Digest (Morning Summary)**
```
🌅 Good Morning!

Overnight Summary:
📊 5 new leads found
├─ 1 high-priority (score 9+)
├─ 2 medium-priority (score 7-8)
└─ 2 low-priority (score 6)

Top Lead:
"SaaS company needs Next.js developer, $6k budget"
- Score: 9/10
- Posted: 3 hours ago
- Platform: Twitter

[View All Leads] [View Analytics]
```

---

### **3. NOTIFICATION INTERACTION FLOWS**

#### **Flow 1: Quick Accept**
```
User receives notification
↓
Reads summary (5 seconds)
↓
Clicks "✅ Contacted"
↓
Bot confirms: "✅ Marked as contacted"
↓
Lead status updated in database
↓
User switches to Twitter/LinkedIn to respond
```

**UX Considerations:**
- Instant feedback (< 1 second)
- Confirmation message reassuring
- No additional steps needed

#### **Flow 2: Remind Later**
```
User receives notification
↓
Busy with current work
↓
Clicks "⏰ Remind 1h"
↓
Bot confirms: "Reminder set for 1 hour"
↓
[60 minutes pass]
↓
Bot re-sends: "⏰ REMINDER: [lead details]"
```

**UX Considerations:**
- Respect user's flow state
- Configurable timing (1h, 2h, tomorrow)
- Easy to snooze again if still busy

#### **Flow 3: Defer to Dashboard**
```
User receives notification
↓
Not enough context to decide
↓
Clicks "👀 Review Later"
↓
Bot confirms: "Saved for review"
↓
Lead marked for evening review
↓
User opens dashboard at end of day
↓
Sees all "review later" leads grouped
```

**UX Considerations:**
- No decision pressure
- Batch processing option
- Clear queue management

---

### **4. SECONDARY INTERFACE: WEB DASHBOARD (Post-MVP)**

**Purpose:** Deep analysis, bulk actions, historical data

#### **Dashboard Sections:**

**A. Home / Overview**
```
┌─────────────────────────────────────────┐
│ Ovalay Lead Finder                      │
│                                         │
│ Today's Stats                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │  15  │ │   8  │ │   3  │ │$9.5k │  │
│ │Leads │ │Score │ │ New  │ │ Rev  │  │
│ │Found │ │  8+  │ │Resp. │ │ MTD  │  │
│ └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│ Active Leads           [Filter ▼]      │
│ ┌─────────────────────────────────────┐│
│ │ 🔥 9/10 | SaaS Dashboard | 2h ago  ││
│ │ Sarah Chen | $5-8k | React        ││
│ │ [View] [Contact] [Ignore]          ││
│ ├─────────────────────────────────────┤│
│ │ ⭐ 8/10 | Landing Page | 5h ago   ││
│ │ TechCorp | Budget TBD | Next.js   ││
│ │ [View] [Contact] [Ignore]          ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**B. Lead Detail View**
```
┌─────────────────────────────────────────┐
│ ← Back to Leads                         │
│                                         │
│ Lead #1234                              │
│ Score: 9/10 🔥                          │
│                                         │
│ Post Information                        │
│ Platform: Twitter                       │
│ Posted: 2 hours ago (Nov 14, 2:30 PM) │
│ Status: New → Contacted → Won          │
│                                         │
│ "Need a React developer ASAP..."       │
│                                         │
│ Author: Sarah Chen                      │
│ @sarahchen | 15.2K followers           │
│ ✓ Verified | Location: San Francisco  │
│                                         │
│ Project Details                         │
│ • Budget: $5-8k                        │
│ • Timeline: This week (URGENT)         │
│ • Tech: React, SaaS dashboard          │
│ • Type: Dashboard                       │
│                                         │
│ AI Analysis                             │
│ Confidence: 95%                         │
│ "Legitimate SaaS company needs..."     │
│                                         │
│ Engagement                              │
│ 12 ❤️ | 3 💬 | 2 🔄                   │
│                                         │
│ Timeline                                │
│ Nov 14, 2:30 PM - Lead found           │
│ Nov 14, 2:35 PM - Notified via Telegram│
│ Nov 14, 2:45 PM - Marked as contacted  │
│ Nov 14, 4:20 PM - Response received    │
│ Nov 15, 10:00 AM - Converted to project│
│                                         │
│ Notes                                   │
│ [Add note...]                           │
│                                         │
│ Actions                                 │
│ [Mark as Won] [Add to CRM] [Archive]   │
└─────────────────────────────────────────┘
```

**C. Analytics View**
```
┌─────────────────────────────────────────┐
│ Analytics                               │
│                                         │
│ Date Range: [Last 30 Days ▼]           │
│                                         │
│ Conversion Funnel                       │
│ ┌─────────────────────────────────────┐│
│ │ 120 Leads Found                     ││
│ │   ↓ 75% reviewed                    ││
│ │ 90 Reviewed                         ││
│ │   ↓ 56% contacted                   ││
│ │ 50 Contacted                        ││
│ │   ↓ 20% responded                   ││
│ │ 10 Responses                        ││
│ │   ↓ 60% converted                   ││
│ │ 6 Won ($27,500 revenue)             ││
│ └─────────────────────────────────────┘│
│                                         │
│ Platform Performance                    │
│ Twitter: 85 leads | 12% conversion     │
│ LinkedIn: 35 leads | 8% conversion     │
│                                         │
│ Top Keywords                            │
│ 1. "need website" - 25 leads, 3 won   │
│ 2. "looking for web dev" - 18 leads   │
│ 3. "nextjs developer" - 15 leads      │
│                                         │
│ Response Time Analysis                  │
│ Avg response: 2.5 hours                │
│ <1 hour: 35% | <24h: 85%              │
│                                         │
│ [Export Report] [Schedule Email]        │
└─────────────────────────────────────────┘
```

---

### **5. INFORMATION ARCHITECTURE**

```
Ovalay Lead Finder
│
├── Telegram Notifications (Primary Interface)
│   ├── Instant Alerts (high-priority leads)
│   ├── Daily Digest (morning summary)
│   ├── Reminders (snoozed leads)
│   └── System Alerts (errors, health)
│
└── Web Dashboard (Secondary Interface)
    ├── Home / Overview
    │   ├── Today's Stats
    │   ├── Active Leads List
    │   └── Quick Actions
    │
    ├── Leads
    │   ├── All Leads (filterable)
    │   ├── Lead Detail View
    │   └── Bulk Actions
    │
    ├── Analytics
    │   ├── Conversion Funnel
    │   ├── Platform Performance
    │   ├── Keyword Performance
    │   ├── Response Time Analysis
    │   └── Revenue Attribution
    │
    ├── Keywords
    │   ├── Active Keywords
    │   ├── Keyword Performance
    │   ├── Add/Remove Keywords
    │   └── A/B Testing
    │
    └── Settings
        ├── OAuth Connections
        ├── Notification Preferences
        ├── Scoring Thresholds
        └── System Health
```

---

### **6. INTERACTION PATTERNS**

#### **Notification Response Patterns:**

**Pattern 1: Immediate Action**
- User sees notification
- Makes decision within 30 seconds
- Takes action (contacted/ignored)
- Returns to work

**Pattern 2: Deferred Decision**
- User sees notification
- Not enough context or busy
- Snoozes for later
- Reviews in batch later

**Pattern 3: Passive Awareness**
- User glances at notification
- Doesn't interact
- Remembers for later
- Checks dashboard at end of day

#### **Dashboard Interaction Patterns:**

**Pattern 1: Daily Review**
- Opens dashboard once daily
- Scans all new leads
- Updates statuses based on responses
- Adds notes
- 5-10 minutes total

**Pattern 2: Weekly Analysis**
- Opens analytics section
- Reviews performance metrics
- Identifies trends
- Optimizes keywords
- 15-20 minutes total

**Pattern 3: Deep Dive**
- Investigating why conversion is low
- Reviews individual leads
- Looks for patterns
- Tests hypothesis
- 30-60 minutes

---

### **7. VISUAL DESIGN PRINCIPLES**

**For Telegram Notifications:**

1. **Hierarchy Through Emojis**
   - 🔥 = Urgent/highest priority
   - ⭐ = High priority
   - 💡 = Medium/low priority
   - ⚠️ = Warning/red flag

2. **Scannable Structure**
   - Score first (decision anchor)
   - Author next (credibility)
   - Post excerpt (content)
   - Key signals (budget, urgency, tech)
   - AI summary (context)
   - Actions (buttons)

3. **Progressive Disclosure**
   - Essential info in notification
   - More context in linked views
   - Full details in dashboard

**For Web Dashboard:**

1. **Data Visualization**
   - Graphs for trends over time
   - Funnels for conversion
   - Tables for detailed data
   - Cards for summaries

2. **Color Coding**
   - Green: Won/converted leads
   - Blue: Active/contacted leads
   - Yellow: Pending review
   - Red: Lost/ignored
   - Gray: Expired/old

3. **Responsive Design**
   - Mobile-first (check on phone)
   - Tablet-optimized (review in evening)
   - Desktop-full-featured (deep analysis)

---

### **8. ACCESSIBILITY CONSIDERATIONS**

**Telegram Notifications:**
- Use clear, descriptive text (screen reader friendly)
- Include text alternatives for all emojis in links
- High contrast between text and background
- Large touch targets for buttons

**Web Dashboard:**
- WCAG AA compliance minimum
- Keyboard navigation support
- Skip links for screen readers
- Alt text for all visualizations
- Color not sole indicator of meaning

---

### **9. ERROR STATES & EDGE CASES**

**Empty States:**

**No Leads Found Today:**
```
📭 No leads found yet today

The system is running normally. We're monitoring
Twitter and LinkedIn every 30 minutes.

Last check: 5 minutes ago
Next check: in 25 minutes

[View System Health] [Check Settings]
```

**System Error:**
```
⚠️ System Issue Detected

The polling service hasn't run in 2 hours.
This might indicate an API issue or downtime.

[View Error Logs] [Restart Service] [Get Support]
```

**No Internet Connection (Dashboard):**
```
📡 No Connection

Can't load latest leads. You're viewing
cached data from 2 hours ago.

[Retry Connection] [View Cached Data]
```

---

### **10. ONBOARDING FLOW**

**First-Time Setup:**

```
Step 1: Welcome
└─> "Welcome to Ovalay Lead Finder!"
    "Let's connect your accounts to start finding opportunities."
    [Get Started]

Step 2: Twitter Connection
└─> "Connect Your Twitter Account"
    "This allows us to search for opportunities on your behalf."
    [Connect Twitter]
    └─> OAuth flow
        └─> Success: "✅ Twitter connected!"

Step 3: LinkedIn Connection
└─> "Connect Your LinkedIn Account"
    "This expands your opportunity sources."
    [Connect LinkedIn] [Skip for Now]
    └─> OAuth flow
        └─> Success: "✅ LinkedIn connected!"

Step 4: Telegram Setup
└─> "Set Up Notifications"
    "Get instant alerts on your phone."
    [Open Telegram]
    └─> "Start chat with @OvalayLeadBot"
    └─> "/start"
        └─> Bot: "Connected! You'll receive alerts here."

Step 5: Keyword Preferences
└─> "What Are You Looking For?"
    "Select project types you want to find:"
    ☑ Websites
    ☑ Landing Pages
    ☑ Web Apps
    ☐ E-commerce
    ☐ Mobile Apps
    
    "Technologies you work with:"
    ☑ React/Next.js
    ☑ Webflow
    ☑ Figma to Code
    ☐ WordPress
    ☐ Shopify
    
    [Save Preferences]

Step 6: Test Run
└─> "Let's Test the System"
    "Running a quick search to make sure everything works..."
    [Start Test]
    └─> "✅ Found 3 sample leads!"
    └─> Shows sample notification
    └─> "This is what you'll receive on Telegram."
    [Looks Good!]

Step 7: Complete
└─> "🎉 You're All Set!"
    "Ovalay Lead Finder is now monitoring Twitter and LinkedIn
    for opportunities. You'll receive your first real alert within
    30 minutes."
    
    "What happens next:"
    • System checks every 30 minutes
    • High-priority leads sent to Telegram instantly
    • Daily summary every morning at 9 AM
    • Weekly performance report every Monday
    
    [Go to Dashboard] [View Documentation]
```

---

### **11. MICRO-INTERACTIONS**

**Button Press Feedback:**
- Click → Button color darkens
- Action processing → Spinner replaces text
- Success → Checkmark animation
- Error → Shake animation + error message

**Notification Animations:**
- New notification → Slide in from top
- Urgent → Pulse animation on badge
- Read → Fade to lower opacity
- Dismissed → Slide out to right

**Dashboard Updates:**
- New data → Subtle highlight flash
- Auto-refresh → Progress indicator at top
- Loading → Skeleton screens (not spinners)
- Empty → Friendly illustration + message

---

### **12. COPYWRITING GUIDELINES**

**Tone:**
- Professional but friendly
- Direct and actionable
- Encouraging without overselling
- Technical clarity without jargon

**Notification Copy:**
- Lead with score (data-driven decision)
- Use active voice
- Short sentences
- Specific numbers (not "high budget", use "$5-8k")
- Flags clearly marked (⚠️ prefix)

**Examples:**

❌ **Bad:** "We found a potential opportunity that might be interesting for your business that was recently posted on the Twitter platform."

✅ **Good:** "New lead found: SaaS company needs React developer. $6k budget, starting this week."

❌ **Bad:** "This individual seems legitimate based on our algorithmic analysis."

✅ **Good:** "✓ Verified account, 15K followers, company website in bio."

❌ **Bad:** "You should probably think about reaching out soon."

✅ **Good:** "⚡ URGENT - Already 3 competitors commenting. Respond now."

---

### **13. SUCCESS METRICS (UX)**

**Notification Effectiveness:**
- Click-through rate on notifications: >60%
- Time from notification to action: <5 minutes (urgent leads)
- False alarm rate: <20% (not interested clicks)

**Dashboard Engagement:**
- Daily active usage: 5-10 minutes
- Weekly analytics review: 80% of weeks
- Feature discovery: User finds and uses all major features within 2 weeks

**User Satisfaction:**
- Leslie feels confident leads aren't being missed: ✅
- Leslie saves 1+ hour/day vs. manual searching: ✅
- Leslie attributes 2+ projects/month to system: ✅

---

## 🚀 LAUNCH CHECKLIST

### **Pre-Launch:**
- [ ] All database tables created and indexed
- [ ] Twitter OAuth successfully connected
- [ ] LinkedIn OAuth successfully connected
- [ ] OpenAI API key working
- [ ] Telegram bot responding
- [ ] Railway deployment successful
- [ ] Environment variables configured
- [ ] System health checks passing

### **Launch Day:**
- [ ] Enable polling (let it run)
- [ ] Receive first test notification
- [ ] Verify database is populating
- [ ] Monitor error logs
- [ ] Track first 24 hours performance

### **Week 1:**
- [ ] Tune scoring thresholds
- [ ] Adjust keyword list
- [ ] Fix any critical bugs
- [ ] Confirm notifications arriving
- [ ] Measure false positive rate

### **Week 2-4:**
- [ ] Optimize polling frequency
- [ ] Refine AI prompts
- [ ] Add missing keywords
- [ ] Remove low-performing keywords
- [ ] Track first conversions

### **Month 2:**
- [ ] Calculate ROI
- [ ] Analyze conversion rates
- [ ] Platform performance comparison
- [ ] Decide on dashboard development
- [ ] Plan next features

---

**That's the complete documentation gauntlet! 📚**