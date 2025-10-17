import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface User {
  id: number
  email: string
  role: 'user' | 'privileged' | 'admin'
  is_active: boolean
  created_at: string
}

interface SigningKey {
  id: number
  key_id: string
  user_id: number
  created_at: string
  is_revoked: boolean
  user_email?: string
}

const AdminPage: React.FC = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [signingKeys, setSigningKeys] = useState<SigningKey[]>([])
  const [loading, setLoading] = useState(true)

  // Placeholder data for demonstration
  useEffect(() => {
    // In a real implementation, these would be API calls
    setTimeout(() => {
      setUsers([
        {
          id: 1,
          email: 'admin@example.com',
          role: 'admin',
          is_active: true,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          email: 'user@example.com',
          role: 'user',
          is_active: true,
          created_at: '2024-01-16T14:20:00Z'
        },
        {
          id: 3,
          email: 'privileged@example.com',
          role: 'privileged',
          is_active: true,
          created_at: '2024-01-17T09:15:00Z'
        }
      ])

      setSigningKeys([
        {
          id: 1,
          key_id: 'bhct_89tqtkhxtxw1ha7hdti0p5dc',
          user_id: 3,
          created_at: '2024-01-20T11:45:00Z',
          is_revoked: false,
          user_email: 'privileged@example.com'
        },
        {
          id: 2,
          key_id: 'bhct_x4k9m2n7b8v1c3d5f6g8h9j0',
          user_id: 1,
          created_at: '2024-01-18T16:30:00Z',
          is_revoked: true,
          user_email: 'admin@example.com'
        }
      ])

      setLoading(false)
    }, 1000)
  }, [])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'badge-error'
      case 'privileged': return 'badge-warning'
      case 'user': return 'badge-info'
      default: return 'badge-ghost'
    }
  }

  const getStatusBadge = (isActive: boolean, isRevoked?: boolean) => {
    if (isRevoked !== undefined) {
      return isRevoked ? 
        <span className="badge badge-error badge-sm">Revoked</span> :
        <span className="badge badge-success badge-sm">Active</span>
    }
    return isActive ? 
      <span className="badge badge-success badge-sm">Active</span> :
      <span className="badge badge-error badge-sm">Inactive</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-4">Access Denied</h1>
          <p className="text-base-content/70">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-base-content/70">
          Manage users, roles, and system settings.
        </p>
      </div>

      {/* User Management */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">User Management</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{getStatusBadge(user.is_active)}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                            ⋯
                          </div>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li><a>Edit Role</a></li>
                            <li><a>Toggle Status</a></li>
                            <li><a className="text-error">Delete User</a></li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Signing Keys Audit */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">Signing Keys Audit</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Key ID</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signingKeys.map((key) => (
                    <tr key={key.id}>
                      <td>
                        <code className="text-xs bg-base-200 px-2 py-1 rounded">
                          {key.key_id}
                        </code>
                      </td>
                      <td>{key.user_email}</td>
                      <td>{getStatusBadge(false, key.is_revoked)}</td>
                      <td>{formatDate(key.created_at)}</td>
                      <td>
                        {!key.is_revoked && (
                          <button className="btn btn-error btn-xs">
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat bg-base-100 shadow-md rounded-lg">
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-primary">{users.length}</div>
          <div className="stat-desc">Registered accounts</div>
        </div>
        
        <div className="stat bg-base-100 shadow-md rounded-lg">
          <div className="stat-title">Active Keys</div>
          <div className="stat-value text-success">
            {signingKeys.filter(k => !k.is_revoked).length}
          </div>
          <div className="stat-desc">Valid signing keys</div>
        </div>
        
        <div className="stat bg-base-100 shadow-md rounded-lg">
          <div className="stat-title">Admin Users</div>
          <div className="stat-value text-warning">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="stat-desc">System administrators</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title">Quick Actions</h3>
          <div className="flex flex-wrap gap-4 mt-4">
            <button className="btn btn-primary">
              📧 Send System Email
            </button>
            <button className="btn btn-secondary">
              📊 Generate Report
            </button>
            <button className="btn btn-accent">
              🔄 Refresh Data
            </button>
            <button className="btn btn-warning">
              ⚙️ System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
