import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token (if needed)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Types
export interface Lead {
  id: string;
  platform: 'twitter' | 'linkedin';
  post_id: string;
  post_url: string;
  post_text: string;
  author_name: string;
  author_handle?: string;
  author_url: string;
  author_bio?: string;
  author_followers?: number;
  quick_score?: number;
  ai_score?: number;
  final_score?: number;
  ai_analysis?: any;
  status: 'new' | 'pending' | 'contacted' | 'reviewing' | 'won' | 'lost' | 'skipped';
  contacted_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Keyword {
  id: string;
  platform: 'twitter' | 'linkedin' | 'both';
  keyword: string;
  enabled: boolean;
  leads_found: number;
  conversion_rate?: number;
  last_checked?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface Stats {
  total: number;
  high_priority: number;
  contacted: number;
  new_leads: number;
  conversion_rate?: number;
  average_score?: number;
  won_leads?: number;
}

export interface Analytics {
  leads_by_platform: Record<string, number>;
  leads_by_status: Record<string, number>;
  leads_by_score: Array<{ score: number; count: number }>;
  daily_leads: Array<{ date: string; count: number }>;
  top_keywords: Array<{ keyword: string; leads: number; conversion: number }>;
  conversion_funnel: {
    new: number;
    contacted: number;
    won: number;
    lost: number;
  };
}

// API Functions

// Leads
export const leads = {
  list: async (params?: {
    platform?: string;
    status?: string;
    score_min?: number;
    score_max?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Lead>> => {
    const { data } = await api.get('/api/leads', { params });
    return data;
  },

  get: async (id: string): Promise<Lead> => {
    const { data } = await api.get(`/api/leads/${id}`);
    return data;
  },

  update: async (id: string, updates: Partial<Lead>): Promise<Lead> => {
    const { data } = await api.patch(`/api/leads/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/leads/${id}`);
  },

  addNote: async (id: string, note: string): Promise<Lead> => {
    const { data } = await api.post(`/api/leads/${id}/notes`, { note });
    return data;
  },

  stats: async (): Promise<Stats> => {
    const { data } = await api.get('/api/leads/stats/summary');
    return data;
  },

  action: async (id: string, action: 'contact' | 'skip' | 'win' | 'lose' | 'review', notes?: string): Promise<Lead> => {
    const { data } = await api.post(`/api/leads/${id}/action`, { action, notes });
    return data;
  }
};

// Keywords
export const keywords = {
  list: async (): Promise<Keyword[]> => {
    const { data } = await api.get('/api/keywords');
    return data;
  },

  get: async (id: string): Promise<Keyword> => {
    const { data } = await api.get(`/api/keywords/${id}`);
    return data;
  },

  create: async (keyword: Omit<Keyword, 'id' | 'created_at' | 'updated_at' | 'leads_found'>): Promise<Keyword> => {
    const { data } = await api.post('/api/keywords', keyword);
    return data;
  },

  update: async (id: string, updates: Partial<Keyword>): Promise<Keyword> => {
    const { data } = await api.patch(`/api/keywords/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/keywords/${id}`);
  }
};

// Analytics
export const analytics = {
  overview: async (period?: string): Promise<Analytics> => {
    const { data } = await api.get('/api/analytics/overview', { params: { period } });
    return data;
  },

  platforms: async (): Promise<Record<string, any>> => {
    const { data } = await api.get('/api/analytics/platforms');
    return data;
  },

  conversion: async (): Promise<any> => {
    const { data } = await api.get('/api/analytics/conversion');
    return data;
  },

  keywords: async (): Promise<any> => {
    const { data } = await api.get('/api/analytics/keywords');
    return data;
  }
};

// Settings
export const settings = {
  getConfig: async (): Promise<any> => {
    const { data } = await api.get('/api/settings/config');
    return data;
  },

  getHealth: async (): Promise<any> => {
    const { data } = await api.get('/health');
    return data;
  },

  getStats: async (): Promise<any> => {
    const { data } = await api.get('/stats');
    return data;
  }
};

export default api;