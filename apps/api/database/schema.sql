-- Lead Finder Database Schema
-- PostgreSQL 15 with Supabase
-- Complete implementation based on Project-Doc.md Section 3

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LEADS TABLE
-- ============================================================================
CREATE TABLE leads (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Post Data
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit')),
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

-- ============================================================================
-- OAUTH_TOKENS TABLE
-- ============================================================================
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

-- ============================================================================
-- KEYWORDS TABLE
-- ============================================================================
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

-- ============================================================================
-- POLLING_LOGS TABLE
-- ============================================================================
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

-- ============================================================================
-- EMAIL_LOGS TABLE
-- ============================================================================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),

  message_id VARCHAR(255),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  error_message TEXT,

  template_name VARCHAR(100),
  template_data JSONB
);

CREATE INDEX idx_email_logs_lead_id ON email_logs(lead_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
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

-- ============================================================================
-- USER_ACTIONS TABLE
-- ============================================================================
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Default keywords for website design, app design, and branding agency
INSERT INTO keywords (keyword, platform, category, is_active) VALUES
  -- WEBSITE DESIGN
  ('need website', NULL, 'Website Design', true),
  ('looking for web designer', NULL, 'Website Design', true),
  ('website design help', NULL, 'Website Design', true),
  ('need website designer', NULL, 'Website Design', true),
  ('redesign website', NULL, 'Website Design', true),
  ('website redesign', NULL, 'Website Design', true),
  ('professional website', NULL, 'Website Design', true),
  ('business website', NULL, 'Website Design', true),
  ('company website', NULL, 'Website Design', true),
  ('portfolio website', NULL, 'Website Design', true),
  ('ecommerce website', NULL, 'Website Design', true),
  ('e-commerce site', NULL, 'Website Design', true),
  ('custom website', NULL, 'Website Design', true),
  ('modern website', NULL, 'Website Design', true),
  ('responsive website', NULL, 'Website Design', true),

  -- WEB DEVELOPMENT
  ('need web developer', NULL, 'Web Development', true),
  ('looking for web developer', NULL, 'Web Development', true),
  ('hire web developer', NULL, 'Web Development', true),
  ('web development help', NULL, 'Web Development', true),
  ('frontend developer', NULL, 'Web Development', true),
  ('fullstack developer', NULL, 'Web Development', true),
  ('react developer', NULL, 'Web Development', true),
  ('nextjs developer', NULL, 'Web Development', true),
  ('vue developer', NULL, 'Web Development', true),
  ('angular developer', NULL, 'Web Development', true),

  -- LANDING PAGES
  ('need landing page', NULL, 'Landing Page', true),
  ('landing page design', NULL, 'Landing Page', true),
  ('sales page', NULL, 'Landing Page', true),
  ('product landing page', NULL, 'Landing Page', true),
  ('conversion landing page', NULL, 'Landing Page', true),
  ('high converting landing page', NULL, 'Landing Page', true),

  -- MOBILE APP DESIGN
  ('app design', NULL, 'App Design', true),
  ('mobile app design', NULL, 'App Design', true),
  ('ios app design', NULL, 'App Design', true),
  ('android app design', NULL, 'App Design', true),
  ('app designer needed', NULL, 'App Design', true),
  ('need app designer', NULL, 'App Design', true),
  ('looking for app designer', NULL, 'App Design', true),
  ('app ui design', NULL, 'App Design', true),
  ('app ux design', NULL, 'App Design', true),
  ('mobile app ui', NULL, 'App Design', true),
  ('app interface design', NULL, 'App Design', true),
  ('app mockup', NULL, 'App Design', true),
  ('app prototype', NULL, 'App Design', true),

  -- WEB APP / SAAS
  ('web app design', NULL, 'Web App', true),
  ('saas design', NULL, 'Web App', true),
  ('saas dashboard', NULL, 'Web App', true),
  ('dashboard design', NULL, 'Web App', true),
  ('admin panel design', NULL, 'Web App', true),
  ('web application design', NULL, 'Web App', true),
  ('platform design', NULL, 'Web App', true),
  ('software design', NULL, 'Web App', true),

  -- BRANDING & IDENTITY
  ('logo design', NULL, 'Branding', true),
  ('brand design', NULL, 'Branding', true),
  ('branding help', NULL, 'Branding', true),
  ('need logo designer', NULL, 'Branding', true),
  ('brand identity', NULL, 'Branding', true),
  ('visual identity', NULL, 'Branding', true),
  ('corporate identity', NULL, 'Branding', true),
  ('brand guidelines', NULL, 'Branding', true),
  ('style guide', NULL, 'Branding', true),
  ('rebrand', NULL, 'Branding', true),
  ('rebranding help', NULL, 'Branding', true),
  ('logo redesign', NULL, 'Branding', true),
  ('brand refresh', NULL, 'Branding', true),
  ('company branding', NULL, 'Branding', true),
  ('startup branding', NULL, 'Branding', true),
  ('brand strategy', NULL, 'Branding', true),

  -- UI/UX DESIGN
  ('ui design', NULL, 'UI/UX', true),
  ('ux design', NULL, 'UI/UX', true),
  ('ui designer', NULL, 'UI/UX', true),
  ('ux designer', NULL, 'UI/UX', true),
  ('ui ux designer', NULL, 'UI/UX', true),
  ('user interface design', NULL, 'UI/UX', true),
  ('user experience design', NULL, 'UI/UX', true),
  ('product design', NULL, 'UI/UX', true),
  ('product designer', NULL, 'UI/UX', true),
  ('interaction design', NULL, 'UI/UX', true),
  ('wireframe', NULL, 'UI/UX', true),
  ('prototype design', NULL, 'UI/UX', true),

  -- DESIGN TOOLS / PLATFORMS
  ('figma design', NULL, 'Design Tools', true),
  ('figma designer', NULL, 'Design Tools', true),
  ('figma to code', NULL, 'Design Tools', true),
  ('webflow design', NULL, 'Design Tools', true),
  ('webflow designer', NULL, 'Design Tools', true),
  ('webflow developer', NULL, 'Design Tools', true),
  ('framer designer', NULL, 'Design Tools', true),
  ('framer website', NULL, 'Design Tools', true),
  ('wordpress design', NULL, 'Design Tools', true),
  ('shopify design', NULL, 'Design Tools', true),
  ('squarespace design', NULL, 'Design Tools', true),

  -- GRAPHIC DESIGN
  ('graphic design', NULL, 'Graphic Design', true),
  ('graphic designer', NULL, 'Graphic Design', true),
  ('marketing design', NULL, 'Graphic Design', true),
  ('social media design', NULL, 'Graphic Design', true),
  ('presentation design', NULL, 'Graphic Design', true),
  ('pitch deck design', NULL, 'Graphic Design', true),
  ('infographic design', NULL, 'Graphic Design', true),
  ('print design', NULL, 'Graphic Design', true),
  ('business card design', NULL, 'Graphic Design', true),
  ('flyer design', NULL, 'Graphic Design', true),
  ('brochure design', NULL, 'Graphic Design', true),

  -- PROJECT TYPES
  ('startup website', NULL, 'Startup', true),
  ('startup design', NULL, 'Startup', true),
  ('mvp design', NULL, 'Startup', true),
  ('minimum viable product', NULL, 'Startup', true),
  ('tech startup', NULL, 'Startup', true),
  ('b2b website', NULL, 'Business', true),
  ('b2c website', NULL, 'Business', true),
  ('enterprise website', NULL, 'Business', true),
  ('small business website', NULL, 'Business', true),
  ('agency website', NULL, 'Business', true),
  ('consulting website', NULL, 'Business', true),

  -- INDUSTRY SPECIFIC
  ('fintech design', NULL, 'Industry', true),
  ('healthtech design', NULL, 'Industry', true),
  ('edtech design', NULL, 'Industry', true),
  ('crypto website', NULL, 'Industry', true),
  ('blockchain design', NULL, 'Industry', true),
  ('nft website', NULL, 'Industry', true),
  ('ai product design', NULL, 'Industry', true),

  -- URGENCY SIGNALS (combined with service types)
  ('need designer asap', NULL, 'Urgent', true),
  ('urgent design help', NULL, 'Urgent', true),
  ('designer needed immediately', NULL, 'Urgent', true),
  ('quick turnaround design', NULL, 'Urgent', true),

  -- BUDGET SIGNALS
  ('paid design work', NULL, 'Budget', true),
  ('design budget', NULL, 'Budget', true),
  ('looking to hire designer', NULL, 'Budget', true),
  ('design quote', NULL, 'Budget', true),
  ('design proposal', NULL, 'Budget', true)
ON CONFLICT (keyword, platform) DO NOTHING;