import React from 'react'
import Plot from 'react-plotly.js'

interface Committee {
  committee_id: string
  name: string
  compliance_rate: number
  total_bills: number
  compliant_count: number
  incomplete_count: number
  non_compliant_count: number
}

interface CommitteeComparisonChartProps {
  data: Committee[]
  loading?: boolean
  chartType?: 'bar' | 'horizontal_bar'
  viewMode?: 'top_performers' | 'all_committees'
  limit?: number
}

const CommitteeComparisonChart: React.FC<CommitteeComparisonChartProps> = ({ 
  data, 
  loading = false,
  chartType = 'bar',
  viewMode = 'top_performers',
  limit = 15
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">No committee data available</p>
          <p>Committee compliance comparisons will appear here when data is loaded.</p>
        </div>
      </div>
    )
  }

  // Sort by compliance rate descending and filter out committees with no bills
  const filteredData = data.filter(committee => committee.total_bills > 0)
  
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-base-content/50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">No committees with bills found</p>
          <p>Committee compliance comparisons will appear here when committees have bills to track.</p>
        </div>
      </div>
    )
  }
  
  const sortedData = [...filteredData].sort((a, b) => b.compliance_rate - a.compliance_rate)
  
  // Filter and limit data based on view mode
  let displayData: Committee[] = []
  let chartTitle = 'Committee Compliance Comparison'
  
  switch (viewMode) {
    case 'top_performers':
      displayData = sortedData.slice(0, limit)
      chartTitle = ``
      
    case 'all_committees':
      displayData = sortedData
      chartTitle = ``
      break
      
    default:
      displayData = sortedData.slice(0, limit)
      chartTitle = ``
  }

  if (chartType === 'horizontal_bar') {
    displayData = [...displayData].reverse()
  }

  const names = displayData.map(d => d.name.length > 30 ? d.name.substring(0, 30) + '...' : d.name)
  const compliant = displayData.map(d => d.compliant_count)
  const incomplete = displayData.map(d => d.incomplete_count)
  const nonCompliant = displayData.map(d => d.non_compliant_count)

  const isHorizontal = chartType === 'horizontal_bar'

  const traces = [
    {
      type: 'bar' as const,
      orientation: (isHorizontal ? 'h' : 'v') as const,
      x: isHorizontal ? compliant : names,
      y: isHorizontal ? names : compliant,
      name: 'Compliant',
      marker: { color: '#22c55e' },
      hovertemplate: '<b>%{' + (isHorizontal ? 'y' : 'x') + '}</b><br>' +
                     'Compliant: %{' + (isHorizontal ? 'x' : 'y') + '}<br>' +
                     '<extra></extra>',
    },
    {
      type: 'bar' as const,
      orientation: (isHorizontal ? 'h' : 'v') as const,
      x: isHorizontal ? incomplete : names,
      y: isHorizontal ? names : incomplete,
      name: 'Incomplete',
      marker: { color: '#f59e0b' },
      hovertemplate: '<b>%{' + (isHorizontal ? 'y' : 'x') + '}</b><br>' +
                     'Incomplete: %{' + (isHorizontal ? 'x' : 'y') + '}<br>' +
                     '<extra></extra>',
    },
    {
      type: 'bar' as const,
      orientation: (isHorizontal ? 'h' : 'v') as const,
      x: isHorizontal ? nonCompliant : names,
      y: isHorizontal ? names : nonCompliant,
      name: 'Non-Compliant',
      marker: { color: '#ef4444' },
      hovertemplate: '<b>%{' + (isHorizontal ? 'y' : 'x') + '}</b><br>' +
                     'Non-Compliant: %{' + (isHorizontal ? 'x' : 'y') + '}<br>' +
                     '<extra></extra>',
    }
  ]

  return (
    <div className="w-full">
      <Plot
        data={traces}
        layout={{
          title: {
            text: chartTitle,
            font: { size: 18, color: '#374151' },
            x: 0.5,
            xanchor: 'center'
          },
          barmode: 'stack',
          xaxis: {
            title: isHorizontal ? 'Number of Bills' : 'Committee',
            gridcolor: '#f3f4f6',
            color: '#6b7280',
            tickangle: isHorizontal ? 0 : -45
          },
          yaxis: {
            title: isHorizontal ? '' : 'Number of Bills',
            gridcolor: '#f3f4f6',
            color: '#6b7280'
          },
          showlegend: true,
          legend: {
            orientation: 'h',
            x: 0.5,
            xanchor: 'center',
            y: isHorizontal ? -0.2 : 1.1
          },
          margin: { 
            t: 80, 
            b: isHorizontal ? 100 : 120, 
            l: isHorizontal ? 200 : 60, 
            r: 60 
          },
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
        style={{ width: '100%', height: isHorizontal ? (viewMode === 'all_committees' ? `${Math.max(600, displayData.length * 35)}px` : '600px') : '500px' }}
      />
    </div>
  )
}

export default CommitteeComparisonChart

