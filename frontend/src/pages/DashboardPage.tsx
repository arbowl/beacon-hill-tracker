import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGlobalStats, useCommittees, useBills, useCommitteeStats, useSavedViews, useCommitteeDetails, useDebounce, useCommitteeMetadata, useGlobalMetadata, useFilteredStats, useViolationAnalysis } from '../hooks/useData'
import { useAuth } from '../contexts/AuthContext'
import { DashboardFilters, Bill } from '../types'
import { ComplianceOverviewChart, CommitteeComparisonChart, ViolationAnalysisChart } from '../components/charts'
import { getStateLabel, getStateBadgeClass } from '../utils/billStatus'
import CommitteeChangeWidget from '../components/CommitteeChangeWidget'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: stats, loading: statsLoading, error: statsError } = useGlobalStats()
  const { committees, loading: committeesLoading, error: committeesError } = useCommittees()
  const { data: committeeStats, loading: committeeStatsLoading, error: committeeStatsError } = useCommitteeStats()
  const { createSavedView, savedViews } = useSavedViews()
  
  const [filters, setFilters] = useState<DashboardFilters>({
    committees: [],
    chambers: [],
    states: [],
    dateRange: {
      start: null,
      end: null
    },
    searchTerm: ''
  })

  const [viewName, setViewName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [showBillModal, setShowBillModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [isLoadingFromURL, setIsLoadingFromURL] = useState(true)
  const [showCharts, setShowCharts] = useState(true)
  const [showCommitteeContact, setShowCommitteeContact] = useState(false)

  // Debounce the search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500)

  // Create debounced filters for API calls
  const debouncedFilters = useMemo(() => ({
    ...filters,
    searchTerm: debouncedSearchTerm
  }), [filters.committees, filters.chambers, filters.states, filters.dateRange, debouncedSearchTerm])

  // Load filters and view state from URL parameters (for saved views and shared links)
  // Only runs on initial page load to prevent circular updates
  useEffect(() => {
    if (!isLoadingFromURL) return

    const committees = searchParams.get('committees')?.split(',').filter(Boolean) || []
    const chambers = searchParams.get('chambers')?.split(',').filter(Boolean) || []
    const states = searchParams.get('states')?.split(',').filter(Boolean) || []
    const searchTerm = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortCol = searchParams.get('sortBy')
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null
    const page = searchParams.get('page')
    const size = searchParams.get('pageSize')

    if (committees.length || chambers.length || states.length || searchTerm || startDate || endDate) {
      setFilters({
        committees,
        chambers,
        states,
        dateRange: {
          start: startDate,
          end: endDate
        },
        searchTerm
      })
    }

    // Load sort state
    if (sortCol && sortDir) {
      setSortColumn(sortCol)
      setSortDirection(sortDir)
    }

    // Load pagination state
    if (page) {
      const pageNum = parseInt(page, 10)
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum)
      }
    }
    if (size) {
      const sizeNum = parseInt(size, 10)
      if (!isNaN(sizeNum) && [10, 25, 50, 100].includes(sizeNum)) {
        setPageSize(sizeNum)
      }
    }

    // Mark as loaded to prevent future runs
    setIsLoadingFromURL(false)
  }, [searchParams, isLoadingFromURL])

  // Check if view name already exists
  const viewNameExists = savedViews && Array.isArray(savedViews) 
    ? savedViews.some(view => view.name.toLowerCase() === viewName.trim().toLowerCase())
    : false

  // Committee chart view mode state
  const [committeeViewMode, setCommitteeViewMode] = useState<'top_performers' | 'all_committees'>('top_performers')
  const [committeeLimit, setCommitteeLimit] = useState(15)

  // Fetch bills with debounced filters, pagination, and sorting (for table display only)
  const { bills: billsData, loading: billsLoading, error: billsError, totalCount: totalBillsCount, totalPages: billsTotalPages } = useBills(debouncedFilters, currentPage, pageSize, sortColumn, sortDirection)
  
  // Fetch filtered stats (efficient - only returns counts, not bill data)
  const { data: filteredStats, loading: filteredStatsLoading } = useFilteredStats(debouncedFilters)
  
  // Fetch violation analysis (efficient - only returns violation counts, not bill data)
  const { data: violationAnalysis, loading: violationsLoading } = useViolationAnalysis(debouncedFilters)

  // Fetch committee details when a single committee is selected
  const selectedCommitteeId = filters.committees.length === 1 ? filters.committees[0] : null
  const { committee: selectedCommitteeDetails } = useCommitteeDetails(selectedCommitteeId)
  const { metadata: committeeMetadata, loading: metadataLoading } = useCommitteeMetadata(
    selectedCommitteeId
  )
  const { metadata: globalMetadata, loading: globalMetadataLoading } = useGlobalMetadata()
  
  // Use committee metadata if a committee is selected, otherwise use global aggregated metadata
  const displayMetadata = selectedCommitteeId ? committeeMetadata : globalMetadata
  const displayMetadataLoading = selectedCommitteeId ? metadataLoading : globalMetadataLoading

  // Calculate contextual stats based on current filters
  // CRITICAL: Always use dedicated stats endpoints, NEVER use paginated bill data
  const contextualStats = useMemo(() => {
    // If no committees selected, ALWAYS use global stats from API (never use filteredStats)
    // This prevents issues where search terms or other filters might cause incorrect stats
    if (!filters.committees || filters.committees.length === 0) {
      if (!stats || statsLoading) return null
      
      // Always use global stats - ignore any other filters for global view
      // Backend returns unknown_bills (not provisional_bills), so use that for provisional
      // IMPORTANT: unknown_bills is set to 0 because it's already included in provisional_bills
      // The chart component adds provisional_bills + unknown_bills, so we must not double-count
      return {
        title: 'All Committees',
        total_committees: stats.total_committees,
        total_bills: stats.total_bills,
        compliant_bills: stats.compliant_bills,
        provisional_bills: stats.unknown_bills || 0, // Backend uses unknown_bills, frontend calls it provisional
        incomplete_bills: 0,
        non_compliant_bills: stats.non_compliant_bills,
        unknown_bills: 0, // Set to 0 - already included in provisional_bills to avoid double-counting in chart
        overall_compliance_rate: stats.overall_compliance_rate
      }
    }

    // For filtered committees, use filteredStats endpoint (includes ALL bills for that committee)
    // Wait for loading to complete to avoid showing stale/wrong data
    if (!filteredStats || filteredStatsLoading) return null
    
    const selectedCommittees = committees?.filter(c => filters.committees.includes(c.committee_id))
    const committeeNames = selectedCommittees?.map(c => c.name) || []
    const title = committeeNames.length === 1 
      ? `${committeeNames[0]}`
      : `${filters.committees.length} Selected Committees`

    // Use stats from filteredStats endpoint (provisional = unknown_bills in this context)
    // This endpoint returns stats for ALL bills matching filters, not just paginated ones
    // IMPORTANT: unknown_bills is set to 0 because it's already included in provisional_bills
    // The chart component adds provisional_bills + unknown_bills, so we must not double-count
    return {
      title,
      total_committees: filters.committees.length,
      total_bills: filteredStats.total_bills || 0,
      compliant_bills: filteredStats.compliant_bills || 0,
      provisional_bills: filteredStats.unknown_bills || 0,
      incomplete_bills: 0,
      non_compliant_bills: filteredStats.non_compliant_bills || 0,
      unknown_bills: 0, // Set to 0 - already included in provisional_bills to avoid double-counting in chart
      overall_compliance_rate: filteredStats.overall_compliance_rate || 0
    }
  }, [filteredStats, filteredStatsLoading, filters.committees, stats, statsLoading, committees])


  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Bills are now sorted and paginated on the backend
  // No client-side sorting/pagination needed

  // Violation analysis is now fetched from backend endpoint (efficient)
  // No need to calculate from bill data - backend returns violation counts directly

  // Reset to first page when debounced filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [debouncedFilters])

  // Sortable column header component
  const SortableHeader = ({ column, label, children }: { column: string, label?: string, children?: React.ReactNode }) => {
    const isActive = sortColumn === column
    const content = children || label || column
    
    return (
      <th 
        className="cursor-pointer hover:bg-base-200 select-none transition-colors"
        onClick={() => handleSort(column)}
        title={`Click to sort by ${label || column}`}
      >
        <div className="flex items-center gap-1">
          <span>{content}</span>
          {isActive && (
            <span className="text-primary">
              {sortDirection === 'asc' ? '▲' : '▼'}
            </span>
          )}
          {!isActive && (
            <span className="text-base-content/30 text-xs">⇅</span>
          )}
        </div>
      </th>
    )
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Update URL with current view state
  const updateURLWithViewState = () => {
    const params = new URLSearchParams()

    // Add filters
    if (filters.committees.length > 0) {
      params.set('committees', filters.committees.join(','))
    }
    if (filters.chambers.length > 0) {
      params.set('chambers', filters.chambers.join(','))
    }
    if (filters.states.length > 0) {
      params.set('states', filters.states.join(','))
    }
    if (filters.searchTerm) {
      params.set('search', filters.searchTerm)
    }
    if (filters.dateRange.start) {
      params.set('startDate', filters.dateRange.start)
    }
    if (filters.dateRange.end) {
      params.set('endDate', filters.dateRange.end)
    }

    // Add sort state
    if (sortColumn && sortDirection) {
      params.set('sortBy', sortColumn)
      params.set('sortDir', sortDirection)
    }

    // Add pagination
    if (currentPage > 1) {
      params.set('page', currentPage.toString())
    }
    if (pageSize !== 25) {
      params.set('pageSize', pageSize.toString())
    }

    setSearchParams(params, { replace: true })
  }

  // Update URL whenever view state changes (but not on initial load or when loading from URL)
  useEffect(() => {
    // Skip if still loading from URL
    if (isLoadingFromURL) return

    // Update URL with current state
    const timer = setTimeout(() => {
      updateURLWithViewState()
    }, 100)
    return () => clearTimeout(timer)
  }, [filters, sortColumn, sortDirection, currentPage, pageSize, isLoadingFromURL])

  // Copy current view URL to clipboard
  const handleShareView = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const url = window.location.href
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          textArea.remove()
        } catch (err) {
          textArea.remove()
          throw err
        }
      }
      
      // Show success message
      const alertDiv = document.createElement('div')
      alertDiv.className = 'alert alert-success fixed top-4 right-4 w-auto z-50 shadow-lg'
      alertDiv.innerHTML = `
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Link copied to clipboard!</span>
        </div>
      `
      document.body.appendChild(alertDiv)
      
      setTimeout(() => {
        if (alertDiv.parentNode) {
          document.body.removeChild(alertDiv)
        }
      }, 3000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      
      // Show error message with the URL so user can copy manually
      const alertDiv = document.createElement('div')
      alertDiv.className = 'alert alert-warning fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg'
      alertDiv.innerHTML = `
        <div>
          <div class="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="font-semibold">Copy manually:</span>
          </div>
          <input 
            type="text" 
            class="input input-bordered input-sm w-full font-mono text-xs" 
            value="${url}" 
            readonly 
            onclick="this.select()"
          />
        </div>
      `
      document.body.appendChild(alertDiv)
      
      setTimeout(() => {
        if (alertDiv.parentNode) {
          document.body.removeChild(alertDiv)
        }
      }, 5000)
    }
  }

  const handleExportCSV = async () => {
    if (!billsData) return
    
    setIsExporting(true)
    try {
      // Create comprehensive CSV content with compliance fields
      const headers = [
        'Bill ID', 
        'Bill Title', 
        'Committee ID',
        'Committee Name', 
        'Chamber', 
        'Effective State',
        'Original State', 
        'Reason',
        'Hearing Date', 
        'Deadline (60 Days)', 
        'Effective Deadline',
        'Extension Date',
        'Extension Order URL',
        'Reported Out',
        'Summary Present',
        'Summary URL',
        'Votes Present', 
        'Votes URL',
        'Notice Status',
        'Notice Gap Days',
        'Announcement Date',
        'Scheduled Hearing Date',
        'Generated At'
      ]
      
      const csvContent = [
        headers.join(','),
        ...billsData.map((bill: Bill) => [
          bill.bill_id || '',
          `"${(bill.bill_title || '').replace(/"/g, '""')}"`,
          bill.committee_id || '',
          `"${(bill.committee_name || '').replace(/"/g, '""')}"`,
          bill.chamber || '',
          getStateLabel(bill),
          bill.state || '',
          `"${(bill.reason || '').replace(/"/g, '""')}"`,
          bill.hearing_date || '',
          bill.deadline_60 || '',
          bill.effective_deadline || '',
          bill.extension_date || '',
          bill.extension_order_url || '',
          bill.reported_out ? 'Yes' : 'No',
          bill.summary_present ? 'Yes' : 'No',
          bill.summary_url || '',
          bill.votes_present ? 'Yes' : 'No',
          bill.votes_url || '',
          bill.notice_status || '',
          bill.notice_gap_days?.toString() || '',
          bill.announcement_date || '',
          bill.scheduled_hearing_date || '',
          bill.generated_at || ''
        ].join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance_data_detailed_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSaveView = async () => {
    if (!viewName.trim()) return
    
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }
    
    try {
      const payload = {
        filters,
        description: `Saved view with ${billsData?.length || 0} bills`,
        metadata: {
          billCount: billsData?.length || 0,
          createdAt: new Date().toISOString()
        }
      }

      console.log('Attempting to save view:', { name: viewName.trim(), payload })
      await createSavedView(viewName.trim(), payload)
      console.log('View saved successfully')
      
      setShowSaveModal(false)
      setViewName('')
      
      // Show success message
      const alert = document.createElement('div')
      alert.className = 'alert alert-success fixed top-4 right-4 w-auto z-50'
      alert.innerHTML = `
        <span>✓ View "${viewName.trim()}" saved successfully!</span>
      `
      document.body.appendChild(alert)
      
      setTimeout(() => {
        document.body.removeChild(alert)
      }, 3000)
      
    } catch (error) {
      console.error('Save failed:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      })
      
      // Determine error message based on status code
      let errorMessage = 'Failed to save view. Please try again.'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        if (axiosError.response?.status === 409) {
          errorMessage = `A saved view named "${viewName.trim()}" already exists. Please choose a different name.`
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'You are not authorized to save views. Please log in again.'
        } else if (axiosError.response?.status === 400) {
          errorMessage = 'Invalid view data. Please check your filters and try again.'
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      }
      
      // Show error message
      const alert = document.createElement('div')
      alert.className = 'alert alert-error fixed top-4 right-4 w-auto z-50 max-w-md'
      alert.innerHTML = `
        <span>✗ ${errorMessage}</span>
      `
      document.body.appendChild(alert)
      
      setTimeout(() => {
        document.body.removeChild(alert)
      }, 3000)
    }
  }

  const handleLoadSavedView = (viewId: number) => {
    const selectedView = savedViews.find(view => view.id === viewId)
    if (!selectedView) return

    try {
      const payload = JSON.parse(selectedView.payload_json)
      if (payload.filters) {
        setFilters(payload.filters)
        
        // Show success message
        const alert = document.createElement('div')
        alert.className = 'alert alert-success fixed top-4 right-4 w-auto z-50'
        alert.innerHTML = `
          <span>✓ Loaded view "${selectedView.name}"</span>
        `
        document.body.appendChild(alert)
        
        setTimeout(() => {
          document.body.removeChild(alert)
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to load view:', error)
      
      // Show error message
      const alert = document.createElement('div')
      alert.className = 'alert alert-error fixed top-4 right-4 w-auto z-50'
      alert.innerHTML = `
        <span>✗ Failed to load view</span>
      `
      document.body.appendChild(alert)
      
      setTimeout(() => {
        document.body.removeChild(alert)
      }, 2000)
    }
  }

  // Don't block rendering - show content as it loads
  // Show errors inline if they occur
  if (statsError || committeesError || committeeStatsError) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Error loading dashboard data: {statsError || committeesError || committeeStatsError}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-base-content/70">
            Track committee compliance with Massachusetts legislative transparency requirements.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button 
            className="btn btn-outline w-full sm:w-auto"
            onClick={handleShareView}
            title="Copy shareable link to clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Link
          </button>
          
          <button 
            className={`btn btn-primary w-full sm:w-auto ${isExporting ? 'loading' : ''}`}
            onClick={handleExportCSV}
            disabled={!billsData || isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          
          {user && (
            <>
              {/* Saved Views Dropdown */}
              {savedViews.length > 0 && (
                <div className="dropdown dropdown-end w-full sm:w-auto">
                  <div tabIndex={0} role="button" className="btn btn-outline w-full sm:w-auto">
                    📁 Load View
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 max-h-64 overflow-y-auto">
                    {savedViews.map((view) => (
                      <li key={view.id}>
                        <a 
                          onClick={() => handleLoadSavedView(view.id)}
                          className="text-left"
                        >
                          <div>
                            <div className="font-medium">{view.name}</div>
                            <div className="text-xs text-base-content/70">
                              {new Date(view.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </a>
                      </li>
                    ))}
                    <div className="divider my-1"></div>
                    <li>
                      <a href="/views" className="text-primary">
                        <span>⚙️</span> Manage All Views
                      </a>
                    </li>
                  </ul>
                </div>
              )}
              
              <button 
                className="btn btn-secondary w-full sm:w-auto"
                onClick={() => setShowSaveModal(true)}
              >
                💾 Save View
              </button>
            </>
          )}
        </div>
      </div>

      {/* Understanding Compliance States */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg mb-3">Understanding Compliance States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="badge badge-success badge-lg shrink-0 mt-1">Compliant</div>
              <div className="text-sm text-base-content/80">
                All requirements met: 10+ days advance notice, summary posted, votes posted, and reported out.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="badge badge-success badge-outline badge-lg shrink-0 mt-1">Provisional</div>
              <div className="text-sm text-base-content/80">
                On-track to be fully compliant; some requirements still pending but within allowable timeframes, and no violations detected.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="badge badge-error badge-lg shrink-0 mt-1">Non-Compliant</div>
              <div className="text-sm text-base-content/80">
                Missing requirements, insufficient notice, or deadline passed without completion.
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-base-300">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-3">
              <div className="flex items-start space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-warning shrink-0 w-4 h-4 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs text-base-content/80">
                  <strong>Disclaimer:</strong> This dashboard is a passion project and analytical tool designed to promote transparency. 
                  While every effort is made to ensure accuracy, it should not be considered a definitive source of truth. 
                  Please use this tool as a guide and verify critical information through official legislative sources.
                </div>
              </div>
            </div>
            <div className="text-xs text-base-content/60 flex items-center justify-between">
              <span>
                For detailed compliance rules and methodology, visit the <a href="/about" className="link link-primary">About page</a>.
              </span>
              {stats?.latest_report_date && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Last updated: {new Date(stats.latest_report_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
              {!stats?.latest_report_date && billsData && billsData.length > 0 && billsData[0].generated_at && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Data generated: {new Date(billsData[0].generated_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title text-lg">Filters</h2>
            <button 
              className="btn btn-ghost btn-xs"
              onClick={() => setFilters({
                committees: [],
                chambers: [],
                states: [],
                dateRange: { start: null, end: null },
                searchTerm: ''
              })}
              title="Clear all filters"
            >
              Clear All
            </button>
          </div>
          
          {/* Helper text */}
          <div className="bg-base-200/50 p-3 rounded-lg mb-4">
            <div className="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-primary shrink-0 w-5 h-5 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-sm text-base-content/80">
                Use the filters below to sort the data by title, ID, compliance state, and committee. 
                Any changes you make will automatically update all statistics, charts, and the bills table below.
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">Search Bills</span>
                {filters.searchTerm !== debouncedSearchTerm && (
                  <span className="label-text-alt text-info">Typing...</span>
                )}
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Search by bill ID or title..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  searchTerm: e.target.value
                }))}
              />
            </div>
            
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">Compliance State</span>
              </label>
              <select 
                className="select select-bordered select-sm"
                value={filters.states.length > 0 ? filters.states[0] : ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFilters(prev => ({
                    ...prev,
                    states: value ? [value] : []
                  }))
                }}
              >
                <option value="">All States</option>
                <option value="compliant">Compliant</option>
                <option value="non-compliant">Non-Compliant</option>
                <option value="unknown">Provisional</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">Committee</span>
              </label>
              <select 
                className="select select-bordered select-sm"
                value={filters.committees.length > 0 ? filters.committees[0] : ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFilters(prev => ({
                    ...prev,
                    committees: value ? [value] : []
                  }))
                }}
                disabled={committeesLoading}
              >
                <option value="">All Committees</option>
                {committeesLoading ? (
                  <option disabled>Loading committees...</option>
                ) : (
                  committees?.map(committee => (
                    <option key={committee.committee_id} value={committee.committee_id}>
                      {committee.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {contextualStats && (
        <div className="space-y-4">
          {/* Context Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-base-content mb-2">
              {contextualStats.title}
            </h2>
            {filters.committees && filters.committees.length > 0 && (
              <p className="text-base-content/70">
                Showing data for selected committee{filters.committees.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat bg-base-100 shadow-md">
              <div className="stat-title">
                {filters.committees && filters.committees.length > 0 ? 'Selected Committees' : 'Total Committees'}
              </div>
              <div className="stat-value text-primary">{contextualStats.total_committees}</div>
              <div className="stat-desc">
                {filters.committees && filters.committees.length > 0 ? 'In current filter' : 'Tracking compliance'}
              </div>
            </div>
            
            <div className="stat bg-base-100 shadow-md">
              <div className="stat-title">Total Bills</div>
              <div className="stat-value text-success">{contextualStats.total_bills}</div>
              <div className="stat-desc">
                {filters.committees && filters.committees.length > 0 ? 'In selected committees' : 'Under review'}
              </div>
            </div>
            
            <div className="stat bg-base-100 shadow-md">
              <div className="stat-title">Compliance Rate</div>
              <div className={`stat-value ${
                contextualStats.overall_compliance_rate >= 80 ? 'text-success' :
                contextualStats.overall_compliance_rate >= 60 ? 'text-warning' :
                'text-error'
              }`}>
                {contextualStats.overall_compliance_rate}%
              </div>
              <div className="stat-desc">
                {filters.committees && filters.committees.length > 0 ? 'Committee performance' : 'Overall performance'}
              </div>
            </div>
            
            <div className="stat bg-base-100 shadow-md">
              <div className="stat-title">Non-Compliant</div>
              <div className="stat-value text-error">{contextualStats.non_compliant_bills}</div>
              <div className="stat-desc">Need attention</div>
            </div>
          </div>
        </div>
      )}

      {/* Committee Change Widget - shown when committee selected or for global view */}
      {(selectedCommitteeId || displayMetadata?.diff_report) && (
        <CommitteeChangeWidget
          diffReport={displayMetadata?.diff_report || null}
          analysis={displayMetadata?.analysis || null}
          loading={displayMetadataLoading}
          committeeId={selectedCommitteeId}
        />
      )}

      {/* Committee Contact Details - Show when single committee is selected */}
      {selectedCommitteeId && selectedCommitteeDetails && (
        <div className="space-y-6">
          {/* Committee Contact Header with Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Committee Contact Information</h2>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setShowCommitteeContact(!showCommitteeContact)}
            >
              {showCommitteeContact ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  Hide Contact Info
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                  Show Contact Info
                </>
              )}
            </button>
          </div>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showCommitteeContact ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6 mr-2 inline">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedCommitteeDetails.name}
                  </h3>
                  <div className="badge badge-primary">{selectedCommitteeDetails.chamber}</div>
                </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Committee Info */}
              <div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <a 
                      href={selectedCommitteeDetails.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link link-primary text-sm"
                    >
                      Official Committee Page
                    </a>
                  </div>
                  <div className="text-sm text-base-content/70">
                    Committee ID: {selectedCommitteeDetails.committee_id}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* House Contact */}
                {(selectedCommitteeDetails.house_chair_name || selectedCommitteeDetails.house_phone || selectedCommitteeDetails.house_room) && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-base flex items-center">
                      <span className="badge badge-info badge-sm mr-2">House</span>
                      Contact
                    </h4>
                    {selectedCommitteeDetails.house_chair_name && (
                      <div>
                        <div className="text-sm font-medium">Chair</div>
                        <div className="text-sm">{selectedCommitteeDetails.house_chair_name}</div>
                        {selectedCommitteeDetails.house_chair_email && (
                          <a 
                            href={`mailto:${selectedCommitteeDetails.house_chair_email}`}
                            className="text-xs link link-primary"
                          >
                            {selectedCommitteeDetails.house_chair_email}
                          </a>
                        )}
                      </div>
                    )}
                    {selectedCommitteeDetails.house_vice_chair_name && (
                      <div>
                        <div className="text-sm font-medium">Vice Chair</div>
                        <div className="text-sm">{selectedCommitteeDetails.house_vice_chair_name}</div>
                        {selectedCommitteeDetails.house_vice_chair_email && (
                          <a 
                            href={`mailto:${selectedCommitteeDetails.house_vice_chair_email}`}
                            className="text-xs link link-primary"
                          >
                            {selectedCommitteeDetails.house_vice_chair_email}
                          </a>
                        )}
                      </div>
                    )}
                    {selectedCommitteeDetails.house_phone && (
                      <div>
                        <div className="text-sm font-medium">Phone</div>
                        <div className="text-sm">{selectedCommitteeDetails.house_phone}</div>
                      </div>
                    )}
                    {selectedCommitteeDetails.house_room && (
                      <div>
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm">{selectedCommitteeDetails.house_room}</div>
                        {selectedCommitteeDetails.house_address && (
                          <div className="text-xs text-base-content/70">{selectedCommitteeDetails.house_address}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Senate Contact */}
                {(selectedCommitteeDetails.senate_chair_name || selectedCommitteeDetails.senate_phone || selectedCommitteeDetails.senate_room) && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-base flex items-center">
                      <span className="badge badge-warning badge-sm mr-2">Senate</span>
                      Contact
                    </h4>
                    {selectedCommitteeDetails.senate_chair_name && (
                      <div>
                        <div className="text-sm font-medium">Chair</div>
                        <div className="text-sm">{selectedCommitteeDetails.senate_chair_name}</div>
                        {selectedCommitteeDetails.senate_chair_email && (
                          <a 
                            href={`mailto:${selectedCommitteeDetails.senate_chair_email}`}
                            className="text-xs link link-primary"
                          >
                            {selectedCommitteeDetails.senate_chair_email}
                          </a>
                        )}
                      </div>
                    )}
                    {selectedCommitteeDetails.senate_vice_chair_name && (
                      <div>
                        <div className="text-sm font-medium">Vice Chair</div>
                        <div className="text-sm">{selectedCommitteeDetails.senate_vice_chair_name}</div>
                        {selectedCommitteeDetails.senate_vice_chair_email && (
                          <a 
                            href={`mailto:${selectedCommitteeDetails.senate_vice_chair_email}`}
                            className="text-xs link link-primary"
                          >
                            {selectedCommitteeDetails.senate_vice_chair_email}
                          </a>
                        )}
                      </div>
                    )}
                    {selectedCommitteeDetails.senate_phone && (
                      <div>
                        <div className="text-sm font-medium">Phone</div>
                        <div className="text-sm">{selectedCommitteeDetails.senate_phone}</div>
                      </div>
                    )}
                    {selectedCommitteeDetails.senate_room && (
                      <div>
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm">{selectedCommitteeDetails.senate_room}</div>
                        {selectedCommitteeDetails.senate_address && (
                          <div className="text-xs text-base-content/70">{selectedCommitteeDetails.senate_address}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      )}

         {/* Data Visualizations */}
         <div className="space-y-6">
           {/* Charts Section Header with Toggle */}
           <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold">Data Visualizations</h2>
             <button 
               className="btn btn-outline btn-sm"
               onClick={() => setShowCharts(!showCharts)}
             >
               {showCharts ? (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                   </svg>
                   Hide Charts
                 </>
               ) : (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                   </svg>
                   Show Charts
                 </>
               )}
             </button>
           </div>

           <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showCharts ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}>
             <div className="space-y-6">
               {/* Top Row: Compliance Overview and Violation Analysis */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Compliance Overview Chart */}
             <div className="card bg-base-100 shadow-md lg:col-span-1">
               <div className="card-body">
                 <h2 className="card-title">
                   {contextualStats?.title === 'All Committees' 
                     ? 'Compliance Overview' 
                     : `Compliance Overview - ${contextualStats?.title || 'Loading...'}`}
                 </h2>
                <ComplianceOverviewChart 
                  data={{
                    compliant_bills: contextualStats?.compliant_bills || 0,
                    provisional_bills: contextualStats?.provisional_bills || 0,
                    incomplete_bills: contextualStats?.incomplete_bills || 0,
                    non_compliant_bills: contextualStats?.non_compliant_bills || 0,
                    unknown_bills: contextualStats?.unknown_bills || 0
                  }}
                  loading={statsLoading || (filters.committees.length > 0 && filteredStatsLoading)}
                />
               </div>
             </div>

             {/* Violation Analysis Chart */}
             <div className="card bg-base-100 shadow-md lg:col-span-2">
               <div className="card-body">
                 <h2 className="card-title">
                   {filters.committees.length === 0 
                     ? 'Top Non-Compliance Issues' 
                     : filters.committees.length === 1
                     ? `Non-Compliance Issues - ${committees?.find(c => c.committee_id === filters.committees[0])?.name || 'Selected Committee'}`
                     : `Non-Compliance Issues - ${filters.committees.length} Selected Committees`}
                 </h2>
                <ViolationAnalysisChart 
                  data={violationAnalysis || []}
                  loading={violationsLoading}
                  chartType="horizontal_bar"
                  showDetails={false}
                />
               </div>
             </div>
           </div>

           {/* Bottom Row: Committee Performance (Full Width) */}
           <div className="card bg-base-100 shadow-md">
             <div className="card-body">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                 <h2 className="card-title">Committee Performance</h2>
                 
                 {/* Chart Controls */}
                 <div className="flex flex-col sm:flex-row gap-2">
                   <select 
                     className="select select-bordered select-sm"
                     value={committeeViewMode}
                     onChange={(e) => setCommitteeViewMode(e.target.value as 'top_performers' | 'all_committees')}
                   >
                     <option value="top_performers">Top</option>
                     <option value="all_committees">All</option>
                   </select>
                   
                   {committeeViewMode !== 'all_committees' && (
                     <select 
                       className="select select-bordered select-sm"
                       value={committeeLimit}
                       onChange={(e) => setCommitteeLimit(Number(e.target.value))}
                     >
                       <option value={10}>Show 10</option>
                       <option value={15}>Show 15</option>
                       <option value={20}>Show 20</option>
                       <option value={25}>Show 25</option>
                     </select>
                   )}
                 </div>
               </div>
               
              <CommitteeComparisonChart 
                key={`committee-chart-${committeeViewMode}-${committeeLimit}-${selectedCommitteeId || 'none'}`}
                data={committeeStats?.map(committee => ({
                  committee_id: committee.committee_id,
                  name: committee.committee_name,
                  compliance_rate: committee.compliance_rate || 0,
                  total_bills: committee.total_bills || 0,
                  compliant_count: committee.compliant_count || 0,
                  provisional_count: committee.unknown_count || 0,  // Map unknown_count to provisional_count for display
                  incomplete_count: committee.incomplete_count || 0,
                  non_compliant_count: committee.non_compliant_count || 0
                })) || []}
                loading={committeeStatsLoading}
                chartType="horizontal_bar"
                viewMode={committeeViewMode}
                limit={committeeLimit}
                highlightedCommitteeId={selectedCommitteeId}
              />
             </div>
           </div>
             </div>
           </div>
         </div>

      {/* Results Summary */}
      {billsData && totalBillsCount !== undefined && (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Showing {totalBillsCount} bill{totalBillsCount !== 1 ? 's' : ''} matching your filters</span>
        </div>
      )}

      {/* Bills Table */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Bills Data</h2>
          
          {billsLoading ? (
            <div className="flex justify-center py-8">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : billsError ? (
            <div className="alert alert-error">
              <span>Error loading bills: {billsError}</span>
            </div>
          ) : billsData && billsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <SortableHeader column="bill_id" label="Bill ID" />
                    <SortableHeader column="title" label="Title" />
                    <SortableHeader column="committee" label="Committee" />
                    <SortableHeader column="status" label="Status" />
                    <SortableHeader column="summary" label="Summary" />
                    <SortableHeader column="votes" label="Votes" />
                    <SortableHeader column="reported_out" label="Reported Out" />
                    <SortableHeader column="notice_gap" label="Notice Gap" />
                    <SortableHeader column="hearing_date" label="Hearing Date" />
                    <SortableHeader column="deadline" label="Deadline" />
                  </tr>
                </thead>
                <tbody>
                  {billsData.map((bill: Bill) => (
                    <tr key={`${bill.bill_id}-${bill.committee_name || 'unknown'}`}>
                      <td>
                        <div className="font-mono font-bold">{bill.bill_id}</div>
                      </td>
                      <td>
                        <div 
                          className="cursor-pointer hover:text-primary transition-colors duration-200"
                          title={bill.bill_title}
                          onClick={() => {
                            setSelectedBill(bill)
                            setShowBillModal(true)
                          }}
                        >
                          <div className="line-clamp-2 text-sm leading-tight">
                            {bill.bill_title}
                          </div>
                          <div className="text-xs text-base-content/50 mt-1">
                            Click to view details
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">{bill.committee_name}</div>
                      </td>
                      <td>
                        <div className={`badge badge-lg whitespace-nowrap px-3 ${getStateBadgeClass(bill)}`}>
                          {getStateLabel(bill)}
                        </div>
                      </td>
                      <td className="text-center">
                        {bill.summary_present ? (
                          bill.summary_url ? (
                            <a 
                              href={bill.summary_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-success hover:underline hover:text-success-focus text-xl inline-flex items-center gap-0.5 font-bold cursor-pointer transition-all"
                              onClick={(e) => e.stopPropagation()}
                              title="Summary available - Click to view"
                            >
                              ✓
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-success text-xl opacity-50" title="Summary present (no link available)">✓</span>
                          )
                        ) : (
                          <span className="text-error text-xl" title="Summary missing">✗</span>
                        )}
                      </td>
                      <td className="text-center">
                        {bill.votes_present ? (
                          bill.votes_url ? (
                            <a 
                              href={bill.votes_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-success hover:underline hover:text-success-focus text-xl inline-flex items-center gap-0.5 font-bold cursor-pointer transition-all"
                              onClick={(e) => e.stopPropagation()}
                              title="Votes available - Click to view"
                            >
                              ✓
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-success text-xl opacity-50" title="Votes present (no link available)">✓</span>
                          )
                        ) : (
                          <span className="text-error text-xl" title="Votes missing">✗</span>
                        )}
                      </td>
                      <td className="text-center">
                        {bill.reported_out ? (
                          <span className="text-success text-xl" title="Reported out">✓</span>
                        ) : (
                          <span className="text-error text-xl" title="Not reported out">✗</span>
                        )}
                      </td>
                      <td className="text-center">
                        {bill.notice_gap_days !== undefined && bill.notice_gap_days !== null ? (
                          <span 
                            className={`font-medium ${
                              bill.notice_gap_days >= 10 
                                ? 'text-success' 
                                : bill.notice_gap_days >= 0 
                                ? 'text-warning' 
                                : 'text-base-content/70'
                            }`}
                            title={`${bill.notice_gap_days} days notice given`}
                          >
                            {bill.notice_gap_days >= 0 ? bill.notice_gap_days : '—'}
                          </span>
                        ) : (
                          <span className="text-base-content/50" title="Notice gap not available">—</span>
                        )}
                      </td>
                      <td>{bill.hearing_date}</td>
                      <td>{bill.effective_deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                {/* Results Info and Page Size Selector */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-base-content/70">
                    Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalBillsCount)} of {totalBillsCount} bills
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-base-content/70">Show:</span>
                    <select 
                      className="select select-bordered select-sm"
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-base-content/70">per page</span>
                  </div>
                </div>

                {/* Pagination Buttons */}
                {billsTotalPages > 1 && (
                  <div className="join">
                    <button 
                      className="join-item btn btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      «
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, billsTotalPages) }, (_, i) => {
                      let pageNum;
                      if (billsTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= billsTotalPages - 2) {
                        pageNum = billsTotalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`join-item btn btn-sm ${
                            currentPage === pageNum ? 'btn-active' : ''
                          }`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button 
                      className="join-item btn btn-sm"
                      disabled={currentPage === billsTotalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-base-content/50">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg font-medium mb-2">No bills found</p>
                <p>Try adjusting your filters or import some data to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accuracy Notice Banner */}
      <div className="bg-base-200/50 border border-base-300 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-base-content/60 shrink-0 w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div className="text-sm text-base-content/80">
            <span className="font-medium">Notice an error? Accuracy is important!</span> Shoot me an email, or submit a pull request on GitHub.
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-2">
          <a href="/contact" className="btn btn-xs btn-outline">
            Contact
          </a>
          <a 
            href="https://github.com/arbowl/beacon-hill-compliance-tracker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-xs btn-ghost"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>

      {/* Save View Modal */}
      {showSaveModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Save Current View</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Save your current filter configuration to quickly access it later.
            </p>
            
            {/* Current Configuration Summary */}
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2">Current Configuration:</h4>
              <div className="space-y-1 text-sm">
                {filters.committees.length > 0 && (
                  <div>
                    <span className="font-medium">Committees:</span> {filters.committees.length} selected
                  </div>
                )}
                {filters.states.length > 0 && (
                  <div>
                    <span className="font-medium">States:</span> {filters.states.join(', ')}
                  </div>
                )}
                {filters.searchTerm && (
                  <div>
                    <span className="font-medium">Search:</span> "{filters.searchTerm}"
                  </div>
                )}
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <div>
                    <span className="font-medium">Date Range:</span> 
                    {filters.dateRange.start && ` from ${filters.dateRange.start}`}
                    {filters.dateRange.end && ` to ${filters.dateRange.end}`}
                  </div>
                )}
                <div>
                  <span className="font-medium">Results:</span> {billsData?.length || 0} bills
                </div>
              </div>
            </div>

            <div className="py-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">View Name</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered ${viewNameExists ? 'input-error' : ''}`}
                  placeholder="Enter a descriptive name for this view..."
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && viewName.trim() && !viewNameExists) {
                      handleSaveView()
                    }
                  }}
                />
                <label className="label">
                  <span className={`label-text-alt ${viewNameExists ? 'text-error' : ''}`}>
                    {viewNameExists 
                      ? 'A view with this name already exists. Please choose a different name.'
                      : 'Choose a name that helps you remember this configuration'
                    }
                  </span>
                </label>
                
                {/* Show existing view names if any */}
                {savedViews && savedViews.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-base-content/70 mb-1">Existing saved views:</div>
                    <div className="flex flex-wrap gap-1">
                      {savedViews.slice(0, 5).map((view) => (
                        <div key={view.id} className="badge badge-ghost badge-sm">
                          {view.name}
                        </div>
                      ))}
                      {savedViews.length > 5 && (
                        <div className="badge badge-ghost badge-sm">
                          +{savedViews.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-ghost"
                onClick={() => {
                  setShowSaveModal(false)
                  setViewName('')
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveView}
                disabled={!viewName.trim() || viewNameExists}
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {showBillModal && selectedBill && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">Bill Details</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowBillModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Bill ID and Title */}
              <div>
                <div className="text-sm font-medium text-base-content/70 mb-1">Bill ID</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-lg font-bold">{selectedBill.bill_id}</div>
                  {selectedBill.bill_url && (
                    <a 
                      href={selectedBill.bill_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary text-black"
                      title="View bill on Massachusetts Legislature website"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Bill
                    </a>
                  )}
                </div>
                
                {/* Chamber origin info */}
                {selectedBill.bill_id && (
                  <div className="mt-2 bg-info/10 border border-info/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-5 h-5 mt-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div className="text-sm text-base-content/90">
                        {selectedBill.bill_id.startsWith('H') ? (
                          <span><strong>House-originated bill</strong> — Only House members vote to report out.</span>
                        ) : selectedBill.bill_id.startsWith('S') ? (
                          <span><strong>Senate-originated bill</strong> — Only Senate members vote to report out.</span>
                        ) : (
                          <span><strong>Joint bill</strong> — Both chambers participate in the process.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm font-medium text-base-content/70 mb-1">Full Title</div>
                <div className="text-base leading-relaxed">{selectedBill.bill_title}</div>
              </div>
              
              {/* Committee and Chamber */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-base-content/70 mb-1">Committee</div>
                  <div>{selectedBill.committee_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-base-content/70 mb-1">Chamber</div>
                  <div>
                    <span className="badge badge-outline">{selectedBill.chamber}</span>
                  </div>
                </div>
              </div>
              
              {/* Status and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-base-content/70 mb-1">Status</div>
                  <div className={`badge badge-lg whitespace-nowrap px-3 ${getStateBadgeClass(selectedBill)}`}>
                    {getStateLabel(selectedBill)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-base-content/70 mb-1">Hearing Date</div>
                  <div>{selectedBill.hearing_date || 'Not scheduled'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-base-content/70 mb-1">Deadline</div>
                  <div>{selectedBill.effective_deadline || 'TBD'}</div>
                </div>
              </div>
              
              {/* Additional Details */}
              {(selectedBill.reason || selectedBill.summary_present || selectedBill.votes_present) && (
                <div>
                  <div className="text-sm font-medium text-base-content/70 mb-2">Compliance Details</div>
                  <div className="bg-base-200 p-3 rounded-lg">
                    {selectedBill.reason && (
                      <div className="mb-2">
                        <span className="text-sm">{selectedBill.reason}</span>
                      </div>
                    )}
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="font-medium">Summary: </span>
                        {selectedBill.summary_present ? (
                          selectedBill.summary_url ? (
                            <a 
                              href={selectedBill.summary_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-success hover:text-success-focus underline cursor-pointer"
                            >
                              ✓ View Summary
                            </a>
                          ) : (
                            <span className="text-success">✓ Present</span>
                          )
                        ) : (
                          <span className="text-error">✗ Missing</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Votes: </span>
                        {selectedBill.votes_present ? (
                          selectedBill.votes_url ? (
                            <a 
                              href={selectedBill.votes_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-success hover:text-success-focus underline cursor-pointer"
                            >
                              ✓ View Votes
                            </a>
                          ) : (
                            <span className="text-success">✓ Present</span>
                          )
                        ) : (
                          <span className="text-error">✗ Missing</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Reported Out: </span>
                        <span className={selectedBill.reported_out ? 'text-success' : 'text-error'}>
                          {selectedBill.reported_out ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                onClick={() => setShowBillModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
