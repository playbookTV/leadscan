import React from 'react'
import { FunnelChart as RechartseFunnel, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts'

interface FunnelData {
  name: string
  count: number
  percentage: number
}

interface FunnelChartProps {
  data: FunnelData[]
  title?: string
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data, title = "Conversion Funnel" }) => {
  // Format data for Recharts funnel
  const formattedData = data.map(item => ({
    value: item.count,
    name: item.name,
    fill: getColorByStage(item.name),
    percentage: item.percentage
  }))

  function getColorByStage(stage: string) {
    const colors: Record<string, string> = {
      'Total Leads': '#3b82f6',
      'Reviewed': '#8b5cf6',
      'Contacted': '#10b981',
      'Responded': '#f59e0b',
      'Converted': '#ef4444'
    }
    return colors[stage] || '#6b7280'
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p className="text-sm text-gray-600">Count: {payload[0].value}</p>
          <p className="text-sm text-gray-600">Percentage: {payload[0].payload.percentage}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RechartseFunnel>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={formattedData}
            isAnimationActive
          >
            <LabelList position="center" fill="#fff" stroke="none" />
          </Funnel>
        </RechartseFunnel>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColorByStage(item.name) }}
              />
              <span>{item.name}</span>
            </div>
            <div className="flex gap-4">
              <span className="font-semibold">{item.count}</span>
              <span className="text-gray-500">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FunnelChart