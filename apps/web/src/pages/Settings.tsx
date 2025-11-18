import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Settings() {
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