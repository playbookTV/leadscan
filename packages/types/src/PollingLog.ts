export type PollingStatus = 'running' | 'completed' | 'failed';
export type PollerType = 'twitter' | 'linkedin' | 'all';

export interface PollingLog {
  id: string;
  created_at: string;
  updated_at: string;

  // Execution Details
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  status: PollingStatus;
  poller_type: PollerType;

  // Results
  posts_checked: number;
  new_leads_found: number;
  duplicates_skipped: number;
  high_score_leads: number; // Score >= 8

  // API Usage
  twitter_requests?: number;
  linkedin_requests?: number;
  openai_requests?: number;
  openai_cost?: number;

  // Errors
  error_message?: string;
  error_details?: Record<string, any>;
  failed_keywords?: string[];

  // Performance
  average_processing_time_ms?: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
}

export interface PollingLogCreateInput extends Omit<PollingLog, 'id' | 'created_at' | 'updated_at'> {}

export interface PollingStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  average_duration_ms: number;
  total_leads_found: number;
  total_api_cost: number;
  last_run_at?: string;
  next_run_at?: string;
}