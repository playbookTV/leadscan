import React from 'react';
import { useLeadStats } from '../hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Users, Target, TrendingUp, Award, Clock, CheckCircle } from 'lucide-react';
import { formatNumber } from '../lib/utils';

export function Dashboard() {
  const { data: stats, isLoading, error } = useLeadStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading dashboard</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Leads',
      value: stats?.total || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'High Priority',
      value: stats?.high_priority || 0,
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      badge: 'Score ≥ 8',
    },
    {
      title: 'Contacted Today',
      value: stats?.contacted || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'New Leads',
      value: stats?.new_leads || 0,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversion_rate || 0}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Won Deals',
      value: stats?.won_leads || 0,
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your lead generation performance and conversion metrics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                  </p>
                  {stat.badge && (
                    <Badge variant="info" size="sm" className="mt-2">
                      {stat.badge}
                    </Badge>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/leads?status=new"
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl font-bold text-blue-600">
                {stats?.new_leads || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Review New Leads</div>
            </a>
            <a
              href="/leads?score_min=8"
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl font-bold text-green-600">
                {stats?.high_priority || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">High Priority Leads</div>
            </a>
            <a
              href="/analytics"
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl font-bold text-purple-600">
                {stats?.conversion_rate || 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">View Analytics</div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* System status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lead Polling</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Analysis</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Notifications</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <Badge variant="success">Online</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}