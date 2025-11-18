import { Server } from 'socket.io';
import logger from '../utils/logger.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('WebSocket server initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, {
        connectedAt: new Date(),
        subscriptions: []
      });

      // Handle client disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle lead updates subscription
      socket.on('subscribe-leads', () => {
        socket.join('leads-updates');
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.subscriptions.push('leads-updates');
        }
        logger.info(`Client ${socket.id} subscribed to lead updates`);

        // Send acknowledgment
        socket.emit('subscription-confirmed', {
          channel: 'leads-updates',
          timestamp: new Date().toISOString()
        });
      });

      // Handle unsubscribe
      socket.on('unsubscribe-leads', () => {
        socket.leave('leads-updates');
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.subscriptions = client.subscriptions.filter(s => s !== 'leads-updates');
        }
        logger.info(`Client ${socket.id} unsubscribed from lead updates`);
      });

      // Handle user-specific subscriptions (for future multi-user support)
      socket.on('subscribe-user', (userId) => {
        if (!userId) return;
        socket.join(`user-${userId}`);
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.userId = userId;
          client.subscriptions.push(`user-${userId}`);
        }
        logger.info(`Client ${socket.id} subscribed to user channel: ${userId}`);
      });

      // Handle ping for connection health check
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`WebSocket error for client ${socket.id}:`, error);
      });
    });
  }

  // Emit new lead to all connected clients
  notifyNewLead(lead) {
    if (!this.io) return;

    const notification = {
      type: 'new-lead',
      data: lead,
      timestamp: new Date().toISOString()
    };

    this.io.to('leads-updates').emit('new-lead', notification);
    logger.info(`Notified ${this.getSubscriberCount('leads-updates')} clients of new lead: ${lead.id}`);
  }

  // Emit lead update
  notifyLeadUpdate(leadId, updates) {
    if (!this.io) return;

    const notification = {
      type: 'lead-updated',
      data: { leadId, updates },
      timestamp: new Date().toISOString()
    };

    this.io.to('leads-updates').emit('lead-updated', notification);
    logger.info(`Notified clients of lead update: ${leadId}`);
  }

  // Emit lead status change (contacted, won, lost, etc.)
  notifyLeadStatusChange(leadId, oldStatus, newStatus, additionalData = {}) {
    if (!this.io) return;

    const notification = {
      type: 'lead-status-changed',
      data: {
        leadId,
        oldStatus,
        newStatus,
        ...additionalData
      },
      timestamp: new Date().toISOString()
    };

    this.io.to('leads-updates').emit('lead-status-changed', notification);
    logger.info(`Notified clients of lead status change: ${leadId} (${oldStatus} → ${newStatus})`);
  }

  // Send notification to specific user (future multi-user support)
  notifyUser(userId, notification) {
    if (!this.io) return;

    const enhancedNotification = {
      ...notification,
      timestamp: new Date().toISOString()
    };

    this.io.to(`user-${userId}`).emit('notification', enhancedNotification);
    logger.info(`Sent notification to user ${userId}:`, notification.type);
  }

  // Broadcast system message to all clients
  broadcastSystemMessage(message, level = 'info') {
    if (!this.io) return;

    const systemMessage = {
      type: 'system-message',
      level, // 'info', 'warning', 'error', 'success'
      message,
      timestamp: new Date().toISOString()
    };

    this.io.emit('system-message', systemMessage);
    logger.info(`Broadcast system message to all clients: ${message}`);
  }

  // Get statistics about connected clients
  getStats() {
    const rooms = this.io ? this.io.sockets.adapter.rooms : new Map();

    return {
      totalConnected: this.connectedClients.size,
      subscribedToLeads: this.getSubscriberCount('leads-updates'),
      clients: Array.from(this.connectedClients.entries()).map(([id, client]) => ({
        id,
        connectedAt: client.connectedAt,
        subscriptions: client.subscriptions,
        userId: client.userId
      }))
    };
  }

  // Helper to get subscriber count for a room
  getSubscriberCount(room) {
    if (!this.io) return 0;
    const roomClients = this.io.sockets.adapter.rooms.get(room);
    return roomClients ? roomClients.size : 0;
  }

  // Graceful shutdown
  async shutdown() {
    if (!this.io) return;

    logger.info('Shutting down WebSocket server...');

    // Notify all clients about shutdown
    this.broadcastSystemMessage('Server is shutting down for maintenance', 'warning');

    // Give clients time to disconnect gracefully
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Close all connections
    this.io.disconnectSockets(true);

    // Close the server
    await new Promise((resolve, reject) => {
      this.io.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info('WebSocket server shut down successfully');
  }
}

export default new WebSocketService();