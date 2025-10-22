import React from 'react'
import Plot from 'react-plotly.js'

interface ComplianceOverviewChartProps {
  data: {
    compliant_bills: number
    provisional_bills?: number
    incomplete_bills: number
    non_compliant_bills: number
    unknown_bills: number
  }
  loading?: boolean
}

const ComplianceOverviewChart: React.FC<ComplianceOverviewChartProps> = ({ 
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

  // Note: incomplete_bills is always 0 (merged into non_compliant_bills)
  const provisionalCount = data.provisional_bills || 0
  
  const values = provisionalCount > 0 
    ? [
        data.compliant_bills,
        provisionalCount,
        data.non_compliant_bills,
        data.unknown_bills
      ]
    : [
        data.compliant_bills,
        data.non_compliant_bills,
        data.unknown_bills
      ]

  const labels = provisionalCount > 0
    ? ['Compliant', 'Provisional', 'Non-Compliant', 'Monitoring']
    : ['Compliant', 'Non-Compliant', 'Monitoring']
  
  const colors = provisionalCount > 0
    ? [
        '#22c55e', // green for compliant
        '#86efac', // light green for provisional
        '#ef4444', // red for non-compliant
        '#6b7280'  // gray for monitoring
      ]
    : [
        '#22c55e', // green for compliant
        '#ef4444', // red for non-compliant
        '#6b7280'  // gray for monitoring
      ]

  const total = values.reduce((sum, val) => sum + val, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-base-content/50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">No compliance data available</p>
          <p>Import some data to see compliance visualizations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Plot
        data={[
          {
            type: 'pie',
            values: values,
            labels: labels,
            marker: {
              colors: colors,
            },
            textinfo: 'percent',
            textposition: 'inside',
            textfont: {
              size: 14,
              color: 'white'
            },
            hovertemplate: '<b>%{label}</b><br>' +
                          'Count: %{value}<br>' +
                          'Percentage: %{percent}<br>' +
                          '<extra></extra>',
          }
        ]}
        layout={{
          showlegend: true,
          legend: {
            orientation: 'v',
            x: 1.02,
            xanchor: 'left',
            y: 0.5,
            yanchor: 'middle',
            font: {
              size: 12
            }
          },
          margin: { t: 40, b: 40, l: 20, r: 120 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            color: '#374151'
          }
        }}
        config={{
          displayModeBar: false,
          responsive: true
        }}
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  )
}

export default ComplianceOverviewChart
