import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Bell, TrendingUp, Mail, AlertCircle } from 'lucide-react';
import { showLeadNotification, getNotificationPreference } from '../utils/notifications';

export function useRealtime() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Get API URL from environment
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Create socket connection
    socketRef.current = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Connected to real-time server');
      reconnectAttempts.current = 0;

      // Subscribe to lead updates
      socket.emit('subscribe-leads');

      // Show connection toast
      toast.success('Connected to real-time updates', {
        duration: 3000,
        icon: <Bell className="w-4 h-4" />
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from real-time server:', reason);

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      reconnectAttempts.current++;

      if (reconnectAttempts.current === maxReconnectAttempts) {
        toast.error('Unable to connect to real-time updates', {
          description: 'Please refresh the page to try again',
          duration: 5000,
          icon: <AlertCircle className="w-4 h-4" />
        });
      }
    });

    // Subscription confirmation
    socket.on('subscription-confirmed', ({ channel, timestamp }) => {
      console.log(`Subscribed to ${channel} at ${timestamp}`);
    });

    // Handle new lead notifications
    socket.on('new-lead', (notification: any) => {
      const lead = notification.data;
      console.log('🔔 New lead received:', lead);

      // Determine notification style based on score
      const score = lead.final_score || lead.score;
      let toastType: 'success' | 'info' = 'info';
      let icon = <Bell className="w-4 h-4" />;
      let title = `New Lead (${score}/10)`;

      if (score >= 8) {
        toastType = 'success';
        icon = <TrendingUp className="w-4 h-4" />;
        title = `🔥 High-Priority Lead (${score}/10)`;
      }

      // Show toast notification
      toast[toastType](title, {
        description: (
          <div>
            <p className="font-medium">{lead.author_name || 'Unknown'} on {lead.platform}</p>
            <p className="text-sm opacity-90 line-clamp-2">
              {lead.post_text?.substring(0, 100)}...
            </p>
          </div>
        ),
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/leads/${lead.id}`;
          }
        },
        duration: 10000,
        icon
      });

      // Play notification sound for high-score leads (if enabled)
      const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
      if (score >= 8 && soundEnabled) {
        playNotificationSound();
      }

      // Show browser notification if enabled
      if (getNotificationPreference()) {
        showLeadNotification(lead);
      }

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    // Handle lead updates
    socket.on('lead-updated', (notification: any) => {
      const { leadId, updates } = notification.data;
      console.log(`Lead ${leadId} updated:`, updates);

      // Invalidate lead-specific queries
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    // Handle lead status changes
    socket.on('lead-status-changed', (notification: any) => {
      const { leadId, oldStatus, newStatus } = notification.data;
      console.log(`Lead ${leadId} status changed: ${oldStatus} → ${newStatus}`);

      let message = `Lead status updated to ${newStatus}`;
      let icon = <Bell className="w-4 h-4" />;

      if (newStatus === 'contacted') {
        icon = <Mail className="w-4 h-4" />;
        message = 'Lead marked as contacted';
      } else if (newStatus === 'won') {
        message = '🎉 Lead converted to client!';
      }

      toast.info(message, {
        duration: 5000,
        icon
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    // Handle system messages
    socket.on('system-message', (message: any) => {
      const { level, message: text } = message;

      const toastLevel = level === 'error' ? 'error' :
                        level === 'warning' ? 'warning' :
                        level === 'success' ? 'success' : 'info';

      toast[toastLevel](text, {
        duration: 7000,
        icon: level === 'warning' ? <AlertCircle className="w-4 h-4" /> : undefined
      });
    });

    // Handle user notifications (for future multi-user support)
    socket.on('notification', (notification: any) => {
      console.log('User notification:', notification);

      toast.info(notification.title || 'Notification', {
        description: notification.message,
        duration: 8000
      });
    });

    // Periodic ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds

    socket.on('pong', ({ timestamp }) => {
      console.log('Pong received, latency:', Date.now() - timestamp, 'ms');
    });

    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval);

      if (socketRef.current) {
        socketRef.current.emit('unsubscribe-leads');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [queryClient]);

  return {
    isConnected: socketRef.current?.connected || false,
    socket: socketRef.current
  };
}

// Helper function to play notification sound
function playNotificationSound() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}