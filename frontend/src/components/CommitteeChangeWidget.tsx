import React from 'react'
import { DiffReport } from '../types'

interface CommitteeChangeWidgetProps {
  diffReport: DiffReport | null
  analysis: string | null
  loading?: boolean
}

const CommitteeChangeWidget: React.FC<CommitteeChangeWidgetProps> = ({ 
  diffReport, 
  analysis, 
  loading = false 
}) => {
  // Show loading state
  if (loading) {
    return (
      <div className="card bg-base-100/50 border border-base-300 shadow-sm mb-6">
        <div className="card-body py-4">
          <div className="flex items-center gap-2">
            <div className="loading loading-spinner loading-sm"></div>
            <span className="text-sm text-base-content/70">Loading recent changes...</span>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if no data (only after loading is complete)
  if (!diffReport && !analysis) {
    return null
  }

  return (
    <div className="card bg-base-100/80 border border-primary/20 shadow-sm mb-6 backdrop-blur-sm">
      <div className="card-body py-4">
        <div className="flex flex-col md:flex-row items-start gap-4">
          {/* Left side: Change indicators */}
          {diffReport && (
            <div className="flex-1">
              {/* Compliance Delta - on its own line */}
              {diffReport.compliance_delta !== undefined && diffReport.compliance_delta !== null && (
                <div className="flex items-center gap-2 mb-3">
                  <div className={`badge ${
                    diffReport.compliance_delta > 0 ? 'badge-success' : 
                    diffReport.compliance_delta < 0 ? 'badge-error' : 
                    'badge-neutral'
                  }`}>
                    {diffReport.compliance_delta > 0 ? '+' : ''}
                    {diffReport.compliance_delta.toFixed(1)}%
                  </div>
                  <span className="text-sm text-base-content/70">
                    compliance change
                  </span>
                </div>
              )}

              {/* Other statistics badges - on their own line */}
              <div className="flex items-center gap-3 flex-wrap mb-3">
                {/* New Bills - always show */}
                {diffReport.new_bills_count !== undefined && diffReport.new_bills_count !== null && (
                  <div className="flex items-center gap-1.5">
                    <div className={`badge badge-sm ${diffReport.new_bills_count > 0 ? 'badge-info' : 'badge-ghost'}`}>
                      {diffReport.new_bills_count > 0 ? '+' : ''}{diffReport.new_bills_count}
                    </div>
                    <span className="text-xs text-base-content/60">new bills</span>
                  </div>
                )}

                {/* Bills with new hearings - always show */}
                {diffReport.bills_with_new_hearings && (
                  <div className="flex items-center gap-1.5">
                    <div className={`badge badge-sm ${diffReport.bills_with_new_hearings.length > 0 ? 'badge-warning' : 'badge-ghost'}`}>
                      {diffReport.bills_with_new_hearings.length}
                    </div>
                    <span className="text-xs text-base-content/60">new hearings</span>
                  </div>
                )}

                {/* Bills reported out - always show */}
                {diffReport.bills_reported_out && (
                  <div className="flex items-center gap-1.5">
                    <div className={`badge badge-sm ${diffReport.bills_reported_out.length > 0 ? 'badge-success' : 'badge-ghost'}`}>
                      {diffReport.bills_reported_out.length}
                    </div>
                    <span className="text-xs text-base-content/60">reported out</span>
                  </div>
                )}

                {/* Bills with new summaries - always show */}
                {diffReport.bills_with_new_summaries && (
                  <div className="flex items-center gap-1.5">
                    <div className={`badge badge-sm ${diffReport.bills_with_new_summaries.length > 0 ? 'badge-success' : 'badge-ghost'}`}>
                      {diffReport.bills_with_new_summaries.length}
                    </div>
                    <span className="text-xs text-base-content/60">new summaries</span>
                  </div>
                )}
              </div>

              {/* Date range and time interval */}
              <div className="flex items-center gap-2 text-xs text-base-content/50">
                {diffReport.previous_date && diffReport.current_date && (
                  <>
                    <span>{new Date(diffReport.previous_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>→</span>
                    <span>{new Date(diffReport.current_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </>
                )}
                {diffReport.time_interval && (
                  <>
                    <span>•</span>
                    <span>{diffReport.time_interval}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Right side: Analysis text */}
          {analysis && (
            <div className={`${diffReport ? 'md:border-l md:border-base-300 md:pl-4' : ''} flex-1 min-w-0`}>
              <p className="text-sm text-base-content/75 leading-relaxed">
                {analysis}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommitteeChangeWidget

