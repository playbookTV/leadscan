-- Lead Finder Database Schema
-- PostgreSQL 15 with Supabase

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
  quick_score INTEGER CHECK (quick_score >= 0 AND quick_score <= 10),
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 10),
  has_budget BOOLEAN DEFAULT FALSE,
  has_urgency BOOLEAN DEFAULT FALSE,
  has_timeline BOOLEAN DEFAULT FALSE,
  has_contact_method BOOLEAN DEFAULT FALSE,
  
  -- Extracted Details
  budget_amount VARCHAR(50),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  timeline VARCHAR(255),
  project_type VARCHAR(100),
  tech_stack TEXT[],
  red_flags TEXT[],
  
  -- AI Analysis
  ai_summary TEXT,
  ai_confidence DECIMAL(5,2),
  ai_reasoning TEXT,
  
  -- Engagement Metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Lead Management
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'won', 'lost', 'ignored')),
  contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  outcome VARCHAR(20) CHECK (outcome IN ('won', 'lost', 'no_response', 'not_fit', NULL)),
  revenue DECIMAL(10,2),
  notes TEXT,
  
  -- Metadata
  keywords_matched TEXT[],
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ
);

-- ============================================================================
-- OAUTH_TOKENS TABLE
-- ============================================================================
CREATE TABLE oauth_tokens (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Platform
  platform VARCHAR(20) NOT NULL UNIQUE CHECK (platform IN ('twitter', 'linkedin')),
  
  -- OAuth Credentials
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  
  -- Token Health
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ
);

-- ============================================================================
-- KEYWORDS TABLE
-- ============================================================================
CREATE TABLE keywords (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Keyword Data
  keyword VARCHAR(255) UNIQUE NOT NULL,
  platform VARCHAR(20) CHECK (platform IN ('twitter', 'linkedin', 'both')),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Performance Metrics
  leads_found INTEGER DEFAULT 0,
  high_score_leads INTEGER DEFAULT 0,
  contacted_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  category VARCHAR(100),
  notes TEXT
);

-- ============================================================================
-- POLLING_LOGS TABLE
-- ============================================================================
CREATE TABLE polling_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Polling Details
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'linkedin')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Results
  posts_fetched INTEGER DEFAULT 0,
  leads_created INTEGER DEFAULT 0,
  leads_updated INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  
  -- Error Tracking
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  keywords_used TEXT[],
  api_calls_made INTEGER DEFAULT 0
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notification Data
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('telegram', 'email', 'webhook')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'clicked')),
  
  -- Delivery Details
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Telegram Specific
  telegram_message_id VARCHAR(255),
  telegram_chat_id VARCHAR(255)
);

-- ============================================================================
-- USER_ACTIONS TABLE
-- ============================================================================
CREATE TABLE user_actions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Action Data
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('viewed', 'contacted', 'responded', 'snoozed', 'ignored', 'won', 'lost', 'note_added')),
  source VARCHAR(20) CHECK (source IN ('telegram', 'dashboard', 'api')),
  
  -- Action Details
  metadata JSONB,
  note TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Leads table indexes
CREATE INDEX idx_leads_platform ON leads(platform);
CREATE INDEX idx_leads_post_id ON leads(post_id);
CREATE INDEX idx_leads_posted_at ON leads(posted_at DESC);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_platform_posted_at ON leads(platform, posted_at DESC);
CREATE INDEX idx_leads_status_score ON leads(status, score DESC);

-- OAuth tokens indexes
CREATE INDEX idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX idx_oauth_tokens_is_active ON oauth_tokens(is_active);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Keywords indexes
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
CREATE INDEX idx_keywords_is_active ON keywords(is_active);
CREATE INDEX idx_keywords_performance ON keywords(conversion_count DESC, leads_found DESC);

-- Polling logs indexes
CREATE INDEX idx_polling_logs_platform ON polling_logs(platform);
CREATE INDEX idx_polling_logs_status ON polling_logs(status);
CREATE INDEX idx_polling_logs_created_at ON polling_logs(created_at DESC);
CREATE INDEX idx_polling_logs_platform_created_at ON polling_logs(platform, created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- User actions indexes
CREATE INDEX idx_user_actions_lead_id ON user_actions(lead_id);
CREATE INDEX idx_user_actions_action_type ON user_actions(action_type);
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Default keywords for web development leads
INSERT INTO keywords (keyword, platform, category, is_active) VALUES
  ('need website', 'both', 'General Web', true),
  ('looking for web developer', 'both', 'General Web', true),
  ('need web dev', 'both', 'General Web', true),
  ('hire react developer', 'both', 'React', true),
  ('nextjs developer needed', 'both', 'React', true),
  ('looking for nextjs', 'both', 'React', true),
  ('need landing page', 'both', 'Landing Page', true),
  ('saas dashboard', 'both', 'SaaS', true),
  ('web app developer', 'both', 'Web App', true),
  ('figma to code', 'both', 'Design to Code', true),
  ('webflow developer', 'both', 'Webflow', true),
  ('need frontend developer', 'both', 'Frontend', true),
  ('hiring web developer', 'both', 'General Web', true),
  ('website project', 'both', 'General Web', true),
  ('web development help', 'both', 'General Web', true)
ON CONFLICT (keyword) DO NOTHING;
