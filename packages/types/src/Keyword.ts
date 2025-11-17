export type KeywordStatus = 'active' | 'paused' | 'archived';

export interface Keyword {
  id: string;
  created_at: string;
  updated_at: string;

  // Core Fields
  keyword: string;
  platform: 'twitter' | 'linkedin' | 'both';
  status: KeywordStatus;

  // Performance Metrics
  searches_count: number;
  leads_found: number;
  leads_converted: number;
  conversion_rate?: number;
  average_score?: number;

  // Revenue Attribution
  revenue_generated: number;
  average_project_value?: number;

  // Tuning
  min_score?: number; // Minimum score to consider a lead
  boost_factor?: number; // Multiply score by this factor
  negative_keywords?: string[]; // Words that should exclude a result

  // Metadata
  last_searched_at?: string;
  notes?: string;
  created_by?: string;
}

export interface KeywordCreateInput extends Omit<Keyword, 'id' | 'created_at' | 'updated_at' | 'searches_count' | 'leads_found' | 'leads_converted' | 'revenue_generated'> {}

export interface KeywordUpdateInput extends Partial<Omit<Keyword, 'id' | 'created_at' | 'keyword'>> {}