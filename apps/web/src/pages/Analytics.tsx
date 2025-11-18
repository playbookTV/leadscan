import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import FunnelChart from '../components/charts/FunnelChart'
import LeadsTimelineChart from '../components/charts/LeadsTimelineChart'
import PlatformComparisonChart from '../components/charts/PlatformComparisonChart'
import ScoreDistributionChart from '../components/charts/ScoreDistributionChart'
import KeywordPerformanceChart from '../components/charts/KeywordPerformanceChart'
import { HelpModal } from '../components/HelpModal'
import { Activity, TrendingUp, Users, Target, Clock, DollarSign, Download, HelpCircle } from 'lucide-react'
import { useKeyboardShortcuts, isMac } from '../hooks/useKeyboardShortcuts'

export function Analytics() {
  const [dateRange, setDateRange] = useState(30)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  // Fetch all analytics data using React Query
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', dateRange],
    queryFn: () => fetch(`${apiUrl}/api/analytics/overview?days=${dateRange}`).then(res => res.json())
  })

  const { data: funnel } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: () => fetch(`${apiUrl}/api/analytics/funnel`).then(res => res.json())
  })

  const { data: platformPerformance } = useQuery({
    queryKey: ['analytics-platform', dateRange],
    queryFn: () => fetch(`${apiUrl}/api/analytics/platform-performance?period=${dateRange}d`).then(res => res.json())
  })

  const { data: scoreDistribution } = useQuery({
    queryKey: ['analytics-score-distribution'],
    queryFn: () => fetch(`${apiUrl}/api/analytics/score-distribution`).then(res => res.json())
  })

  const { data: topKeywords } = useQuery({
    queryKey: ['analytics-keywords'],
    queryFn: () => fetch(`${apiUrl}/api/analytics/top-keywords?limit=10`).then(res => res.json())
  })

  const { data: responseTimes } = useQuery({
    queryKey: ['analytics-response-times'],
    queryFn: () => fetch(`${apiUrl}/api/analytics/response-times`).then(res => res.json())
  })

  // Calculate summary statistics
  const calculateStats = () => {
    if (!overview || overview.length === 0) {
      return {
        totalLeads: 0,
        totalRevenue: 0,
        conversionRate: 0,
        avgResponseTime: 0
      }
    }

    const totalLeads = overview.reduce((sum: number, day: any) => sum + day.total_leads, 0)
    const totalRevenue = overview.reduce((sum: number, day: any) => sum + day.revenue, 0)
    const totalWon = overview.reduce((sum: number, day: any) => sum + day.won, 0)
    const conversionRate = totalLeads > 0 ? ((totalWon / totalLeads) * 100).toFixed(1) : 0

    return {
      totalLeads,
      totalRevenue,
      conversionRate,
      avgResponseTime: responseTimes?.avg_hours || 0
    }
  }

  // Export analytics data as CSV
  const exportToCSV = () => {
    if (!overview) return

    const headers = ['Date', 'Total Leads', 'High Priority', 'Contacted', 'Won', 'Revenue']
    const rows = overview.map((row: any) => [
      row.date,
      row.total_leads,
      row.high_priority,
      row.contacted,
      row.won,
      row.revenue
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics_${dateRange}days_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'e',
      ctrlKey: !isMac(),
      metaKey: isMac(),
      description: 'Export to CSV',
      action: exportToCSV,
    },
    {
      key: '/',
      ctrlKey: !isMac(),
      metaKey: isMac(),
      description: 'Show help',
      action: () => setIsHelpModalOpen(true),
    },
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Keyboard shortcuts"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        {funnel && (
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelChart data={funnel} />
            </CardContent>
          </Card>
        )}

        {/* Leads Over Time */}
        {overview && overview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Leads Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsTimelineChart data={overview} />
            </CardContent>
          </Card>
        )}

        {/* Platform Performance */}
        {platformPerformance && platformPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformComparisonChart data={platformPerformance} />
            </CardContent>
          </Card>
        )}

        {/* Score Distribution */}
        {scoreDistribution && scoreDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreDistributionChart data={scoreDistribution} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Keywords - Full Width */}
      {topKeywords && topKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <KeywordPerformanceChart data={topKeywords} />
          </CardContent>
        </Card>
      )}

      {/* Response Time Analysis */}
      {responseTimes && (
        <Card>
          <CardHeader>
            <CardTitle>Response Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Under 1 Hour</p>
                <p className="text-2xl font-bold text-green-600">
                  {responseTimes.distribution_percentage.under_1h}%
                </p>
                <p className="text-xs text-gray-400">{responseTimes.under_1h} leads</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Under 24 Hours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {responseTimes.distribution_percentage.under_24h}%
                </p>
                <p className="text-xs text-gray-400">{responseTimes.under_24h} leads</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Under 48 Hours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {responseTimes.distribution_percentage.under_48h}%
                </p>
                <p className="text-xs text-gray-400">{responseTimes.under_48h} leads</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Over 48 Hours</p>
                <p className="text-2xl font-bold text-red-600">
                  {responseTimes.distribution_percentage.over_48h}%
                </p>
                <p className="text-xs text-gray-400">{responseTimes.over_48h} leads</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Average Time</p>
                <p className="text-2xl font-bold">{responseTimes.avg_hours}h</p>
                <p className="text-xs text-gray-400">across {responseTimes.total_contacted} contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Modal */}
      <HelpModal open={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  )
}