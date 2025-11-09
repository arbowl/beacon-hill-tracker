import React, { useState } from 'react'
import { DiffReport, DiffReports, IntervalType } from '../types'
import IntervalSelector from './IntervalSelector'

interface CommitteeChangeWidgetProps {
  diffReport?: DiffReport | null  // Legacy support
  diffReports?: DiffReports | null  // New structure
  analysis?: string | null  // Legacy support (top-level)
  loading?: boolean
  committeeId?: string | null
  availableDates?: string[]
  onIntervalChange?: (interval: IntervalType, date?: string | null) => void
}

const CommitteeChangeWidget: React.FC<CommitteeChangeWidgetProps> = ({ 
  diffReport,  // Legacy support
  diffReports,  // New structure
  analysis,  // Legacy support
  loading = false,
  committeeId = null,
  availableDates = [],
  onIntervalChange
}) => {
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>('daily')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Determine which diff report to display
  const getDisplayDiffReport = (): DiffReport | null => {
    // If using new structure (diff_reports)
    if (diffReports) {
      if (selectedInterval === 'custom' && selectedDate) {
        // Custom date - would need to be passed from parent after API call
        return diffReport || null
      }
      if (selectedInterval !== 'custom') {
        return diffReports[selectedInterval] || null
      }
    }
    // Legacy support: use diffReport directly
    return diffReport || null
  }

  const displayDiffReport = getDisplayDiffReport()
  
  // Get analysis - only show for daily interval
  const displayAnalysis = selectedInterval === 'daily' 
    ? (displayDiffReport?.analysis || analysis || null)
    : null

  const handleIntervalChange = (interval: IntervalType) => {
    setSelectedInterval(interval)
    onIntervalChange?.(interval, selectedDate)
  }

  const handleDateChange = (date: string | null) => {
    setSelectedDate(date)
    onIntervalChange?.(selectedInterval, date)
  }
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
  if (!displayDiffReport && !displayAnalysis && !loading) {
    return null
  }

  return (
    <div className="card bg-gradient-to-br from-base-100/95 via-primary/5 to-base-100/95 border border-primary/30 shadow-md mb-6 backdrop-blur-sm w-full">
      <div className="card-body py-5 px-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-base-300/30">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-lg font-semibold text-base-content">Recent Activity (Beta)</h3>
        </div>

        {/* Interval Selector */}
        {(diffReports || diffReport) && (
          <IntervalSelector
            selectedInterval={selectedInterval}
            onIntervalChange={handleIntervalChange}
            onDateChange={handleDateChange}
            availableDates={availableDates}
            committeeId={committeeId}
          />
        )}

        <div className="flex flex-col md:flex-row items-start gap-5 w-full">
          {/* Left side: Change indicators */}
          {displayDiffReport && (
            <div className="flex-1 w-full space-y-4">
              {/* Compliance Delta - on its own line */}
              {displayDiffReport.compliance_delta !== undefined && displayDiffReport.compliance_delta !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
                  <div className={`badge badge-lg ${
                    displayDiffReport.compliance_delta > 0 ? 'badge-success text-white' : 
                    displayDiffReport.compliance_delta < 0 ? 'badge-error' : 
                    'badge-neutral'
                  }`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {displayDiffReport.compliance_delta > 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      ) : displayDiffReport.compliance_delta < 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      )}
                    </svg>
                    {displayDiffReport.compliance_delta > 0 ? '+' : ''}
                    {displayDiffReport.compliance_delta.toFixed(1)}%
                  </div>
                  <span className="text-base font-medium text-base-content/80">
                    Compliance Change
                  </span>
                </div>
              )}

              {/* Other statistics badges - vertically stacked by default, horizontal only on very large screens */}
              <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 w-full">
                {/* New Bills - always show */}
                {displayDiffReport.new_bills_count !== undefined && displayDiffReport.new_bills_count !== null && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${displayDiffReport.new_bills_count > 0 ? 'badge-warning' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {displayDiffReport.new_bills_count > 0 ? '+' : ''}{displayDiffReport.new_bills_count}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Bills</span>
                  </div>
                )}

                {/* Bills with new hearings - always show */}
                {displayDiffReport.bills_with_new_hearings !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${displayDiffReport.bills_with_new_hearings && displayDiffReport.bills_with_new_hearings.length > 0 ? 'badge-primary text-white' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {displayDiffReport.bills_with_new_hearings ? displayDiffReport.bills_with_new_hearings.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Hearings</span>
                  </div>
                )}

                {/* Bills reported out - always show */}
                {displayDiffReport.bills_reported_out !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${displayDiffReport.bills_reported_out && displayDiffReport.bills_reported_out.length > 0 ? 'badge-success text-white' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {displayDiffReport.bills_reported_out ? displayDiffReport.bills_reported_out.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">Reported Out</span>
                  </div>
                )}

                {/* Bills with new summaries - always show */}
                {displayDiffReport.bills_with_new_summaries !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${displayDiffReport.bills_with_new_summaries && displayDiffReport.bills_with_new_summaries.length > 0 ? 'badge-success text-white' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {displayDiffReport.bills_with_new_summaries ? displayDiffReport.bills_with_new_summaries.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Summaries</span>
                  </div>
                )}

                {/* Bills with new votes - always show */}
                {displayDiffReport.bills_with_new_votes !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${displayDiffReport.bills_with_new_votes && displayDiffReport.bills_with_new_votes.length > 0 ? 'badge-success text-white' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {displayDiffReport.bills_with_new_votes ? displayDiffReport.bills_with_new_votes.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Votes</span>
                  </div>
                )}
              </div>

              {/* Date range and time interval - on separate line */}
              {(displayDiffReport.previous_date || displayDiffReport.current_date || displayDiffReport.time_interval) && (
                <div className="flex items-center gap-3 pt-3 border-t border-base-300/30">
                  <svg className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex items-center gap-2 text-sm font-medium text-base-content/60">
                    {displayDiffReport.previous_date && displayDiffReport.current_date && (
                      <>
                        <span className="font-semibold">{new Date(displayDiffReport.previous_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="font-semibold">{new Date(displayDiffReport.current_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </>
                    )}
                    {displayDiffReport.time_interval && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-base-content/50">{displayDiffReport.time_interval}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right side: Analysis text - only show for daily interval */}
          {displayAnalysis && (
            <div className={`${displayDiffReport ? 'md:border-l-2 md:border-primary/20 md:pl-6' : ''} flex-1 min-w-0 w-full`}>
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-5 h-5 text-primary/70 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.389l-.548-.547z" />
                </svg>
                <h4 className="text-sm font-semibold text-base-content/80">Analysis</h4>
              </div>
              <p className="text-sm text-base-content/75 leading-relaxed italic pl-7 bg-base-200/30 p-3 rounded-lg border-l-2 border-primary/30">
                {displayAnalysis}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommitteeChangeWidget
