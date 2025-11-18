import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ScoreDistribution {
  low: number
  medium: number
  high: number
}

interface ScoreDistributionChartProps {
  data: ScoreDistribution
  title?: string
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ data, title = "Lead Score Distribution" }) => {
  const COLORS = {
    low: '#ef4444',
    medium: '#f59e0b',
    high: '#10b981'
  }

  const chartData = [
    { name: 'Low (0-3)', value: data.low, color: COLORS.low },
    { name: 'Medium (4-6)', value: data.medium, color: COLORS.medium },
    { name: 'High (7-10)', value: data.high, color: COLORS.high }
  ].filter(item => item.value > 0) // Only show segments with data

  const total = data.low + data.medium + data.high

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / total) * 100).toFixed(1)
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">Count: {payload[0].value}</p>
          <p className="text-sm text-gray-600">Percentage: {percentage}%</p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percentage = ((value / total) * 100).toFixed(1)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold"
      >
        {percentage}%
      </text>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-gray-500">Total Leads</p>
            </div>
            {chartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-sm">{item.value}</span>
                  <span className="text-gray-500 text-sm">
                    ({((item.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No lead data available
        </div>
      )}
    </div>
  )
}

export default ScoreDistributionChart