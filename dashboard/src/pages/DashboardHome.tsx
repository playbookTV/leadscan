import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, Chip, Button } from '@heroui/react'
import { supabase, Lead } from '@/lib/supabase'
import { TrendingUp, Users, DollarSign, Target, ArrowRight, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Stats {
  totalLeads: number
  highPriorityLeads: number
  contacted: number
  won: number
  totalRevenue: number
  todayLeads: number
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    highPriorityLeads: 0,
    contacted: 0,
    won: 0,
    totalRevenue: 0,
    todayLeads: 0,
  })
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { data: allLeads } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (allLeads) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        setStats({
          totalLeads: allLeads.length,
          highPriorityLeads: allLeads.filter((l: Lead) => l.score >= 8).length,
          contacted: allLeads.filter((l: Lead) => l.status === 'contacted' || l.status === 'responded').length,
          won: allLeads.filter((l: Lead) => l.status === 'won').length,
          totalRevenue: allLeads
            .filter((l: Lead) => l.project_value)
            .reduce((sum: number, l: Lead) => sum + (l.project_value || 0), 0),
          todayLeads: allLeads.filter((l: Lead) => new Date(l.created_at) >= today).length,
        })

        // Set recent leads
        setRecentLeads(allLeads.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: <Users className="w-6 h-6" />,
      color: 'primary',
      change: `+${stats.todayLeads} today`,
    },
    {
      title: 'High Priority',
      value: stats.highPriorityLeads,
      icon: <Zap className="w-6 h-6" />,
      color: 'warning',
      change: 'Score ≥ 8',
    },
    {
      title: 'Contacted',
      value: stats.contacted,
      icon: <Target className="w-6 h-6" />,
      color: 'success',
      change: `${stats.totalLeads > 0 ? Math.round((stats.contacted / stats.totalLeads) * 100) : 0}% rate`,
    },
    {
      title: 'Revenue',
      value: `$${(stats.totalRevenue / 1000).toFixed(1)}k`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'secondary',
      change: `${stats.won} won`,
    },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'danger'
    if (score >= 8) return 'warning'
    if (score >= 6) return 'primary'
    return 'default'
  }

  const getPlatformIcon = (platform: string) => {
    return platform === 'twitter' ? '𝕏' : '💼'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's what's happening with your leads.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}/10 text-${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Recent Leads */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Recent Leads</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Latest opportunities from Twitter and LinkedIn
            </p>
          </div>
          <Link to="/leads">
            <Button
              color="primary"
              variant="flat"
              endContent={<ArrowRight className="w-4 h-4" />}
            >
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <div className="space-y-4">
            {recentLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No leads found yet. The system will start finding opportunities soon!
              </div>
            ) : (
              recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  to={`/leads/${lead.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getPlatformIcon(lead.platform)}</span>
                        <Chip size="sm" color={getScoreColor(lead.score)} variant="flat">
                          Score: {lead.score}/10
                        </Chip>
                        {lead.has_budget && (
                          <Chip size="sm" color="success" variant="flat">
                            💰 Budget
                          </Chip>
                        )}
                        {lead.has_urgency && (
                          <Chip size="sm" color="danger" variant="flat">
                            ⚡ Urgent
                          </Chip>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                        {lead.post_text}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{lead.author_name || lead.author_handle}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(lead.posted_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Chip
                        size="sm"
                        variant="dot"
                        color={
                          lead.status === 'won'
                            ? 'success'
                            : lead.status === 'contacted'
                            ? 'primary'
                            : 'default'
                        }
                      >
                        {lead.status}
                      </Chip>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
