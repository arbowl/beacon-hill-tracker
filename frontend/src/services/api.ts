import axios from 'axios'

// Determine API base URL based on environment
const getApiBaseURL = () => {
  // In production, call backend directly
  if (import.meta.env.PROD) {
    return 'https://beacon-hill-tracker.onrender.com/api'
  }
  // In development, use Vite proxy
  return '/api'
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const apiService = {
  // Statistics
  getStats: () => api.get('/stats'),
  
  // Committees
  getCommittees: () => api.get('/committees'),
  getCommittee: (id: string) => api.get(`/committees/${id}`),
  getCommitteeStats: () => api.get('/committees/stats'),
  
  // Bills
  getBills: (params?: any) => api.get('/bills', { params }),
  getBill: (id: string) => api.get(`/bills/${id}`),
  
  // Compliance data
  getComplianceData: (params?: any) => api.get('/compliance', { params }),
  getCommitteeCompliance: (committeeId: string) => api.get(`/compliance/${committeeId}`),
  
  // Export
  exportData: (params?: any) => api.get('/export', { params, responseType: 'blob' }),
}

// Auth API endpoints
const authApi = axios.create({
  baseURL: import.meta.env.PROD 
    ? 'https://beacon-hill-tracker.onrender.com/api/auth'
    : '/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to auth requests
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const authService = {
  register: (email: string, password: string) => 
    authApi.post('/register', { email, password }),
  
  login: (email: string, password: string) => 
    authApi.post('/login', { email, password }),
  
  getCurrentUser: () => authApi.get('/me'),
  
  updateUserRole: (userId: number, role: string) => 
    authApi.patch('/role', { user_id: userId, role }),
  
  getUsers: () => authApi.get('/users'),
  
  forgotPassword: (email: string) =>
    authApi.post('/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    authApi.post('/reset-password', { token, password }),
}

// Views API endpoints
const viewsApi = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://beacon-hill-tracker.onrender.com/api/views'
    : '/api/views',
  headers: {
    'Content-Type': 'application/json',
  },
})

viewsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const viewsService = {
  getSavedViews: () => viewsApi.get(''),
  getSavedView: (id: number) => viewsApi.get(`/${id}`),
  createSavedView: (name: string, payload: any) => 
    viewsApi.post('', { name, payload }),
  updateSavedView: (id: number, data: any) => 
    viewsApi.put(`/${id}`, data),
  deleteSavedView: (id: number) => viewsApi.delete(`/${id}`),
  duplicateSavedView: (id: number, name: string) => 
    viewsApi.post(`/duplicate/${id}`, { name }),
  searchSavedViews: (query: string) => 
    viewsApi.get('/search', { params: { q: query } }),
}

// Keys API endpoints
const keysApi = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://beacon-hill-tracker.onrender.com/api/keys'
    : '/api/keys',
  headers: {
    'Content-Type': 'application/json',
  },
})

keysApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const keysService = {
  generateKey: (description?: string) => 
    keysApi.post('', { description }),
  getKeys: (includeRevoked?: boolean) => 
    keysApi.get('', { params: { include_revoked: includeRevoked } }),
  getKey: (id: number) => keysApi.get(`/${id}`),
  revokeKey: (id: number) => keysApi.patch(`/${id}/revoke`, {}),
  verifyKey: (keyId: string, secret: string) => 
    keysApi.post('/verify', { key_id: keyId, secret }),
  // Admin endpoints
  adminGetAllKeys: (includeRevoked?: boolean, userId?: number) => 
    keysApi.get('/admin/all', { params: { include_revoked: includeRevoked, user_id: userId } }),
  adminRevokeKey: (id: number) => keysApi.patch(`/admin/revoke/${id}`),
}

// Convenience exports for password reset
export const forgotPassword = (email: string) => 
  authService.forgotPassword(email).then(res => res.data)

export const resetPassword = (token: string, password: string) => 
  authService.resetPassword(token, password).then(res => res.data)

// Contact form API
const contactApi = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://beacon-hill-tracker.onrender.com/api/contact'
    : '/api/contact',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const contactService = {
  sendMessage: (name: string, email: string, subject: string, message: string) =>
    contactApi.post('/send', { name, email, subject, message }),
}

// Convenience export for contact form
export const sendContactMessage = (
  name: string,
  email: string,
  subject: string,
  message: string
) => contactService.sendMessage(name, email, subject, message).then(res => res.data)

// Changelog API endpoints
const changelogApi = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://beacon-hill-tracker.onrender.com/api/changelog'
    : '/api/changelog',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ChangelogEntry {
  version: string
  date: string
  user_agent?: string
  received_at?: string
  changes: {
    [category: string]: string[]
  }
}

export const changelogService = {
  getChangelog: (limit?: number) =>
    changelogApi.get('', { params: { limit } }),
  
  getChangelogVersion: (version: string) =>
    changelogApi.get('', { params: { version } }),
}

// Convenience exports
export const getChangelog = (limit?: number) =>
  changelogService.getChangelog(limit).then(res => res.data)

export const getChangelogVersion = (version: string) =>
  changelogService.getChangelogVersion(version).then(res => res.data)

export default api
