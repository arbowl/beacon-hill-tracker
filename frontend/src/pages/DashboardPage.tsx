import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGlobalStats, useCommittees, useBills, useCommitteeStats, useSavedViews, useCommitteeDetails } from '../hooks/useData'
import { useAuth } from '../contexts/AuthContext'
import { DashboardFilters, Bill } from '../types'
import { analyzeReasons, getTopViolationsForCommittee } from '../utils/reasonParser'
import { ComplianceOverviewChart, CommitteeComparisonChart, ViolationAnalysisChart } from '../components/charts'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
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

  // Load filters from URL parameters (for saved views)
  useEffect(() => {
    const committees = searchParams.get('committees')?.split(',').filter(Boolean) || []
    const chambers = searchParams.get('chambers')?.split(',').filter(Boolean) || []
    const states = searchParams.get('states')?.split(',').filter(Boolean) || []
    const searchTerm = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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
  }, [searchParams])

  const [viewName, setViewName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [showBillModal, setShowBillModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  
  // Check if view name already exists
  const viewNameExists = savedViews && Array.isArray(savedViews) 
    ? savedViews.some(view => view.name.toLowerCase() === viewName.trim().toLowerCase())
    : false

  // Committee chart view mode state
  const [committeeViewMode, setCommitteeViewMode] = useState<'top_performers' | 'all_committees'>('top_performers')
  const [committeeLimit, setCommitteeLimit] = useState(15)

  // Fetch bills with current filters
  const { bills: billsData, loading: billsLoading, error: billsError } = useBills(filters)

  // Fetch committee details when a single committee is selected
  const selectedCommitteeId = filters.committees.length === 1 ? filters.committees[0] : null
  const { committee: selectedCommitteeDetails } = useCommitteeDetails(selectedCommitteeId)

  // Calculate contextual stats based on current filters
  const contextualStats = useMemo(() => {
    if (!billsData || billsLoading) return null

    // If no committees selected, show global stats
    if (!filters.committees || filters.committees.length === 0) {
      return stats ? {
        title: 'Global Overview',
        total_committees: stats.total_committees,
        total_bills: stats.total_bills,
        compliant_bills: stats.compliant_bills,
        incomplete_bills: stats.incomplete_bills,
        non_compliant_bills: stats.non_compliant_bills,
        unknown_bills: stats.unknown_bills,
        overall_compliance_rate: stats.overall_compliance_rate
      } : null
    }

    // Calculate stats for filtered data
    const compliant = billsData.filter(bill => bill.state?.toLowerCase() === 'compliant').length
    const incomplete = billsData.filter(bill => bill.state?.toLowerCase() === 'incomplete').length
    const nonCompliant = billsData.filter(bill => bill.state?.toLowerCase() === 'non-compliant').length
    const unknown = billsData.filter(bill => bill.state?.toLowerCase() === 'unknown').length
    const total = billsData.length
    const totalExcludingUnknown = total - unknown
    const complianceRate = totalExcludingUnknown > 0 ? Math.round((compliant / totalExcludingUnknown) * 100) : 0

    // Get selected committee names for title
    const selectedCommittees = committees?.filter(c => filters.committees.includes(c.committee_id))
    const committeeNames = selectedCommittees?.map(c => c.name) || []
    const title = committeeNames.length === 1 
      ? `${committeeNames[0]}`
      : `${filters.committees.length} Selected Committees`

    return {
      title,
      total_committees: filters.committees.length,
      total_bills: total,
      compliant_bills: compliant,
      incomplete_bills: incomplete,
      non_compliant_bills: nonCompliant,
      unknown_bills: unknown,
      overall_compliance_rate: complianceRate
    }
  }, [billsData, billsLoading, filters.committees, stats, committees])

  // Pagination calculations
  const totalBills = billsData?.length || 0
  const totalPages = Math.ceil(totalBills / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedBills = billsData?.slice(startIndex, endIndex) || []

  // Calculate contextual violation analysis
  const violationAnalysis = useMemo(() => {
    if (!billsData || billsData.length === 0) return []
    
    if (filters.committees.length === 0) {
      // Global analysis
      return analyzeReasons(billsData)
    } else if (filters.committees.length === 1) {
      // Single committee analysis
      return getTopViolationsForCommittee(billsData, filters.committees[0], 10)
    } else {
      // Multiple committees - analyze filtered data
      const filteredBills = billsData.filter(bill => 
        bill.committee_id && filters.committees.includes(bill.committee_id)
      )
      return analyzeReasons(filteredBills)
    }
  }, [billsData, filters.committees])

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
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
        'State', 
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

  if (statsLoading || committeesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

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
            Contact Us
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

      {/* Filters Section */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Search Bills</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Search by bill ID or title..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  searchTerm: e.target.value
                }))}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Compliance State</span>
              </label>
              <select 
                className="select select-bordered"
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
                <option value="incomplete">Incomplete</option>
                <option value="non-compliant">Non-Compliant</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Committee</span>
              </label>
              <select 
                className="select select-bordered"
                value={filters.committees.length > 0 ? filters.committees[0] : ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFilters(prev => ({
                    ...prev,
                    committees: value ? [value] : []
                  }))
                }}
              >
                <option value="">All Committees</option>
                {committees?.map(committee => (
                  <option key={committee.committee_id} value={committee.committee_id}>
                    {committee.name}
                  </option>
                ))}
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
              <div className="stat-value text-warning">{contextualStats.overall_compliance_rate}%</div>
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

      {/* Committee Contact Details - Show when single committee is selected */}
      {selectedCommitteeId && selectedCommitteeDetails && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Committee Contact Information
              </h2>
              <div className="badge badge-primary">{selectedCommitteeDetails.chamber}</div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Committee Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">{selectedCommitteeDetails.name}</h3>
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
      )}

         {/* Data Visualizations */}
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
           {/* Compliance Overview Chart */}
           <div className="card bg-base-100 shadow-md">
             <div className="card-body">
               <h2 className="card-title">
                 {contextualStats?.title === 'Global Overview' 
                   ? 'Compliance Overview' 
                   : `Compliance Overview - ${contextualStats?.title || 'Loading...'}`}
               </h2>
               <ComplianceOverviewChart 
                 data={{
                   compliant_bills: contextualStats?.compliant_bills || 0,
                   incomplete_bills: contextualStats?.incomplete_bills || 0,
                   non_compliant_bills: contextualStats?.non_compliant_bills || 0,
                   unknown_bills: contextualStats?.unknown_bills || 0
                 }}
                 loading={statsLoading || billsLoading}
               />
             </div>
           </div>

           {/* Committee Comparison Chart */}
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
                     <option value="top_performers">Top Performers</option>
                     <option value="all_committees">All Committees</option>
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
                 key={`committee-chart-${committeeViewMode}-${committeeLimit}`}
                 data={committeeStats?.map(committee => ({
                   committee_id: committee.committee_id,
                   name: committee.committee_name,
                   compliance_rate: committee.compliance_rate || 0,
                   total_bills: committee.total_bills || 0,
                   compliant_count: committee.compliant_count || 0,
                   incomplete_count: committee.incomplete_count || 0,
                   non_compliant_count: committee.non_compliant_count || 0
                 })) || []}
                 loading={committeeStatsLoading}
                 chartType="horizontal_bar"
                 viewMode={committeeViewMode}
                 limit={committeeLimit}
               />
             </div>
           </div>

           {/* Violation Analysis Chart */}
           <div className="card bg-base-100 shadow-md xl:col-span-1 lg:col-span-2">
             <div className="card-body">
               <h2 className="card-title">
                 {filters.committees.length === 0 
                   ? 'Top Non-Compliance Issues' 
                   : filters.committees.length === 1
                   ? `Non-Compliance Issues - ${committees?.find(c => c.committee_id === filters.committees[0])?.name || 'Selected Committee'}`
                   : `Non-Compliance Issues - ${filters.committees.length} Selected Committees`}
               </h2>
               <ViolationAnalysisChart 
                 data={violationAnalysis}
                 loading={billsLoading}
                 chartType="horizontal_bar"
                 showDetails={false}
               />
             </div>
           </div>
         </div>

         {/* Results Summary */}
      {billsData && (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Showing {billsData.length} bills matching your filters</span>
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
                    <th className="w-24">Bill ID</th>
                    <th className="w-80">Title</th>
                    <th className="w-48">Committee</th>
                    <th className="w-24">Status</th>
                    <th className="w-28">Hearing Date</th>
                    <th className="w-28">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBills.map((bill: Bill) => (
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
                        <div className={`badge ${
                          bill.state?.toLowerCase() === 'compliant' ? 'badge-success' :
                          bill.state?.toLowerCase() === 'incomplete' ? 'badge-warning' :
                          bill.state?.toLowerCase() === 'non-compliant' ? 'badge-error' :
                          'badge-ghost'
                        }`}>
                          {bill.state?.toLowerCase() === 'compliant' ? 'Compliant' :
                           bill.state?.toLowerCase() === 'incomplete' ? 'Incomplete' :
                           bill.state?.toLowerCase() === 'non-compliant' ? 'Non-Compliant' :
                           bill.state?.toLowerCase() === 'unknown' ? 'Monitoring' :
                           bill.state || 'Monitoring'}
                        </div>
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
                    Showing {startIndex + 1}-{Math.min(endIndex, totalBills)} of {totalBills} bills
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
                {totalPages > 1 && (
                  <div className="join">
                    <button 
                      className="join-item btn btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      «
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
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
                      disabled={currentPage === totalPages}
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
                  <div className={`badge ${
                    selectedBill.state?.toLowerCase() === 'compliant' ? 'badge-success' :
                    selectedBill.state?.toLowerCase() === 'incomplete' ? 'badge-warning' :
                    selectedBill.state?.toLowerCase() === 'non-compliant' ? 'badge-error' :
                    'badge-ghost'
                  }`}>
                    {selectedBill.state?.toLowerCase() === 'compliant' ? 'Compliant' :
                     selectedBill.state?.toLowerCase() === 'incomplete' ? 'Incomplete' :
                     selectedBill.state?.toLowerCase() === 'non-compliant' ? 'Non-Compliant' :
                     selectedBill.state?.toLowerCase() === 'unknown' ? 'Monitoring' :
                     selectedBill.state || 'Monitoring'}
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
