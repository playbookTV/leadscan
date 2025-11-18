import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Bell, BellOff, Mail, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import {
  requestNotificationPermission,
  areNotificationsEnabled,
  getNotificationStatus,
  saveNotificationPreference,
  getNotificationPreference
} from '../utils/notifications';

export function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Load current notification preferences
    setNotificationsEnabled(getNotificationPreference());
    setNotificationStatus(getNotificationStatus());

    // Load sound preference
    const soundPref = localStorage.getItem('soundEnabled');
    setSoundEnabled(soundPref !== 'false');
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
      setNotificationStatus('granted');
      saveNotificationPreference(true);
      toast.success('Browser notifications enabled', {
        description: 'You will now receive notifications for high-priority leads',
        icon: <Bell className="w-4 h-4" />
      });
    } else {
      toast.error('Unable to enable notifications', {
        description: 'Please check your browser settings and try again'
      });
    }
  };

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false);
    saveNotificationPreference(false);
    toast.info('Browser notifications disabled');
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('soundEnabled', newValue.toString());
    toast.info(newValue ? 'Sound notifications enabled' : 'Sound notifications disabled');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure system settings and integrations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Polling Interval</p>
              <p className="font-medium">Every 30 minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Notification Threshold</p>
              <p className="font-medium">Score ≥ 8</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">AI Analysis</p>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">AI Threshold</p>
              <p className="font-medium">Quick Score ≥ 5</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Browser Notifications */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Browser Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive desktop notifications for new leads
                  </p>
                </div>
              </div>
              <div>
                {notificationStatus === 'unsupported' ? (
                  <Badge variant="secondary">Not Supported</Badge>
                ) : notificationStatus === 'denied' ? (
                  <Badge variant="danger">Blocked</Badge>
                ) : notificationsEnabled ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisableNotifications}
                  >
                    <BellOff className="w-4 h-4 mr-1" />
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleEnableNotifications}
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    Enable
                  </Button>
                )}
              </div>
            </div>

            {/* Sound Notifications */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-gray-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <p className="font-medium">Sound Alerts</p>
                  <p className="text-sm text-gray-500">
                    Play sound for high-priority leads
                  </p>
                </div>
              </div>
              <Button
                variant={soundEnabled ? 'danger' : 'primary'}
                size="sm"
                onClick={toggleSound}
              >
                {soundEnabled ? (
                  <>
                    <VolumeX className="w-4 h-4 mr-1" />
                    Mute
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-1" />
                    Unmute
                  </>
                )}
              </Button>
            </div>

            {/* Email Notifications (placeholder) */}
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Email Digest</p>
                  <p className="text-sm text-gray-500">
                    Daily summary of new leads (coming soon)
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Twitter API</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>LinkedIn</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>OpenAI</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Telegram Bot</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Supabase Database</span>
            <Badge variant="success">Connected</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}