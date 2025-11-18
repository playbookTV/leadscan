/**
 * Request permission for browser notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return false;
  }

  // Check current permission status
  if (Notification.permission === 'granted') {
    return true;
  }

  // If denied, we can't ask again
  if (Notification.permission === 'denied') {
    console.log('Notification permission has been denied');
    return false;
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show a browser notification
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!areNotificationsEnabled()) {
    console.log('Notifications are not enabled');
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'leadscout-notification',
      requireInteraction: false,
      silent: false,
      ...options
    });

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();

      // If a click handler was provided in options, call it
      if (options?.data?.url) {
        window.location.href = options.data.url;
      }
    };

    // Auto-close after 10 seconds if not require interaction
    if (!options?.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Show notification for a new lead
 */
export function showLeadNotification(lead: any) {
  const score = lead.final_score || lead.score;
  const isHighPriority = score >= 8;

  const title = isHighPriority
    ? `🔥 High-Priority Lead (${score}/10)`
    : `New Lead Found (${score}/10)`;

  const body = `${lead.author_name || 'Unknown'} on ${lead.platform}\n${
    lead.post_text?.substring(0, 100)
  }...`;

  showBrowserNotification(title, {
    body,
    tag: `lead-${lead.id}`,
    requireInteraction: isHighPriority,
    data: {
      url: `/leads/${lead.id}`
    }
  });
}

/**
 * Get notification permission status
 */
export function getNotificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Store notification preferences in localStorage
 */
export function saveNotificationPreference(enabled: boolean) {
  localStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');
}

/**
 * Get stored notification preference
 */
export function getNotificationPreference(): boolean {
  const stored = localStorage.getItem('notificationsEnabled');
  if (stored === null) {
    // Default to enabled if permission is granted
    return areNotificationsEnabled();
  }
  return stored === 'true';
}

/**
 * Initialize notifications
 * Call this on app startup
 */
export async function initializeNotifications(): Promise<boolean> {
  // Check if user has previously enabled notifications
  const preference = getNotificationPreference();

  if (preference && !areNotificationsEnabled()) {
    // User wants notifications but hasn't granted permission yet
    const granted = await requestNotificationPermission();
    saveNotificationPreference(granted);
    return granted;
  }

  return preference && areNotificationsEnabled();
}