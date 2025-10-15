import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthResponse } from '../types'
import { authService } from '../services/api'
import { jwtDecode } from 'jwt-decode'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token)
      return decoded.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser && !isTokenExpired(token)) {
          // Token exists and is valid, verify with server
          try {
            const response = await authService.getCurrentUser()
            setUser(response.data.user)
          } catch (error) {
            // Token invalid, clear storage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
          }
        } else {
          // No valid token, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)
      const response = await authService.login(email, password)
      const { access_token, user: userData } = response.data

      // Store token and user data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)
      await authService.register(email, password)
      // Registration successful, but user needs to verify email
      // Don't set user state yet
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = (): void => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getCurrentUser()
      setUser(response.data.user)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    } catch (error) {
      // If refresh fails, logout
      logout()
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
