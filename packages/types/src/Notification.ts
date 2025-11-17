export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';
export type NotificationChannel = 'telegram' | 'email' | 'slack';
export type UserAction = 'contacted' | 'remind_later' | 'skip' | 'review_later';

export interface Notification {
  id: string;
  created_at: string;
  updated_at: string;

  // Reference
  lead_id: string;
  lead?: any; // Lead object when joined

  // Notification Details
  channel: NotificationChannel;
  status: NotificationStatus;
  sent_at?: string;
  read_at?: string;

  // Content
  message_text: string;
  message_id?: string; // Platform-specific message ID
  chat_id?: string; // For Telegram

  // User Interaction
  user_action?: UserAction;
  action_taken_at?: string;
  remind_at?: string;

  // Delivery Tracking
  delivery_attempts: number;
  last_error?: string;
  retry_after?: string;
}

export interface NotificationCreateInput extends Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'delivery_attempts'> {
  delivery_attempts?: number;
}

export interface NotificationStats {
  total_sent: number;
  total_read: number;
  total_acted_on: number;
  average_response_time_minutes?: number;
  by_action: {
    contacted: number;
    remind_later: number;
    skip: number;
    review_later: number;
  };
}