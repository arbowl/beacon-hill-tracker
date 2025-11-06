import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGlobalStats, useGlobalMetadata } from '../hooks/useData'
import CommitteeChangeWidget from '../components/CommitteeChangeWidget'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const { data: stats, loading: statsLoading, error: statsError } = useGlobalStats()
  const { metadata: globalMetadata, loading: globalMetadataLoading } = useGlobalMetadata()

  // Use stats directly from API (same as DashboardPage)
  // Do NOT recalculate from bills - that would only use paginated data (25 bills by default)
  // The backend /api/stats endpoint already returns correct aggregated stats for all bills
  const displayStats = stats

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Beacon Hill Compliance Tracker
        </h1>
        <div className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 space-y-4">
          <p>
            The Massachusetts Legislature is bound by rules to record votes, post agendas in advance, and make documents available to the public.
          </p>
          <p>
            However, these rules are often ignored or circumvented, leading to a lack of transparency about how decisions are made. When they are posted, the information is often hard to find.
          </p>
          <p>
            Lack of transparency is a systemic issue, not a partisan one. My goal is simple — to cast a spotlight on the requirements, and give others the tools to enact change.
          </p>
        </div>
        
        {!user && (
          <div className="space-x-4">
            <Link to="/dashboard" className="btn btn-primary">
              View Dashboard
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Sign In
            </Link>
          </div>
        )}
        
        {user && (
          <div className="space-x-4">
            <Link to="/dashboard" className="btn btn-primary">
              View Dashboard
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-secondary">
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsLoading ? (
          // Loading skeleton - only show while stats are loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-md">
              <div className="card-body text-center">
                <div className="skeleton h-8 w-16 mx-auto mb-2"></div>
                <div className="skeleton h-4 w-24 mx-auto"></div>
              </div>
            </div>
          ))
        ) : statsError ? (
          <div className="col-span-4 text-center text-error">
            <p>Unable to load statistics. Please check if the backend is running.</p>
          </div>
        ) : (
          <>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {displayStats?.total_committees || 0}
                </div>
                <div className="text-base-content/70">Committees Tracked</div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-md">
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-success mb-2">
                  {displayStats?.total_bills || 0}
                </div>
                <div className="text-base-content/70">Bills Analyzed</div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-md">
              <div className="card-body text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  (displayStats?.overall_compliance_rate || 0) >= 80 ? 'text-success' :
                  (displayStats?.overall_compliance_rate || 0) >= 60 ? 'text-warning' :
                  'text-error'
                }`}>
                  {displayStats?.overall_compliance_rate || 0}%
                </div>
                <div className="text-base-content/70">Compliance Rate</div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-md">
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-error mb-2">
                  {displayStats?.non_compliant_bills || 0}
                </div>
                <div className="text-base-content/70">Non-Compliant Bills</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Changes Widget - Global aggregated stats */}
      {globalMetadata?.diff_report && (
        <CommitteeChangeWidget
          diffReport={globalMetadata.diff_report}
          analysis={globalMetadata.analysis}
          loading={globalMetadataLoading}
        />
      )}

      {/* Press Kit Banner */}
      <div className="alert bg-gradient-to-r from-blue-50 to-amber-50 border-l-4 border-blue-800">
        <svg className="stroke-current flex-shrink-0 h-6 w-6 text-blue-800" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div className="font-bold text-blue-900">Media & Press</div>
          <div className="text-sm text-blue-800">Download the one-page press kit for interviews, articles, and reporting.</div>
        </div>
        <div className="flex-none">
          <Link to="/press" className="btn btn-sm bg-blue-800 text-white hover:bg-blue-900">
            View Press Kit
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="text-primary mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="card-title text-xl mb-2">Interactive Dashboard</h3>
            <p className="text-base-content/70">
              Explore compliance data with customizable filters, visualizations, and real-time updates.
            </p>
            <div className="card-actions justify-end mt-4">
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Explore
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="text-info mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="card-title text-xl mb-2">My Methodology</h3>
            <p className="text-base-content/70">
              Automated data collection from official sources ensures accuracy and ongoing transparency tracking.
            </p>
            <div className="card-actions justify-end mt-4">
              <Link to="/about" className="btn btn-info btn-sm">
                Learn More
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="text-secondary mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="card-title text-xl mb-2">Saved Views</h3>
            <p className="text-base-content/70">
              Save custom dashboard configurations and share insights with your team.
            </p>
            <div className="card-actions justify-end mt-4">
              {user ? (
                <Link to="/views" className="btn btn-secondary btn-sm">
                  My Views
                </Link>
              ) : (
                <Link to="/register" className="btn btn-secondary btn-sm">
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="badge badge-success">●</div>
              <div>
                <div className="font-medium">Backend API</div>
                <div className="text-sm text-base-content/70">All systems operational</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="badge badge-success">●</div>
              <div>
                <div className="font-medium">Database</div>
                <div className="text-sm text-base-content/70">
                  {displayStats ? `Last updated: ${displayStats.latest_report_date || 'Recently'}` : 'Connected'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="badge badge-success">●</div>
              <div>
                <div className="font-medium">Authentication</div>
                <div className="text-sm text-base-content/70">Secure login available</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="badge badge-info">●</div>
              <div>
                <div className="font-medium">Data Processing</div>
                <div className="text-sm text-base-content/70">Ready for new imports</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {!user && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center">
            <h2 className="card-title text-2xl justify-center mb-4">
              Ready to Get Started?
            </h2>
            <p className="mb-6">
              Create an account to access advanced features, save custom views, and export data.
            </p>
            <div className="card-actions justify-center">
              <Link to="/register" className="btn btn-secondary">
                Create Account
              </Link>
              <Link to="/dashboard" className="btn btn-ghost">
                Browse as Guest
              </Link>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="card bg-base-200 shadow-md">
          <div className="card-body text-center">
            <h2 className="card-title text-2xl justify-center mb-4">
              Welcome back, {user.email}!
            </h2>
            <p className="mb-6">
              Your role: <span className="badge badge-primary">{user.role}</span>
            </p>
            <div className="card-actions justify-center space-x-4">
              <Link to="/dashboard" className="btn btn-primary">
                View Dashboard
              </Link>
              {user.role !== 'user' && (
                <Link to="/views" className="btn btn-secondary">
                  My Saved Views
                </Link>
              )}
              {user.role === 'privileged' || user.role === 'admin' ? (
                <Link to="/keys" className="btn btn-accent">
                  Signing Keys
                </Link>
              ) : null}
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-warning">
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
