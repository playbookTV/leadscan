import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Lead {
  id: string
  created_at: string
  updated_at: string
  platform: 'twitter' | 'linkedin'
  post_id: string
  post_text: string
  post_url: string
  posted_at: string
  author_name: string | null
  author_handle: string | null
  author_profile_url: string | null
  author_followers_count: number
  author_verified: boolean
  author_bio: string | null
  author_location: string | null
  score: number
  quick_score: number | null
  ai_score: number | null
  has_budget: boolean
  has_urgency: boolean
  has_timeline: boolean
  has_contact_method: boolean
  budget_amount: string | null
  budget_min: number | null
  budget_max: number | null
  timeline: string | null
  technologies: string[] | null
  project_type: string | null
  ai_summary: string | null
  ai_confidence: number | null
  ai_red_flags: string[] | null
  ai_analysis_cost: number | null
  status: 'new' | 'reviewed' | 'contacted' | 'responded' | 'negotiating' | 'won' | 'lost' | 'ignored'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  contacted_at: string | null
  contacted_method: string | null
  response_received_at: string | null
  converted_at: string | null
  lost_at: string | null
  lost_reason: string | null
  project_value: number | null
  project_start_date: string | null
  project_duration_weeks: number | null
  notes: string | null
  tags: string[] | null
  assigned_to: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  engagement_rate: number | null
  competitor_comments: string[] | null
  response_speed_rank: number | null
  source_keyword: string | null
  matched_keywords: string[] | null
  is_duplicate: boolean
  duplicate_of: string | null
}

export interface Keyword {
  id: string
  created_at: string
  updated_at: string
  keyword: string
  platform: string | null
  is_active: boolean
  is_negative: boolean
  times_used: number
  leads_found: number
  high_score_leads: number
  leads_contacted: number
  leads_converted: number
  total_revenue: number
  conversion_rate: number | null
  avg_lead_score: number | null
  avg_response_time_hours: number | null
  last_used_at: string | null
  last_lead_found_at: string | null
  auto_disabled_at: string | null
  auto_disabled_reason: string | null
  category: string | null
}

export interface PollingLog {
  id: string
  created_at: string
  platform: string
  status: 'success' | 'partial' | 'error' | 'rate_limited' | 'skipped'
  started_at: string
  completed_at: string | null
  execution_time_ms: number | null
  posts_fetched: number
  posts_processed: number
  leads_created: number
  leads_high_priority: number
  duplicates_skipped: number
  api_calls_made: number
  api_rate_limit_remaining: number | null
  api_cost_usd: number | null
  keywords_searched: string[] | null
  best_performing_keyword: string | null
  error_message: string | null
  error_stack: string | null
  warnings: string[] | null
  memory_used_mb: number | null
  cpu_time_ms: number | null
}
