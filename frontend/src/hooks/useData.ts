import { useState, useEffect } from 'react'
import { apiService, viewsService } from '../services/api'
import { 
  Committee, 
  Bill, 
  GlobalStats, 
  DashboardFilters,
  SavedView,
  DiffReport
} from '../types'

// Custom hook for fetching committees
export const useCommittees = () => {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getCommittees()
        setCommittees(Array.isArray(response.data) ? response.data : [])
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch committees')
      } finally {
        setLoading(false)
      }
    }

    fetchCommittees()
  }, [])

  return { committees, loading, error }
}

// Custom hook for fetching bills with filters
export const useBills = (filters?: DashboardFilters) => {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Convert filters to API parameters
        const params: any = {}
        if (filters) {
          if (filters.committees.length > 0) {
            params.committees = filters.committees.join(',')
          }
          if (filters.chambers.length > 0) {
            params.chambers = filters.chambers.join(',')
          }
          if (filters.states.length > 0) {
            params.states = filters.states.join(',')
          }
          if (filters.dateRange.start) {
            params.start_date = filters.dateRange.start
          }
          if (filters.dateRange.end) {
            params.end_date = filters.dateRange.end
          }
          if (filters.searchTerm) {
            params.search = filters.searchTerm
          }
        }

        const response = await apiService.getBills(params)
        const billsData = response.data.bills || response.data || []
        setBills(Array.isArray(billsData) ? billsData : [])
        setTotalCount(response.data.count || billsData.length || 0)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch bills')
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [filters])

  const refetch = () => {
    const fetchBills = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params: any = {}
        if (filters) {
          if (filters.committees.length > 0) {
            params.committees = filters.committees.join(',')
          }
          if (filters.chambers.length > 0) {
            params.chambers = filters.chambers.join(',')
          }
          if (filters.states.length > 0) {
            params.states = filters.states.join(',')
          }
          if (filters.dateRange.start) {
            params.start_date = filters.dateRange.start
          }
          if (filters.dateRange.end) {
            params.end_date = filters.dateRange.end
          }
          if (filters.searchTerm) {
            params.search = filters.searchTerm
          }
        }

        const response = await apiService.getBills(params)
        const billsData = response.data.bills || response.data || []
        setBills(Array.isArray(billsData) ? billsData : [])
        setTotalCount(response.data.count || billsData.length || 0)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch bills')
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }

  return { bills, loading, error, totalCount, refetch }
}

// Custom hook for fetching global statistics
export const useGlobalStats = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getStats()
        setStats(response.data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { data: stats, loading, error, refetch: () => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getStats()
        setStats(response.data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch statistics')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  } }
}

// Custom hook for fetching committee-specific compliance data
export const useCommitteeCompliance = (committeeId?: string) => {
  const [complianceData, setComplianceData] = useState<Bill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!committeeId) {
      setComplianceData([])
      return
    }

    const fetchCompliance = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getCommitteeCompliance(committeeId)
        // Handle both old format (array) and new format (object with bills array)
        const complianceDataArray = response.data.bills || response.data || []
        setComplianceData(Array.isArray(complianceDataArray) ? complianceDataArray : [])
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch compliance data')
      } finally {
        setLoading(false)
      }
    }

    fetchCompliance()
  }, [committeeId])

  return { complianceData, loading, error }
}

// Custom hook for fetching compliance data with filters
export const useComplianceData = (filters?: DashboardFilters) => {
  const [complianceData, setComplianceData] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params: any = {}
        if (filters) {
          if (filters.committees.length > 0) {
            params.committees = filters.committees.join(',')
          }
          if (filters.chambers.length > 0) {
            params.chambers = filters.chambers.join(',')
          }
          if (filters.states.length > 0) {
            params.states = filters.states.join(',')
          }
          if (filters.dateRange.start) {
            params.start_date = filters.dateRange.start
          }
          if (filters.dateRange.end) {
            params.end_date = filters.dateRange.end
          }
          if (filters.searchTerm) {
            params.search = filters.searchTerm
          }
        }

        const response = await apiService.getComplianceData(params)
        // Handle both old format (array) and new format (object with bills array)
        const complianceDataArray = response.data.bills || response.data || []
        setComplianceData(Array.isArray(complianceDataArray) ? complianceDataArray : [])
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch compliance data')
      } finally {
        setLoading(false)
      }
    }

    fetchCompliance()
  }, [filters])

  return { complianceData, loading, error }
}

