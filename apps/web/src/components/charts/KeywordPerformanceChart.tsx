import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface KeywordData {
  keyword: string
  platform: string
  total_leads: number
  converted_leads: number
  conversion_rate: string
  average_score: number
  total_revenue: number
  revenue_per_lead: string
}

interface KeywordPerformanceChartProps {
  data: KeywordData[]
  title?: string
  metric?: 'leads' | 'revenue' | 'conversion'
}

const KeywordPerformanceChart: React.FC<KeywordPerformanceChartProps> = ({
  data,
  title = "Top Keywords Performance",
  metric = 'leads'
}) => {
  // Sort and format data based on selected metric
  const formatData = () => {
    let sortedData = [...data]
    let dataKey = 'total_leads'
    let label = 'Total Leads'

    switch(metric) {
      case 'revenue':
        sortedData.sort((a, b) => b.total_revenue - a.total_revenue)
        dataKey = 'total_revenue'
        label = 'Total Revenue'
        break
      case 'conversion':
        sortedData.sort((a, b) => parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate))
        dataKey = 'conversion_rate'
        label = 'Conversion Rate'
        break
      default:
        sortedData.sort((a, b) => b.total_leads - a.total_leads)
    }

    return {
      data: sortedData.slice(0, 10).map(item => ({
        ...item,
        keyword_short: item.keyword.length > 20 ? item.keyword.substring(0, 20) + '...' : item.keyword,
        [dataKey]: metric === 'conversion' ? parseFloat(item.conversion_rate) : item[dataKey as keyof KeywordData]
      })),
      dataKey,
      label
    }
  }

  const { data: chartData, dataKey, label } = formatData()

  const getBarColor = (platform: string) => {
    return platform === 'twitter' ? '#1DA1F2' : '#0077B5'
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as KeywordData

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold mb-2 break-words">{item.keyword}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Platform: <span className="capitalize">{item.platform}</span>
            </p>
            <p className="text-blue-600">Total Leads: {item.total_leads}</p>
            <p className="text-green-600">Converted: {item.converted_leads}</p>
            <p className="text-purple-600">Conversion Rate: {item.conversion_rate}%</p>
            <p className="text-orange-600">Avg Score: {item.average_score}</p>
            {item.total_revenue > 0 && (
              <>
                <p className="text-emerald-600">
                  Total Revenue: ${item.total_revenue.toLocaleString()}
                </p>
                <p className="text-gray-600">
                  Revenue/Lead: ${item.revenue_per_lead}
                </p>
              </>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const formatYAxis = (value: any) => {
    if (metric === 'revenue') {
      return `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`
    }
    if (metric === 'conversion') {
      return `${value}%`
    }
    return value
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1DA1F2' }}></span>
            Twitter
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0077B5' }}></span>
            LinkedIn
          </span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="keyword_short"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} name={label}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.platform)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.reduce((sum, k) => sum + k.total_leads, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Leads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {data.reduce((sum, k) => sum + k.converted_leads, 0)}
              </p>
              <p className="text-sm text-gray-500">Converted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                ${data.reduce((sum, k) => sum + k.total_revenue, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No keyword performance data available
        </div>
      )}
    </div>
  )
}

export default KeywordPerformanceChart