import React, { useState, useMemo } from 'react'
import type { DiffReport } from '../types'
import IntervalSelector, { type IntervalType } from './IntervalSelector'
import ComplianceTrendChart from './ComplianceTrendChart'
import TrendIndicator from './TrendIndicator'
import { useCommitteeMetadata, useCommitteeScanDates, useCommitteeTimeSeries } from '../hooks/useData'

interface CommitteeChangeWidgetProps {
  diffReport: DiffReport | null
  diffReports?: any
  analysis: string | null
  loading?: boolean
  committeeId?: string | null // Add committeeId to fetch time series data
}

const CommitteeChangeWidget: React.FC<CommitteeChangeWidgetProps> = ({ 
  diffReport, 
  diffReports,
  analysis, 
  loading = false,
  committeeId = null
}) => {
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>('daily')
  
  // Fetch scan dates to calculate available days
  const { scanDates } = useCommitteeScanDates(committeeId)
  const availableDays = useMemo(() => {
    if (!scanDates || scanDates.length === 0) return 0
    if (scanDates.length === 1) return 1
    const firstDate = new Date(scanDates[scanDates.length - 1])
    const lastDate = new Date(scanDates[0])
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // +1 to include both start and end dates
  }, [scanDates])

  // Fetch metadata with selected interval
  const { metadata: intervalMetadata } = useCommitteeMetadata(
    committeeId,
    selectedInterval === 'quarterly' ? 'monthly' : selectedInterval,
    null
  )

  // CRITICAL: Use the SAME data source for both diff_report and analysis to prevent contradictions
  // This is essential for data integrity in a government audit tool
  // Priority: 1) intervalMetadata (complete pair), 2) diff_reports structure (complete pair), 3) props (complete pair)
  const { finalDisplayDiffReport, finalDisplayAnalysis } = useMemo(() => {
    // Strategy: Only use a source if we can get BOTH diff_report AND analysis from it
    
    // First, try intervalMetadata - but ONLY if it has BOTH diff_report AND analysis
    if (intervalMetadata?.diff_report && intervalMetadata?.analysis) {
      return {
        finalDisplayDiffReport: intervalMetadata.diff_report,
        finalDisplayAnalysis: intervalMetadata.analysis
      }
    }
    
    // Second, try diff_reports structure from props - extract matching interval
    if (diffReports && typeof diffReports === 'object') {
      const intervalKey = selectedInterval === 'quarterly' ? 'monthly' : selectedInterval
      const intervalDiffReport = diffReports[intervalKey] || diffReports.daily
      
      if (intervalDiffReport) {
        // Use analysis from the interval's diff_report if it exists, otherwise use top-level analysis
        // This ensures they're from the same scan
        const intervalAnalysis = intervalDiffReport.analysis || analysis
        return {
          finalDisplayDiffReport: intervalDiffReport,
          finalDisplayAnalysis: intervalAnalysis
        }
      }
    }
    
    // Finally, fall back to direct props - these should be a matched pair from DashboardPage
    return {
      finalDisplayDiffReport: diffReport,
      finalDisplayAnalysis: analysis
    }
  }, [intervalMetadata, diffReports, diffReport, analysis, selectedInterval])

  // Fetch time series data for trend chart (only for daily view)
  const { timeSeriesData, loading: timeSeriesLoading } = useCommitteeTimeSeries(
    committeeId,
    selectedInterval === 'daily' && committeeId ? 7 : 0 // Only fetch for daily view when committeeId exists
  )
  
  // Debug logging
  React.useEffect(() => {
    if (committeeId) {
      console.log('CommitteeChangeWidget - committeeId:', committeeId)
      console.log('CommitteeChangeWidget - scanDates:', scanDates)
      console.log('CommitteeChangeWidget - availableDays:', availableDays)
      console.log('CommitteeChangeWidget - timeSeriesData:', timeSeriesData)
      console.log('CommitteeChangeWidget - timeSeriesLoading:', timeSeriesLoading)
    }
  }, [committeeId, scanDates, availableDays, timeSeriesData, timeSeriesLoading])

  // Calculate previous period delta for trend indicator
  const previousDelta = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length < 2) return null
    // Get the second-to-last data point
    return timeSeriesData[timeSeriesData.length - 2]?.compliance_delta ?? null
  }, [timeSeriesData])
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
  if (!finalDisplayDiffReport && !finalDisplayAnalysis) {
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
          <IntervalSelector
            selectedInterval={selectedInterval}
            onIntervalChange={setSelectedInterval}
            availableDays={availableDays}
          />
        </div>

        <div className="flex flex-col md:flex-row items-start gap-5 w-full">
          {/* Left side: Change indicators */}
          {finalDisplayDiffReport && (
            <div className="flex-1 w-full space-y-4">
              {/* Compliance Delta with Trend Indicator - on its own line */}
              {finalDisplayDiffReport.compliance_delta !== undefined && finalDisplayDiffReport.compliance_delta !== null && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
                    <div className={`badge badge-lg ${
                      finalDisplayDiffReport.compliance_delta > 0 ? 'badge-success' : 
                      finalDisplayDiffReport.compliance_delta < 0 ? 'badge-error' : 
                      'badge-neutral'
                    }`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {finalDisplayDiffReport.compliance_delta > 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        ) : finalDisplayDiffReport.compliance_delta < 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        )}
                      </svg>
                      {finalDisplayDiffReport.compliance_delta > 0 ? '+' : ''}
                      {finalDisplayDiffReport.compliance_delta.toFixed(1)}%
                    </div>
                    <span className="text-base font-medium text-base-content/80">
                      Compliance Change
                    </span>
                  </div>
                  
                  {/* Trend Indicator */}
                  {committeeId && previousDelta !== null && (
                    <div className="pl-3">
                      <TrendIndicator
                        currentDelta={finalDisplayDiffReport.compliance_delta}
                        previousDelta={previousDelta}
                      />
                    </div>
                  )}

                  {/* Time Series Chart (only for daily view with data) */}
                  {selectedInterval === 'daily' && committeeId && (
                    <div className="mt-4 p-3 rounded-lg bg-base-200/30">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-sm font-medium text-base-content/70">Trend Over Time</span>
                        {timeSeriesData && timeSeriesData.length > 0 && (
                          <span className="text-xs text-base-content/50 ml-auto">
                            {timeSeriesData.length} {timeSeriesData.length === 1 ? 'day' : 'days'}
                          </span>
                        )}
                      </div>
                      <ComplianceTrendChart
                        data={timeSeriesData && timeSeriesData.length > 0 
                          ? timeSeriesData.map(d => ({ date: d.date, compliance_delta: d.compliance_delta }))
                          : []
                        }
                        loading={timeSeriesLoading}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Other statistics badges - vertically stacked by default, horizontal only on very large screens */}
              <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 w-full">
                {/* New Bills - always show */}
                {finalDisplayDiffReport.new_bills_count !== undefined && finalDisplayDiffReport.new_bills_count !== null && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${finalDisplayDiffReport.new_bills_count > 0 ? 'badge-info' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {finalDisplayDiffReport.new_bills_count > 0 ? '+' : ''}{finalDisplayDiffReport.new_bills_count}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Bills</span>
                  </div>
                )}

                {/* Bills with new hearings - always show */}
                {finalDisplayDiffReport.bills_with_new_hearings !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${finalDisplayDiffReport.bills_with_new_hearings && finalDisplayDiffReport.bills_with_new_hearings.length > 0 ? 'badge-warning' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {finalDisplayDiffReport.bills_with_new_hearings ? finalDisplayDiffReport.bills_with_new_hearings.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Hearings</span>
                  </div>
                )}

                {/* Bills reported out - always show */}
                {finalDisplayDiffReport.bills_reported_out !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${finalDisplayDiffReport.bills_reported_out && finalDisplayDiffReport.bills_reported_out.length > 0 ? 'badge-success' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {finalDisplayDiffReport.bills_reported_out ? finalDisplayDiffReport.bills_reported_out.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">Reported Out</span>
                  </div>
                )}

                {/* Bills with new summaries - always show */}
                {finalDisplayDiffReport.bills_with_new_summaries !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${finalDisplayDiffReport.bills_with_new_summaries && finalDisplayDiffReport.bills_with_new_summaries.length > 0 ? 'badge-success' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {finalDisplayDiffReport.bills_with_new_summaries ? finalDisplayDiffReport.bills_with_new_summaries.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Summaries</span>
                  </div>
                )}

                {/* Bills with new votes - always show */}
                {finalDisplayDiffReport.bills_with_new_votes !== undefined && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200/30 lg:flex-1 lg:min-w-[120px]">
                    <div className={`badge badge-lg ${finalDisplayDiffReport.bills_with_new_votes && finalDisplayDiffReport.bills_with_new_votes.length > 0 ? 'badge-primary' : 'badge-ghost'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {finalDisplayDiffReport.bills_with_new_votes ? finalDisplayDiffReport.bills_with_new_votes.length : 0}
                    </div>
                    <span className="text-xs font-medium text-base-content/70 text-center">New Votes</span>
                  </div>
                )}
              </div>

              {/* Date range and time interval - on separate line */}
              {(finalDisplayDiffReport.previous_date || finalDisplayDiffReport.current_date || finalDisplayDiffReport.time_interval) && (
                <div className="flex items-center gap-3 pt-3 border-t border-base-300/30">
                  <svg className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex items-center gap-2 text-sm font-medium text-base-content/60">
                    {finalDisplayDiffReport.previous_date && finalDisplayDiffReport.current_date && (
                      <>
                        <span className="font-semibold">{new Date(finalDisplayDiffReport.previous_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="font-semibold">{new Date(finalDisplayDiffReport.current_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </>
                    )}
                    {finalDisplayDiffReport.time_interval && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-base-content/50 capitalize">{finalDisplayDiffReport.time_interval}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right side: Analysis text */}
          {finalDisplayAnalysis && (
            <div className={`${finalDisplayDiffReport ? 'md:border-l-2 md:border-primary/20 md:pl-6' : ''} flex-1 min-w-0 w-full`}>
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-5 h-5 text-primary/70 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.389l-.548-.547z" />
                </svg>
                <h4 className="text-sm font-semibold text-base-content/80">Analysis</h4>
              </div>
              <p className="text-sm text-base-content/75 leading-relaxed italic pl-7 bg-base-200/30 p-3 rounded-lg border-l-2 border-primary/30">
                {finalDisplayAnalysis}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommitteeChangeWidget
