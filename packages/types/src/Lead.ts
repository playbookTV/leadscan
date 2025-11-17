export type Platform = 'twitter' | 'linkedin';
export type LeadStatus =
  | 'new'
  | 'reviewed'
  | 'contacted'
  | 'responded'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'ignored';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ContactMethod = 'dm' | 'comment' | 'email';

export interface Lead {
  // Identity
  id: string;
  created_at: string;
  updated_at: string;

  // Post Data
  platform: Platform;
  post_id: string;
  post_text: string;
  post_url: string;
  posted_at: string;

  // Author Information
  author_name?: string;
  author_handle?: string;
  author_profile_url?: string;
  author_followers_count?: number;
  author_verified?: boolean;
  author_bio?: string;
  author_location?: string;

  // Lead Scoring
  score: number; // 0-10
  quick_score?: number;
  ai_score?: number;
  has_budget?: boolean;
  has_urgency?: boolean;
  has_timeline?: boolean;
  has_contact_method?: boolean;

  // Extracted Details
  budget_amount?: string;
  budget_min?: number;
  budget_max?: number;
  timeline?: string;
  technologies?: string[];
  project_type?: string;

  // AI Analysis
  ai_summary?: string;
  ai_confidence?: number; // 0-1
  ai_red_flags?: string[];
  ai_analysis_cost?: number;

  // Lead Management
  status: LeadStatus;
  priority: Priority;
  contacted_at?: string;
  contacted_method?: ContactMethod;
  response_received_at?: string;
  converted_at?: string;
  lost_at?: string;
  lost_reason?: string;

  // Project Details (if won)
  project_value?: number;
  project_start_date?: string;
  project_duration_weeks?: number;

  // Internal Notes
  notes?: string;
  tags?: string[];
  assigned_to?: string;

  // Engagement Metrics
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  engagement_rate?: number;

  // Competition Analysis
  competitor_comments?: string[];
  response_speed_rank?: number;

  // Metadata
  source_keyword?: string;
  matched_keywords?: string[];
  is_duplicate?: boolean;
  duplicate_of?: string;
}

export interface LeadCreateInput extends Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'status'> {
  status?: LeadStatus;
}

export interface LeadUpdateInput extends Partial<Omit<Lead, 'id' | 'created_at' | 'platform' | 'post_id'>> {}