// Generic hook for API calls with manual trigger
export const useApiCall = <T,>(apiCall: () => Promise<any>) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall()
      setData(response.data)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return { data, loading, error, execute, reset }
}

// Hook for debounced values (useful for search)
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook for local storage state
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  return [storedValue, setValue] as const
}

export const useCommitteeStats = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCommitteeStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getCommitteeStats()
        setData(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch committee statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchCommitteeStats()
  }, [])

  return { data, loading, error }
}

// Custom hook for managing saved views
export const useSavedViews = () => {
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSavedViews = async () => {
    // Check if user is authenticated by looking for token
    const token = localStorage.getItem('token')
    if (!token) {
      setSavedViews([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await viewsService.getSavedViews()
      console.log('API response for saved views:', response)
      
      // Handle the correct response structure from backend
      // Backend returns: { views: [...], count: N }
      const viewsData = response.data?.views || response.data || []
      setSavedViews(Array.isArray(viewsData) ? viewsData : [])
    } catch (err) {
      console.error('Error fetching saved views:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch saved views')
      setSavedViews([])
    } finally {
      setLoading(false)
    }
  }

  const createSavedView = async (name: string, payload: any) => {
    try {
      setError(null)
      console.log('createSavedView called with:', { name, payload })
      
      const response = await viewsService.createSavedView(name, payload)
      console.log('createSavedView API response:', response)
      
      await fetchSavedViews() // Refresh the list
      
      // Backend returns: { message: "...", view: {...} }
      return response.data
    } catch (err) {
      console.error('createSavedView error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create saved view'
      setError(errorMessage)
      throw err
    }
  }

  const updateSavedView = async (id: number, data: any) => {
    try {
      setError(null)
      const response = await viewsService.updateSavedView(id, data)
      await fetchSavedViews() // Refresh the list
      
      // Backend returns: { message: "...", view: {...} }
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update saved view')
      throw err
    }
  }

  const deleteSavedView = async (id: number) => {
    try {
      setError(null)
      await viewsService.deleteSavedView(id)
      await fetchSavedViews() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete saved view')
      throw err
    }
  }

  const duplicateSavedView = async (id: number, name: string) => {
    try {
      setError(null)
      const response = await viewsService.duplicateSavedView(id, name)
      await fetchSavedViews() // Refresh the list
      
      // Backend returns: { message: "...", view: {...} }
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate saved view')
      throw err
    }
  }

  const getSavedView = async (id: number) => {
    try {
      setError(null)
      const response = await viewsService.getSavedView(id)
      
      // Backend returns: { view: {...} }
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get saved view')
      throw err
    }
  }

  useEffect(() => {
    fetchSavedViews()
  }, [])

  return {
    savedViews,
    loading,
    error,
    fetchSavedViews,
    createSavedView,
    updateSavedView,
    deleteSavedView,
    duplicateSavedView,
    getSavedView
  }
}

// Custom hook for fetching detailed committee information
export const useCommitteeDetails = (committeeId: string | null) => {
  const [committee, setCommittee] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!committeeId) {
      setCommittee(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchCommitteeDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getCommittee(committeeId)
        setCommittee(response.data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch committee details')
      } finally {
        setLoading(false)
      }
    }

    fetchCommitteeDetails()
  }, [committeeId])

  return { committee, loading, error }
}

// Custom hook for fetching committee scan metadata (diff_report and analysis)
export const useCommitteeMetadata = (committeeId: string | null) => {
  const [metadata, setMetadata] = useState<{ diff_report: DiffReport | null; analysis: string | null; scan_date: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!committeeId) {
      setMetadata(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getCommitteeMetadata(committeeId)
        console.log('Committee metadata response:', response.data)
        setMetadata(response.data)
      } catch (err: any) {
        console.error('Error fetching committee metadata:', err)
        setError(err.response?.data?.error || 'Failed to fetch committee metadata')
        setMetadata(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [committeeId])

  return { metadata, loading, error }
}

// Hook for fetching global aggregated metadata (all committees)
export const useGlobalMetadata = () => {
  const [metadata, setMetadata] = useState<{ diff_report: DiffReport | null; analysis: string | null; scan_date: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getGlobalMetadata()
        console.log('Global metadata response:', response.data)
        setMetadata(response.data)
      } catch (err: any) {
        console.error('Error fetching global metadata:', err)
        setError(err.response?.data?.error || 'Failed to fetch global metadata')
        setMetadata(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [])

  return { metadata, loading, error }
}
