import React, { useState, useEffect } from 'react'
import { getChangelog, ChangelogEntry } from '../services/api'
import { formatDateOnly } from '../utils/dateFormat'

interface ChangelogDisplayProps {
  limit?: number
  compact?: boolean
}

const ChangelogDisplay: React.FC<ChangelogDisplayProps> = ({ 
  limit = 5, 
  compact = false 
}) => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        setLoading(true)
        const response = await getChangelog(limit)
        setChangelog(response.changelog || [])
        setError(null)
      } catch (err: any) {
        console.error('Error fetching changelog:', err)
        setError(err.response?.data?.error || 'Failed to load changelog')
      } finally {
        setLoading(false)
      }
    }

    fetchChangelog()
  }, [limit])

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'added':
        return '🆕'
      case 'changed':
        return '🔄'
      case 'fixed':
        return '🐛'
      case 'removed':
        return '🗑️'
      case 'deprecated':
        return '⚠️'
      case 'security':
        return '🔒'
      default:
        return '📝'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'added':
        return 'badge-success'
      case 'changed':
        return 'badge-info'
      case 'fixed':
        return 'badge-warning'
      case 'removed':
        return 'badge-error'
      case 'deprecated':
        return 'badge-warning'
      case 'security':
        return 'badge-error'
      default:
        return 'badge-ghost'
    }
  }

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  // Use the shared date formatting utility to avoid timezone issues
  const formatDate = (dateString: string) => {
    return formatDateOnly(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>No changelog entries available yet. Check back soon for scraping algorithm updates!</span>
      </div>
    )
  }

  if (changelog.length === 0) {
    return (
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>No changelog entries available yet.</span>
      </div>
    )
  }

  if (compact) {
    // Compact view - just show latest version highlights
    const latestVersion = changelog[0]
    return (
      <div className="bg-base-200 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge badge-primary badge-lg">v{latestVersion.version}</span>
          <span className="text-sm opacity-70">{formatDate(latestVersion.date)}</span>
        </div>
        <div className="space-y-2">
          {Object.entries(latestVersion.changes).slice(0, 3).map(([category, items]) => (
            <div key={category}>
              <span className={`badge ${getCategoryColor(category)} badge-sm mr-2`}>
                {getCategoryIcon(category)} {formatCategory(category)}
              </span>
              <span className="text-sm">{items[0]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {changelog.map((entry, index) => (
        <div 
          key={`${entry.version}-${index}`}
          className="card bg-base-100 shadow-md border-l-4 border-primary"
        >
          <div className="card-body">
            {/* Version header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="badge badge-primary badge-lg">
                  v{entry.version}
                </span>
                <span className="text-sm opacity-70">
                  {formatDate(entry.date)}
                </span>
              </div>
              {index === 0 && (
                <span className="badge badge-success badge-outline">Latest</span>
              )}
            </div>

            {/* Changes by category */}
            <div className="space-y-4">
              {Object.entries(entry.changes).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${getCategoryColor(category)}`}>
                      {getCategoryIcon(category)} {formatCategory(category)}
                    </span>
                  </div>
                  <ul className="space-y-1 ml-4">
                    {items.map((item, itemIndex) => (
                      <li 
                        key={itemIndex}
                        className="flex items-start gap-2 text-sm text-base-content/90"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {changelog.length >= limit && (
        <div className="text-center">
          <p className="text-sm opacity-70">
            Showing {limit} most recent versions
          </p>
        </div>
      )}
    </div>
  )
}

export default ChangelogDisplay

