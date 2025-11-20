import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authService, keysService } from '../services/api'
import { formatDateOnly } from '../utils/dateFormat'

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
  user_id?: number
  created_at: string
  is_revoked: boolean
  revoked_at?: string | null
}

const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [signingKeys, setSigningKeys] = useState<SigningKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Edit role modal state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<'user' | 'privileged' | 'admin'>('user')
  const [updating, setUpdating] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch users
      const usersResponse = await authService.getUsers()
      setUsers(usersResponse.data.users)

      // Fetch all signing keys (including revoked)
      const keysResponse = await keysService.adminGetAllKeys(true)
      setSigningKeys(keysResponse.data.keys)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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

  // Use the shared date formatting utility to avoid timezone issues
  const formatDate = (dateString: string) => {
    return formatDateOnly(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleEditRole = (user: User) => {
    setEditingUser(user)
    setNewRole(user.role)
    setSuccess('')
    setError('')
  }

  const handleUpdateRole = async () => {
    if (!editingUser) return
    
    setUpdating(true)
    setError('')
    setSuccess('')
    
    try {
      await authService.updateUserRole(editingUser.id, newRole)
      setSuccess(`Role updated successfully for ${editingUser.email}`)
      setEditingUser(null)
      // Reload data to reflect changes
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update role')
    } finally {
      setUpdating(false)
    }
  }

  const handleRevokeKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) {
      return
    }

    setError('')
    setSuccess('')
    
    try {
      await keysService.adminRevokeKey(keyId)
      setSuccess('Key revoked successfully')
      // Reload data to reflect changes
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke key')
    }
  }

  const handleRefresh = () => {
    setSuccess('')
    setError('')
    loadData()
  }

  // Get user email for a signing key
  const getUserEmail = (userId?: number) => {
    if (!userId) return 'Unknown'
    const user = users.find(u => u.id === userId)
    return user?.email || 'Unknown'
  }

  if (currentUser?.role !== 'admin') {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-base-content/70">
            Manage users, roles, and system settings.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Loading...
            </>
          ) : (
            <>
              🔄 Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

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
                        <button
                          onClick={() => handleEditRole(user)}
                          className="btn btn-ghost btn-xs"
                          disabled={user.id === currentUser?.id}
                        >
                          Edit Role
                        </button>
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
                      <td>{getUserEmail(key.user_id)}</td>
                      <td>{getStatusBadge(false, key.is_revoked)}</td>
                      <td>{formatDate(key.created_at)}</td>
                      <td>
                        {!key.is_revoked && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="btn btn-error btn-xs"
                          >
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

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Edit Role for {editingUser.email}
            </h3>
            
            <div className="form-control w-full mb-6">
              <label className="label">
                <span className="label-text">Select Role</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'user' | 'privileged' | 'admin')}
                disabled={updating}
              >
                <option value="user">User</option>
                <option value="privileged">Privileged</option>
                <option value="admin">Admin</option>
              </select>
              <label className="label">
                <span className="label-text-alt">
                  {newRole === 'user' && 'Basic access to dashboard and saved views'}
                  {newRole === 'privileged' && 'Can generate and manage signing keys'}
                  {newRole === 'admin' && 'Full system access and user management'}
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setEditingUser(null)}
                className="btn btn-ghost"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="btn btn-primary"
                disabled={updating || newRole === editingUser.role}
              >
                {updating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !updating && setEditingUser(null)} />
        </div>
      )}
    </div>
  )
}

export default AdminPage
