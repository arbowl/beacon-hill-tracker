import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { updates, Update } from '../data/updates'
import { formatDateOnly } from '../utils/dateFormat'

const UPDATES_PER_PAGE = 10

const UpdatesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Sort updates by date (newest first)
  const sortedUpdates = useMemo(() => {
    return [...updates].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [])

  // Calculate pagination
  const totalPages = Math.ceil(sortedUpdates.length / UPDATES_PER_PAGE)
  const startIndex = (currentPage - 1) * UPDATES_PER_PAGE
  const endIndex = startIndex + UPDATES_PER_PAGE
  const currentUpdates = sortedUpdates.slice(startIndex, endIndex)

  const getTypeBadgeClass = (type?: string) => {
    if (!type) return 'badge-primary'
    
    switch (type.toLowerCase()) {
      case 'alert':
        return 'badge-error'
      case 'status':
        return 'badge-info'
      case 'musing':
        return 'badge-secondary'
      case 'update':
      default:
        return 'badge-primary'
    }
  }

  const getTypeLabel = (type?: string) => {
    if (!type) return 'Update'
    
    // Capitalize first letter and return as-is
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Updates</h1>
        <p className="text-xl text-base-content/70">
          Status updates, site alerts, and project musings
        </p>
      </div>

      {sortedUpdates.length === 0 ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center">
            <p className="text-base-content/70">No updates yet. Check back soon!</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {currentUpdates.map((update) => (
              <div
                key={update.id}
                className={`card bg-base-100 shadow-md ${
                  update.type === 'alert' ? 'border-l-4 border-error' : ''
                }`}
              >
                <div className="card-body">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="badge badge-outline">
                      {formatDateOnly(update.date)}
                    </div>
                    {update.type && (
                      <div className={`badge ${getTypeBadgeClass(update.type)}`}>
                        {getTypeLabel(update.type)}
                      </div>
                    )}
                  </div>
                  {update.title && (
                    <h2 className="card-title text-2xl mb-3">{update.title}</h2>
                  )}
                  <div className="prose prose-sm prose-neutral max-w-none text-base-content/80">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {update.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="join">
                <button
                  className="join-item btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`join-item btn ${
                          currentPage === page ? 'btn-active' : ''
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <button key={page} className="join-item btn btn-disabled">
                        ...
                      </button>
                    )
                  }
                  return null
                })}
                <button
                  className="join-item btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UpdatesPage

