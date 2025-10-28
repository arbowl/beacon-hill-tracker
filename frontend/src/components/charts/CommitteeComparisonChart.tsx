import React, { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'

interface Committee {
  committee_id: string
  name: string
  compliance_rate: number
  total_bills: number
  compliant_count: number
  provisional_count?: number
  incomplete_count: number
  non_compliant_count: number
}

interface CommitteeComparisonChartProps {
  data: Committee[]
  loading?: boolean
  chartType?: 'bar' | 'horizontal_bar'
  viewMode?: 'top_performers' | 'all_committees'
  limit?: number
  highlightedCommitteeId?: string | null
}

const CommitteeComparisonChart: React.FC<CommitteeComparisonChartProps> = ({ 
  data, 
  loading = false,
  chartType = 'bar',
  viewMode = 'top_performers',
  limit = 15,
  highlightedCommitteeId = null
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
  
  // Apply view mode filtering first
  switch (viewMode) {
    case 'top_performers':
      displayData = sortedData.slice(0, limit)
      chartTitle = ``
      break
      
    case 'all_committees':
      displayData = sortedData
      chartTitle = ``
      break
      
    default:
      displayData = sortedData.slice(0, limit)
      chartTitle = ``
  }
  
  // If a committee is highlighted, ensure it's in the display data and pin it to the top
  if (highlightedCommitteeId) {
    const highlightedCommittee = sortedData.find(c => c.committee_id === highlightedCommitteeId)
    const isAlreadyInDisplay = displayData.some(c => c.committee_id === highlightedCommitteeId)
    
    if (highlightedCommittee) {
      if (isAlreadyInDisplay) {
        // Remove from current position and add to top
        displayData = [
          highlightedCommittee,
          ...displayData.filter(c => c.committee_id !== highlightedCommitteeId)
        ]
      } else {
        // Add to top even if it wasn't in the limited view
        displayData = [highlightedCommittee, ...displayData]
      }
    }
  }

  if (chartType === 'horizontal_bar') {
    displayData = [...displayData].reverse()
  }

  // Format names and mark the highlighted one with bold styling
  // Use responsive character limit based on screen size
  const getCharLimit = () => {
    if (windowWidth < 640) return 20  // Mobile (sm)
    if (windowWidth < 1024) return 35  // Tablet (md/lg)
    return 50  // Desktop
  }
  
  const charLimit = getCharLimit()
  const names = displayData.map((d) => {
    // Truncate the name if too long
    const shortName = d.name.length > charLimit ? d.name.substring(0, charLimit) + '...' : d.name
    // Check if this committee should be highlighted
    const isHighlighted = highlightedCommitteeId && d.committee_id === highlightedCommitteeId
    // Apply formatting for highlighted committee
    if (isHighlighted) {
      return `<b>★ ${shortName}</b>`
    }
    return shortName
  })
  
  // Store full names for hover tooltips (after reversal for horizontal bar)
  const fullNames = displayData.map(d => d.name)
  
  const compliant = displayData.map(d => d.compliant_count)
  const provisional = displayData.map(d => d.provisional_count || 0)
  const nonCompliant = displayData.map(d => d.non_compliant_count)
  // Note: incomplete_count is always 0 (merged into non_compliant_count)

  const isHorizontal = chartType === 'horizontal_bar'
  const hasProvisional = provisional.some(count => count > 0)

  // Create color arrays that highlight the selected committee
  const getColorArray = (baseColor: string, highlightColor: string) => {
    if (!highlightedCommitteeId) return baseColor
    return displayData.map(d => 
      d.committee_id === highlightedCommitteeId ? highlightColor : baseColor
    )
  }

  const traces: any[] = [
    {
      type: 'bar',
      orientation: isHorizontal ? 'h' : 'v',
      x: isHorizontal ? compliant : names,
      y: isHorizontal ? names : compliant,
      name: 'Compliant',
      customdata: fullNames,
      marker: { 
        color: getColorArray('#22c55e', '#16a34a'),
        line: highlightedCommitteeId ? {
          color: displayData.map(d => d.committee_id === highlightedCommitteeId ? '#15803d' : 'transparent'),
          width: 2
        } : undefined
      },
      hovertemplate: '<b>%{customdata}</b><br>' +
                     'Compliant: %{' + (isHorizontal ? 'x' : 'y') + '}<br>' +
                     '<extra></extra>',
    }
  ]

  // Add provisional trace if any committee has provisional bills
  if (hasProvisional) {
    traces.push({
      type: 'bar',
      orientation: isHorizontal ? 'h' : 'v',
      x: isHorizontal ? provisional : names,
      y: isHorizontal ? names : provisional,
      name: 'Provisional',
      customdata: fullNames,
      marker: { 
        color: getColorArray('#86efac', '#4ade80'),
        line: highlightedCommitteeId ? {
          color: displayData.map(d => d.committee_id === highlightedCommitteeId ? '#22c55e' : 'transparent'),
          width: 2
        } : undefined
      },
      hovertemplate: '<b>%{customdata}</b><br>' +
                     'Provisional: %{' + (isHorizontal ? 'x' : 'y') + '}<br>' +
                     '<extra></extra>',
    })
  }

  traces.push({
    type: 'bar',
    orientation: isHorizontal ? 'h' : 'v',
    x: isHorizontal ? nonCompliant : names,
    y: isHorizontal ? names : nonCompliant,
    name: 'Non-Compliant',
    customdata: fullNames,
    marker: { 
      color: getColorArray('#ef4444', '#dc2626'),
      line: highlightedCommitteeId ? {
        color: displayData.map(d => d.committee_id === highlightedCommitteeId ? '#b91c1c' : 'transparent'),
        width: 2
      } : undefined
    },
    hovertemplate: '<b>%{customdata}</b><br>' +
                   'Non-Compliant: %{' + (isHorizontal ? 'x' : 'y') + '}<br>' +
                   '<extra></extra>',
  })

  return (
    <div className="w-full">
      <Plot
        data={traces}
        layout={{
          title: {
            text: chartTitle,
            font: { size: windowWidth < 640 ? 14 : 18, color: '#374151' },
            x: 0.5,
            xanchor: 'center'
          },
          barmode: 'stack',
          xaxis: {
            title: isHorizontal ? 'Number of Bills' : 'Committee',
            gridcolor: '#f3f4f6',
            color: '#6b7280',
            tickangle: isHorizontal ? 0 : -45,
            titlefont: {
              size: windowWidth < 640 ? 10 : 12
            },
            tickfont: {
              size: windowWidth < 640 ? 9 : 11
            }
          },
          yaxis: {
            title: isHorizontal ? '' : 'Number of Bills',
            gridcolor: '#f3f4f6',
            color: '#6b7280',
            tickfont: {
              size: windowWidth < 640 ? 9 : 11
            }
          },
          showlegend: true,
          legend: {
            orientation: 'h',
            x: 0.5,
            xanchor: 'center',
            y: isHorizontal ? (windowWidth < 640 ? -0.05 : -0.08) : 1.1,
            font: {
              size: windowWidth < 640 ? 10 : 12
            }
          },
          margin: { 
            t: 80, 
            b: isHorizontal ? (windowWidth < 640 ? 50 : 60) : 120, 
            l: isHorizontal ? (windowWidth < 640 ? 140 : windowWidth < 1024 ? 220 : 320) : 60, 
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
        style={{ width: '100%', height: isHorizontal ? (viewMode === 'all_committees' || highlightedCommitteeId ? `${Math.max(300, displayData.length * 18)}px` : '300px') : '250px' }}
      />
    </div>
  )
}

export default CommitteeComparisonChart

