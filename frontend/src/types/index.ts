// User and Authentication Types
export interface User {
  id: number
  email: string
  role: 'user' | 'privileged' | 'admin'
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// Committee Types
export interface Committee {
  committee_id: string
  name: string
  chamber: 'Joint' | 'House' | 'Senate'
  url: string
  house_room?: string
  house_address?: string
  house_phone?: string
  senate_room?: string
  senate_address?: string
  senate_phone?: string
  house_chair_name?: string
  house_chair_email?: string
  house_vice_chair_name?: string
  house_vice_chair_email?: string
  senate_chair_name?: string
  senate_chair_email?: string
  senate_vice_chair_name?: string
  senate_vice_chair_email?: string
  updated_at: string
}

// Bill Types
export interface Bill {
  id?: number  // Auto-increment ID from database
  bill_id: string
  bill_title: string
  bill_url: string
  committee_id?: string  // Committee ID for filtering
  committee_name?: string  // Joined from committees table
  chamber?: string  // Joined from committees table
  hearing_date?: string
  deadline_60?: string
  effective_deadline?: string
  extension_order_url?: string
  extension_date?: string
  reported_out: boolean
  reported_out_date?: string
  summary_present: boolean
  summary_url?: string
  votes_present: boolean
  votes_url?: string
  state: 'compliant' | 'Compliant' | 'non-compliant' | 'unknown' | 'provisional' | 'monitoring'
  reason: string
  notice_status?: string
  notice_gap_days?: number
  announcement_date?: string
  scheduled_hearing_date?: string
  generated_at?: string  // Timestamp from database
}

// Statistics Types
export interface GlobalStats {
  total_committees: number
  total_bills: number
  compliant_bills: number
  provisional_bills?: number  // Optional: Calculated from bills with provisional status
  incomplete_bills: number  // Deprecated: Always 0, merged into non_compliant_bills
  non_compliant_bills: number
  unknown_bills: number
  overall_compliance_rate: number
  total_reported_out: number
  total_with_summaries: number
  total_with_votes: number
  latest_report_date: string
}

export interface CommitteeStats {
  committee_id: string
  committee_name: string
  chamber: string
  total_bills: number
  compliant_count: number
  provisional_count?: number  // Optional: Calculated from bills with provisional status
  incomplete_count: number  // Deprecated: Always 0, merged into non_compliant_count
  non_compliant_count: number
  unknown_count: number
  reported_out_count: number
  summary_present_count: number
  votes_present_count: number
  compliance_rate: number
  last_report_generated: string
}

// Saved Views Types
export interface SavedView {
  id: number
  name: string
  payload_json: string
  created_at: string
  updated_at: string
}

export interface SavedViewPayload {
  filters: {
    committees?: string[]
    chambers?: string[]
    states?: string[]
    dateRange?: {
      start: string
      end: string
    }
    searchTerm?: string
  }
  visualization: {
    type: 'table' | 'bar' | 'line' | 'pie' | 'scatter'
    groupBy?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  columns?: string[]
}

// Signing Keys Types
export interface SigningKey {
  id: number
  key_id: string
  created_at: string
  revoked_at?: string
  is_revoked: boolean
  secret?: string // Only included when first generated
  user_email?: string // Only in admin views
  user_role?: string // Only in admin views
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page?: number
  total_pages?: number
}

// Compliance Scan Metadata Types (for new API format)
export interface DiffReport {
  time_interval: string
  previous_date: string
  current_date: string
  compliance_delta: number
  new_bills_count: number
  new_bills: string[]
  bills_with_new_hearings: string[]
  bills_reported_out: string[]
  bills_with_new_summaries: string[]
  bills_with_new_votes: string[]
  analysis?: string | null  // Analysis is now part of the diff report (only for daily)
}

export interface TopMover {
  committee_id: string
  committee_name: string
  compliance_delta: number
}

export interface DiffReports {
  daily?: DiffReport | null
  weekly?: DiffReport | null
  monthly?: DiffReport | null
}

export interface ComplianceReportResponse {
  bills: Bill[]
  diff_report?: DiffReport | null  // Legacy support
  diff_reports?: DiffReports | null  // New structure
  analysis?: string | null  // Legacy support (top-level analysis)
}

export type IntervalType = 'daily' | 'weekly' | 'monthly' | 'custom'

// Re-export as a const for better compatibility
export const IntervalTypeValues = ['daily', 'weekly', 'monthly', 'custom'] as const

// Filter and Search Types
export interface DashboardFilters {
  committees: string[]
  chambers: string[]
  states: string[]
  dateRange: {
    start: string | null
    end: string | null
  }
  searchTerm: string
}

export interface ExportOptions {
  format: 'csv' | 'json'
  filters: DashboardFilters
  columns: string[]
}

// Chart Data Types for Plotly
export interface ChartData {
  x: (string | number)[]
  y: (string | number)[]
  type: 'bar' | 'scatter' | 'pie' | 'line'
  name?: string
  marker?: {
    color?: string | string[]
  }
  labels?: string[]
  values?: number[]
}

export interface PlotlyConfig {
  data: ChartData[]
  layout: {
    title?: string
    xaxis?: {
      title?: string
    }
    yaxis?: {
      title?: string
    }
    showlegend?: boolean
    margin?: {
      l?: number
      r?: number
      t?: number
      b?: number
    }
  }
  config?: {
    displayModeBar?: boolean
    responsive?: boolean
  }
}

// Error Types
export interface ApiError {
  message: string
  status?: number
  details?: any
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
}

export interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

// Dashboard State Types
export interface DashboardState {
  filters: DashboardFilters
  visualization: {
    type: 'table' | 'bar' | 'line' | 'pie' | 'scatter'
    groupBy: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  selectedColumns: string[]
  isLoading: boolean
  error: string | null
}
