import React from 'react'
import Plot from 'react-plotly.js'

interface ComplianceTrendsChartProps {
  data: Array<{
    date: string
    compliant_rate: number
    total_bills: number
  }>
  loading?: boolean
}

const ComplianceTrendsChart: React.FC<ComplianceTrendsChartProps> = ({ 
  data, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-base-content/50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p className="text-lg font-medium">No trend data available</p>
          <p>Historical compliance data will appear here as it becomes available.</p>
        </div>
      </div>
    )
  }

  const dates = data.map(d => d.date)
  const rates = data.map(d => d.compliant_rate)
  const totals = data.map(d => d.total_bills)

  return (
    <div className="w-full">
      <Plot
        data={[
          {
            type: 'scatter' as const,
            mode: 'lines+markers' as const,
            x: dates,
            y: rates,
            name: 'Compliance Rate',
            line: {
              color: '#3b82f6',
              width: 3
            },
            marker: {
              color: '#3b82f6',
              size: 8
            },
            hovertemplate: '<b>Date:</b> %{x}<br>' +
                          '<b>Compliance Rate:</b> %{y:.1f}%<br>' +
                          '<extra></extra>',
          },
          {
            type: 'scatter' as const,
            mode: 'lines' as const,
            x: dates,
            y: totals,
            name: 'Total Bills',
            yaxis: 'y2',
            line: {
              color: '#10b981',
              width: 2,
              dash: 'dot'
            },
            hovertemplate: '<b>Date:</b> %{x}<br>' +
                          '<b>Total Bills:</b> %{y}<br>' +
                          '<extra></extra>',
          }
        ]}
        layout={{
          title: {
            text: 'Compliance Trends Over Time',
            font: { size: 18, color: '#374151' },
            x: 0.5,
            xanchor: 'center'
          },
          xaxis: {
            title: 'Date',
            gridcolor: '#f3f4f6',
            color: '#6b7280'
          },
          yaxis: {
            title: 'Compliance Rate (%)',
            gridcolor: '#f3f4f6',
            color: '#6b7280',
            range: [0, 100]
          },
          yaxis2: {
            title: 'Total Bills',
            overlaying: 'y',
            side: 'right',
            color: '#10b981'
          },
          showlegend: true,
          legend: {
            orientation: 'h',
            x: 0.5,
            xanchor: 'center',
            y: 1.1
          },
          margin: { t: 80, b: 60, l: 60, r: 60 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            color: '#374151'
          }
        }}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: [
            'pan2d',
            'select2d',
            'lasso2d',
            'autoScale2d',
            'hoverClosestCartesian',
            'hoverCompareCartesian'
          ],
          responsive: true
        }}
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  )
}

export default ComplianceTrendsChart
