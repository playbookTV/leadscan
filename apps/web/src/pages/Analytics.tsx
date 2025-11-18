import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import FunnelChart from '../components/charts/FunnelChart'
import LeadsTimelineChart from '../components/charts/LeadsTimelineChart'
import PlatformComparisonChart from '../components/charts/PlatformComparisonChart'
import ScoreDistributionChart from '../components/charts/ScoreDistributionChart'
import KeywordPerformanceChart from '../components/charts/KeywordPerformanceChart'
import { Activity, TrendingUp, Users, Target, Calendar, Download } from 'lucide-react'

export function Analytics() {
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>({
    overview: null,
    funnel: null,
    platformPerformance: null,
    timeline: null,
    topKeywords: null
  })

  // Fetch all analytics data
  useEffect(() => {
    fetchAnalyticsData()
  }, [period])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      // Fetch all analytics endpoints in parallel
      const [overview, funnel, platformPerformance, timeline, topKeywords] = await Promise.all([
        fetch(`${apiUrl}/api/analytics/overview?period=${period}`).then(res => res.json()),
        fetch(`${apiUrl}/api/analytics/funnel`).then(res => res.json()),
        fetch(`${apiUrl}/api/analytics/platform-performance?period=${period}`).then(res => res.json()),
        fetch(`${apiUrl}/api/analytics/timeline`).then(res => res.json()),
        fetch(`${apiUrl}/api/analytics/top-keywords?limit=10`).then(res => res.json())
      ])

      setAnalyticsData({
        overview,
        funnel,
        platformPerformance,
        timeline,
        topKeywords
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Export analytics data as JSON
  const exportAnalyticsData = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `analytics_${period}_${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!analyticsData.overview) return []

    const { total_leads, statuses, platforms, score_distribution } = analyticsData.overview
    const conversionRate = analyticsData.funnel?.conversion_rate || 0
    const responseRate = analyticsData.funnel?.response_rate || 0

    return [
      {
        label: 'Total Leads',
        value: total_leads || 0,
        change: '+12%',
        icon: Users,
        color: 'text-blue-600'
      },
      {
        label: 'Conversion Rate',
        value: `${conversionRate}%`,
        change: '+2.5%',
        icon: TrendingUp,
        color: 'text-green-600'
      },
      {
        label: 'Response Rate',
        value: `${responseRate}%`,
        change: '+5%',
        icon: Activity,
        color: 'text-purple-600'
      },
      {
        label: 'Active Leads',
        value: statuses?.new + statuses?.contacted || 0,
        change: '+8',
        icon: Target,
        color: 'text-orange-600'
      }
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const summaryStats = getSummaryStats()

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights into your lead generation performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow px-1 py-1">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                period === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                period === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod('90d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                period === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              90 Days
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={exportAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Timeline */}
        {analyticsData.overview?.timeline && (
          <LeadsTimelineChart
            data={analyticsData.overview.timeline}
            title="Leads Over Time"
          />
        )}

        {/* Score Distribution */}
        {analyticsData.overview?.score_distribution && (
          <ScoreDistributionChart
            data={analyticsData.overview.score_distribution}
            title="Lead Score Distribution"
          />
        )}

        {/* Platform Comparison */}
        {analyticsData.platformPerformance?.platforms && (
          <PlatformComparisonChart
            data={analyticsData.platformPerformance.platforms}
            title="Platform Performance Comparison"
          />
        )}

        {/* Conversion Funnel */}
        {analyticsData.funnel?.stages && (
          <FunnelChart
            data={analyticsData.funnel.stages}
            title="Lead Conversion Funnel"
          />
        )}
      </div>

      {/* Keywords Performance - Full Width */}
      {analyticsData.topKeywords?.top_keywords && (
        <KeywordPerformanceChart
          data={analyticsData.topKeywords.top_keywords}
          title="Top Performing Keywords"
          metric="leads"
        />
      )}

      {/* Response Time Analysis */}
      {analyticsData.timeline && (
        <Card>
          <CardHeader>
            <CardTitle>Response Time Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Avg Time to Contact</p>
                <p className="text-2xl font-bold">
                  {analyticsData.timeline.overall_metrics?.avg_time_to_contact_hours || 0}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Time to Response</p>
                <p className="text-2xl font-bold">
                  {analyticsData.timeline.overall_metrics?.avg_time_to_response_hours || 0}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Contacted</p>
                <p className="text-2xl font-bold">
                  {analyticsData.timeline.overall_metrics?.total_contacted || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Responded</p>
                <p className="text-2xl font-bold">
                  {analyticsData.timeline.overall_metrics?.total_responded || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}