import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSavedViews } from '../hooks/useData'
import { useAuth } from '../contexts/AuthContext'
import { SavedView } from '../types'

const ViewsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    savedViews,
    loading,
    error,
    deleteSavedView,
    duplicateSavedView,
    updateSavedView
  } = useSavedViews()

  const [selectedView, setSelectedView] = useState<SavedView | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [duplicateName, setDuplicateName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter saved views based on search term
  const filteredViews = Array.isArray(savedViews) 
    ? savedViews.filter(view => view.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  const handleLoadView = (view: SavedView) => {
    // Navigate to dashboard with view parameters
    const payload = JSON.parse(view.payload_json)
    const queryParams = new URLSearchParams()
    
    // Add filters to query params
    if (payload.filters) {
      if (payload.filters.committees?.length) {
        queryParams.set('committees', payload.filters.committees.join(','))
      }
      if (payload.filters.chambers?.length) {
        queryParams.set('chambers', payload.filters.chambers.join(','))
      }
      if (payload.filters.states?.length) {
        queryParams.set('states', payload.filters.states.join(','))
      }
      if (payload.filters.searchTerm) {
        queryParams.set('search', payload.filters.searchTerm)
      }
      if (payload.filters.dateRange?.start) {
        queryParams.set('startDate', payload.filters.dateRange.start)
      }
      if (payload.filters.dateRange?.end) {
        queryParams.set('endDate', payload.filters.dateRange.end)
      }
    }

    navigate(`/dashboard?${queryParams.toString()}`)
  }

  const handleDeleteView = async () => {
    if (!selectedView) return
    
    try {
      await deleteSavedView(selectedView.id)
      setShowDeleteModal(false)
      setSelectedView(null)
    } catch (error) {
      console.error('Failed to delete view:', error)
    }
  }

  const handleEditView = async () => {
    if (!selectedView || !editName.trim()) return
    
    try {
      await updateSavedView(selectedView.id, { name: editName.trim() })
      setShowEditModal(false)
      setSelectedView(null)
      setEditName('')
    } catch (error) {
      console.error('Failed to update view:', error)
    }
  }

  const handleDuplicateView = async () => {
    if (!selectedView || !duplicateName.trim()) return
    
    try {
      await duplicateSavedView(selectedView.id, duplicateName.trim())
      setShowDuplicateModal(false)
      setSelectedView(null)
      setDuplicateName('')
    } catch (error) {
      console.error('Failed to duplicate view:', error)
    }
  }

  const openDeleteModal = (view: SavedView) => {
    setSelectedView(view)
    setShowDeleteModal(true)
  }

  const openEditModal = (view: SavedView) => {
    setSelectedView(view)
    setEditName(view.name)
    setShowEditModal(true)
  }

  const openDuplicateModal = (view: SavedView) => {
    setSelectedView(view)
    setDuplicateName(`${view.name} (Copy)`)
    setShowDuplicateModal(true)
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

  const getViewSummary = (view: SavedView) => {
    try {
      const payload = JSON.parse(view.payload_json)
      const filters = payload.filters || {}
      const parts = []
      
      if (filters.committees?.length) {
        parts.push(`${filters.committees.length} committee${filters.committees.length > 1 ? 's' : ''}`)
      }
      if (filters.chambers?.length) {
        parts.push(`${filters.chambers.length} chamber${filters.chambers.length > 1 ? 's' : ''}`)
      }
      if (filters.states?.length) {
        parts.push(`${filters.states.length} state${filters.states.length > 1 ? 's' : ''}`)
      }
      if (filters.searchTerm) {
        parts.push(`search: "${filters.searchTerm}"`)
      }
      
      return parts.length > 0 ? parts.join(', ') : 'No filters applied'
    } catch {
      return 'Invalid view data'
    }
  }

  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Saved Views</h1>
          <p className="text-base-content/70">
            Please sign in to manage your saved dashboard configurations.
          </p>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Authentication Required</h2>
            <p>You need to be logged in to access saved views.</p>
            <div className="card-actions justify-center">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Saved Views</h1>
        <p className="text-base-content/70">
          Manage your saved dashboard configurations and custom views.
        </p>
      </div>

      {/* Search and Actions */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="form-control w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search saved views..."
                className="input input-bordered w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                Create New View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      )}

      {/* Saved Views List */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">My Saved Views ({filteredViews.length})</h2>
          
          {filteredViews.length === 0 ? (
            <div className="text-center py-12">
              {savedViews.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-6xl">📊</div>
                  <div>
                    <h3 className="text-lg font-semibold text-base-content">No Saved Views Yet</h3>
                    <p className="text-base-content/70">
                      Create your first saved view by configuring filters on the dashboard and clicking "Save View".
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl">🔍</div>
                  <div>
                    <h3 className="text-lg font-semibold text-base-content">No Views Found</h3>
                    <p className="text-base-content/70">
                      No saved views match your search term "{searchTerm}".
                    </p>
                  </div>
                  <button 
                    className="btn btn-ghost"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto pb-40">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Configuration</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredViews.map((view) => (
                    <tr key={view.id}>
                      <td>
                        <div className="font-medium">{view.name}</div>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {getViewSummary(view)}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {formatDate(view.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {formatDate(view.updated_at)}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleLoadView(view)}
                            title="Load this view"
                          >
                            Load
                          </button>
                          <details className="dropdown dropdown-end relative">
                            <summary className="btn btn-sm btn-ghost">⋮</summary>
                            <ul className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-300 z-[9999] mt-1">
                              <li>
                                <a onClick={() => openEditModal(view)}>
                                  <span>📝</span> Rename
                                </a>
                              </li>
                              <li>
                                <a onClick={() => openDuplicateModal(view)}>
                                  <span>📋</span> Duplicate
                                </a>
                              </li>
                              <li>
                                <a onClick={() => openDeleteModal(view)} className="text-error">
                                  <span>🗑️</span> Delete
                                </a>
                              </li>
                            </ul>
                          </details>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedView && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Saved View</h3>
            <p className="py-4">
              Are you sure you want to delete the saved view "{selectedView.name}"? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedView(null)
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteView}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {showEditModal && selectedView && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Rename Saved View</h3>
            <div className="py-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">View Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter new name..."
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedView(null)
                  setEditName('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditView}
                disabled={!editName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && selectedView && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Duplicate Saved View</h3>
            <div className="py-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New View Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="Enter name for duplicate..."
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDuplicateModal(false)
                  setSelectedView(null)
                  setDuplicateName('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDuplicateView}
                disabled={!duplicateName.trim()}
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewsPage