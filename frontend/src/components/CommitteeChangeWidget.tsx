import React, { useMemo } from 'react'
import type { DiffReport, TopMover } from '../types'

interface CommitteeChangeWidgetProps {
  diffReport: DiffReport | null
  analysis: string | null
  loading?: boolean
  committeeId?: string | null // Reserved for future use (e.g., trend chart)
  topMovers?: TopMover[] // Top 3 committees with largest absolute compliance_delta change
}

const CommitteeChangeWidget: React.FC<CommitteeChangeWidgetProps> = ({ 
  diffReport, 
  analysis, 
  loading = false,
  committeeId: _committeeId = null, // Reserved for future use (e.g., trend chart)
  topMovers = []
}) => {

  // Calculate actual time interval from dates
  const calculatedTimeInterval = useMemo(() => {
    if (!diffReport?.previous_date || !diffReport?.current_date) return null
    
    const prevDate = new Date(diffReport.previous_date)
    const currDate = new Date(diffReport.current_date)
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'same day'
    if (diffDays === 1) return '1 day'
    return `${diffDays} days`
  }, [diffReport])
  // Show loading state
  if (loading) {
    return (
      <div className="card bg-gradient-to-br from-base-100/90 to-base-100/70 border border-base-300/50 shadow-md mb-6">
        <div className="card-body py-5">
          <div className="flex items-center gap-3">
            <div className="loading loading-spinner loading-sm text-primary"></div>
            <span className="text-sm font-medium text-base-content/80">Loading recent changes...</span>
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
    <div className="card bg-gradient-to-br from-base-100/95 via-primary/5 to-base-100/95 border border-primary/30 shadow-md mb-6 backdrop-blur-sm w-full">
      <div className="card-body py-5 px-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-base-300/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="text-lg font-semibold text-base-content">Recent Activity</h3>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-5 w-full">
          {/* Left side: Change indicators */}
          {diffReport && (
            <div className="flex-1 w-full space-y-4">
              {/* Compliance Delta with Trend Indicator - on its own line */}
              {diffReport.compliance_delta !== undefined && diffReport.compliance_delta !== null && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
                    <div 
                      className={`badge badge-lg text-white ${
                        diffReport.compliance_delta > 0 ? 'badge-success' : 
                        ''
                      }`}
                      style={
                        diffReport.compliance_delta > 0 
                          ? undefined 
                          : diffReport.compliance_delta < 0 
                          ? { backgroundColor: '#DC2626' } 
                          : { backgroundColor: '#4B5563' }
                      }
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {diffReport.compliance_delta > 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        ) : diffReport.compliance_delta < 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        )}
                      </svg>
                      {diffReport.compliance_delta > 0 ? '+' : ''}
                      {diffReport.compliance_delta.toFixed(1)}%
                    </div>
                    <span className="text-base font-medium text-base-content/80">
                      Compliance Change
                    </span>
                  </div>
                </div>
              )}

              {/* Other statistics badges - vertically stacked by default, horizontal only on very large screens */}
              <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 w-full">
                {/* New Bills - always show */}
                {diffReport.new_bills_count !== undefined && diffReport.new_bills_count !== null && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div 
                      className={`badge badge-lg text-white ${diffReport.new_bills_count > 0 ? 'badge-info' : ''}`}
                      style={diffReport.new_bills_count === 0 ? { backgroundColor: '#4B5563' } : undefined}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {diffReport.new_bills_count > 0 ? '+' : ''}{diffReport.new_bills_count}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Bills</span>
                  </div>
                )}

                {/* Bills with new hearings - always show */}
                {diffReport.bills_with_new_hearings !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div 
                      className={`badge badge-lg text-white ${diffReport.bills_with_new_hearings && diffReport.bills_with_new_hearings.length > 0 ? '' : ''}`}
                      style={
                        diffReport.bills_with_new_hearings && diffReport.bills_with_new_hearings.length > 0 
                          ? { backgroundColor: '#92400E' } 
                          : { backgroundColor: '#4B5563' }
                      }
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {diffReport.bills_with_new_hearings ? diffReport.bills_with_new_hearings.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Hearings</span>
                  </div>
                )}

                {/* Bills reported out - always show */}
                {diffReport.bills_reported_out !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div 
                      className={`badge badge-lg text-white ${diffReport.bills_reported_out && diffReport.bills_reported_out.length > 0 ? 'badge-success' : ''}`}
                      style={(!diffReport.bills_reported_out || diffReport.bills_reported_out.length === 0) ? { backgroundColor: '#4B5563' } : undefined}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {diffReport.bills_reported_out ? diffReport.bills_reported_out.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">Reported Out</span>
                  </div>
                )}

                {/* Bills with new summaries - always show */}
                {diffReport.bills_with_new_summaries !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div 
                      className={`badge badge-lg text-white ${diffReport.bills_with_new_summaries && diffReport.bills_with_new_summaries.length > 0 ? 'badge-success' : ''}`}
                      style={(!diffReport.bills_with_new_summaries || diffReport.bills_with_new_summaries.length === 0) ? { backgroundColor: '#4B5563' } : undefined}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {diffReport.bills_with_new_summaries ? diffReport.bills_with_new_summaries.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Summaries</span>
                  </div>
                )}

                {/* Bills with new votes - always show */}
                {diffReport.bills_with_new_votes !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div 
                      className={`badge badge-lg text-white ${diffReport.bills_with_new_votes && diffReport.bills_with_new_votes.length > 0 ? 'badge-success' : ''}`}
                      style={(!diffReport.bills_with_new_votes || diffReport.bills_with_new_votes.length === 0) ? { backgroundColor: '#4B5563' } : undefined}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {diffReport.bills_with_new_votes ? diffReport.bills_with_new_votes.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Votes</span>
                  </div>
                )}
              </div>

              {/* Date range and time interval - on separate line */}
              {(diffReport.previous_date || diffReport.current_date) && (
                <div className="flex items-center gap-3 pt-3 border-t border-base-300/30">
                  <svg className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex items-center gap-2 text-sm font-medium text-base-content/60">
                    {diffReport.previous_date && diffReport.current_date && (
                      <>
                        <span className="font-semibold">{new Date(diffReport.previous_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="font-semibold">{new Date(diffReport.current_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </>
                    )}
                    {calculatedTimeInterval && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-base-content/50 capitalize">{calculatedTimeInterval}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Top Movers section - only show for global view (no committeeId) */}
              {!_committeeId && topMovers && topMovers.length > 0 && (() => {
                const movers: TopMover[] = topMovers;
                return (
                  <div className="w-full mt-6 pt-6 border-t border-base-300/30">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <h4 className="text-base font-semibold text-base-content">Top Movers</h4>
                    </div>
                    <div className="space-y-2">
                      {movers.map((mover) => (
                        <div key={mover.committee_id} className="flex items-center justify-between p-2 rounded-lg bg-base-200/30 hover:bg-base-200/50 transition-colors">
                          <span className="text-sm font-medium text-base-content/80">
                            {mover.committee_name}
                          </span>
                          <span className={`text-sm font-semibold ${
                            mover.compliance_delta > 0 ? 'text-success' : 
                            mover.compliance_delta < 0 ? 'text-error' : 
                            'text-base-content/60'
                          }`}>
                            {mover.compliance_delta > 0 ? '+' : ''}
                            {mover.compliance_delta.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Right side: Analysis text */}
          {analysis && (
            <div className={`${diffReport ? 'md:border-l-2 md:border-primary/20 md:pl-6' : ''} flex-1 min-w-0 w-full`}>
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-5 h-5 text-primary/70 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.389l-.548-.547z" />
                </svg>
                <h4 className="text-sm font-semibold text-base-content/80">Analysis</h4>
              </div>
              <p className="text-sm text-base-content/75 leading-relaxed italic pl-7 bg-base-200/30 p-3 rounded-lg border-l-2 border-primary/30">
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
