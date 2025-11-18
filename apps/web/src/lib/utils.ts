import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Tailwind CSS class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date utilities
export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Score utilities
export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600 bg-green-50';
  if (score >= 6) return 'text-yellow-600 bg-yellow-50';
  if (score >= 4) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 8) return 'bg-green-500';
  if (score >= 6) return 'bg-yellow-500';
  if (score >= 4) return 'bg-orange-500';
  return 'bg-red-500';
}

// Status utilities
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-indigo-100 text-indigo-800',
    reviewing: 'bg-purple-100 text-purple-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    skipped: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'New',
    pending: 'Pending',
    contacted: 'Contacted',
    reviewing: 'Reviewing',
    won: 'Won',
    lost: 'Lost',
    skipped: 'Skipped',
  };
  return labels[status] || status;
}

// Platform utilities
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitter: '𝕏',
    linkedin: 'in',
  };
  return icons[platform] || '?';
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    twitter: 'bg-black text-white',
    linkedin: 'bg-blue-600 text-white',
  };
  return colors[platform] || 'bg-gray-500 text-white';
}

// Truncate text
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Format numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Parse query params
export function parseQueryParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Build query string
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}