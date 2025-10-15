import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'privileged' | 'admin'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user' 
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!requiredRole) return true
    
    const roleHierarchy = {
      user: 0,
      privileged: 1,
      admin: 2
    }
    
    const userLevel = roleHierarchy[user.role] ?? -1
    const requiredLevel = roleHierarchy[requiredRole] ?? 999
    
    return userLevel >= requiredLevel
  }

  // Redirect to home if user doesn't have required role
  if (!hasRequiredRole()) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
