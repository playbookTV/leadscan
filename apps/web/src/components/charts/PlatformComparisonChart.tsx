import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PlatformData {
  platform: string
  total_leads: number
  contacted: number
  converted: number
  average_score: number
  conversion_rate: string
  response_rate: number
}

interface PlatformComparisonChartProps {
  data: PlatformData[]
  title?: string
}

const PlatformComparisonChart: React.FC<PlatformComparisonChartProps> = ({ data, title = "Platform Performance" }) => {
  // Format data for display
  const formattedData = data.map(item => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    'Total Leads': item.total_leads,
    'Contacted': item.contacted,
    'Converted': item.converted,
    'Avg Score': item.average_score,
    'Conversion %': parseFloat(item.conversion_rate)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const platformData = data.find(p =>
        p.platform.charAt(0).toUpperCase() + p.platform.slice(1) === label
      )

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">Total Leads: {platformData?.total_leads}</p>
            <p className="text-green-600">Contacted: {platformData?.contacted}</p>
            <p className="text-purple-600">Converted: {platformData?.converted}</p>
            <p className="text-gray-600">Avg Score: {platformData?.average_score}</p>
            <p className="text-orange-600">Conversion Rate: {platformData?.conversion_rate}%</p>
            <p className="text-pink-600">Response Rate: {platformData?.response_rate}%</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Total Leads" fill="#3b82f6" />
          <Bar dataKey="Contacted" fill="#10b981" />
          <Bar dataKey="Converted" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>

      {/* Platform Stats Summary */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((platform, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold capitalize mb-2">{platform.platform}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Conv. Rate:</span>
                <span className="ml-1 font-semibold">{platform.conversion_rate}%</span>
              </div>
              <div>
                <span className="text-gray-500">Avg Score:</span>
                <span className="ml-1 font-semibold">{platform.average_score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlatformComparisonChart