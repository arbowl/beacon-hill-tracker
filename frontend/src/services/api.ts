import axios from 'axios'

// Get API base URL from environment
const getApiBaseUrl = () => {
  // In production, use VITE_API_URL env var
  // In development, use relative path (Vite proxy handles it)
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  console.log('🔗 API Base URL:', apiUrl)
  return apiUrl
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
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
  baseURL: '/api/auth',
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
}

// Views API endpoints
const viewsApi = axios.create({
  baseURL: '/api/views',
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
  baseURL: '/api/keys',
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

export default api
