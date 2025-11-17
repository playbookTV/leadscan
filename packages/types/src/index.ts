// Lead types
export * from './Lead';

// Keyword types
export * from './Keyword';

// Polling Log types
export * from './PollingLog';

// Notification types
export * from './Notification';

// OAuth Token types
export interface OAuthToken {
  id: string;
  created_at: string;
  updated_at: string;
  platform: 'twitter' | 'linkedin';
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  token_type?: string;
  scope?: string;
}

// Common utility types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
  per_page?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}