import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const { data: leads } = await supabase.from('leads').select('*')

      if (leads) {
        // Platform breakdown
        const platformData = [
          { name: 'Twitter', value: leads.filter(l => l.platform === 'twitter').length },
          { name: 'LinkedIn', value: leads.filter(l => l.platform === 'linkedin').length },
        ]

        // Status breakdown
        const statusData = [
          { name: 'New', count: leads.filter(l => l.status === 'new').length },
          { name: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
          { name: 'Won', count: leads.filter(l => l.status === 'won').length },
          { name: 'Lost', count: leads.filter(l => l.status === 'lost').length },
        ]

        // Score distribution
        const scoreData = [
          { range: '0-3', count: leads.filter(l => l.score <= 3).length },
          { range: '4-6', count: leads.filter(l => l.score > 3 && l.score <= 6).length },
          { range: '7-8', count: leads.filter(l => l.score > 6 && l.score <= 8).length },
          { range: '9-10', count: leads.filter(l => l.score > 8).length },
        ]

        setStats({ platformData, statusData, scoreData, totalLeads: leads.length })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Insights and performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <Card className="border-none shadow-sm">
          <CardHeader className="px-6 py-4">
            <h3 className="text-lg font-semibold">Platform Distribution</h3>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats?.platformData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Status Distribution */}
        <Card className="border-none shadow-sm">
          <CardHeader className="px-6 py-4">
            <h3 className="text-lg font-semibold">Lead Status</h3>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Score Distribution */}
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="px-6 py-4">
            <h3 className="text-lg font-semibold">Score Distribution</h3>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.scoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
