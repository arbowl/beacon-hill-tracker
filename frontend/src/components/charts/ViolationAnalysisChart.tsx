import React from 'react'
import Plot from 'react-plotly.js'
import { ReasonAnalysis } from '../../utils/reasonParser'

interface ViolationAnalysisChartProps {
  data: ReasonAnalysis[]
  title?: string
  loading?: boolean
  chartType?: 'bar' | 'pie' | 'horizontal_bar'
  showDetails?: boolean
}

const ViolationAnalysisChart: React.FC<ViolationAnalysisChartProps> = ({
  data,
  title = '',
  loading = false,
  chartType = 'horizontal_bar',
  showDetails = false
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">No violation data available</p>
          <p>Violation analysis will appear here when non-compliant bills are found.</p>
        </div>
      </div>
    )
  }

  const labels = data.map(item => item.violation.label)
  const values = data.map(item => item.count)
  const colors = data.map(item => item.violation.color)

  const plotData: any[] = []
  const layout: any = {
    title: {
      text: title,
      font: { size: 18, color: '#374151' },
      x: 0.5,
      xanchor: 'center'
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'system-ui, -apple-system, sans-serif',
      color: '#374151'
    },
    margin: { t: 80, b: 60, l: 60, r: 60 }
  }

  if (chartType === 'pie') {
    plotData.push({
      type: 'pie',
      labels: labels,
      values: values,
      marker: { colors: colors },
      hovertemplate: '<b>%{label}</b><br>' +
                     'Count: %{value}<br>' +
                     'Percentage: %{percent}<br>' +
                     '<extra></extra>',
      textinfo: 'label+percent',
      textposition: 'auto'
    })
    layout.showlegend = true
    layout.legend = { orientation: 'v', x: 1.05, y: 0.5 }
  } else if (chartType === 'horizontal_bar') {
    plotData.push({
      type: 'bar',
      orientation: 'h',
      x: values,
      y: labels,
      marker: { color: colors },
      hovertemplate: '<b>%{y}</b><br>' +
                     'Count: %{x}<br>' +
                     '<extra></extra>'
    })
    layout.xaxis = {
      title: 'Number of Bills',
      gridcolor: '#f3f4f6',
      color: '#6b7280'
    }
    layout.yaxis = {
      title: '',
      gridcolor: '#f3f4f6',
      color: '#6b7280'
    }
    layout.margin.l = 200
  } else {
    plotData.push({
      type: 'bar',
      x: labels,
      y: values,
      marker: { color: colors },
      hovertemplate: '<b>%{x}</b><br>' +
                     'Count: %{y}<br>' +
                     '<extra></extra>'
    })
    layout.xaxis = {
      title: 'Violation Type',
      gridcolor: '#f3f4f6',
      color: '#6b7280',
      tickangle: -45
    }
    layout.yaxis = {
      title: 'Number of Bills',
      gridcolor: '#f3f4f6',
      color: '#6b7280'
    }
    layout.margin.b = 120
  }

  return (
    <div className="w-full">
      <Plot
        data={plotData}
        layout={layout}
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
        style={{ width: '100%', height: chartType === 'pie' ? '200px' : '250px' }}
      />
      
      {showDetails && (
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-base-content">Violation Details:</h4>
          {data.map((item) => (
            <div key={item.violation.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.violation.color }}
                />
                <div>
                  <div className="font-medium">{item.violation.label}</div>
                  <div className="text-sm text-base-content/70">{item.violation.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{item.count} bills</div>
                <div className="text-sm text-base-content/70">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ViolationAnalysisChart
