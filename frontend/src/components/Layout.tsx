import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation Header */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          {/* Mobile menu button */}
          <div className="dropdown lg:hidden">
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            {mobileMenuOpen && (
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <Link 
                    to="/dashboard" 
                    className={isActive('/dashboard') ? 'active' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className={isActive('/about') ? 'active' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className={isActive('/faq') ? 'active' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/updates"
                    className={isActive('/updates') ? 'active' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Updates
                  </Link>
                </li>
                {user && (
                  <li>
                    <Link 
                      to="/views" 
                      className={isActive('/views') ? 'active' : ''}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Saved Views
                    </Link>
                  </li>
                )}
                {user?.role === 'privileged' || user?.role === 'admin' ? (
                  <li>
                    <Link 
                      to="/keys" 
                      className={isActive('/keys') ? 'active' : ''}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Signing Keys
                    </Link>
                  </li>
                ) : null}
                {user?.role === 'admin' && (
                  <li>
                    <Link 
                      to="/admin" 
                      className={isActive('/admin') ? 'active' : ''}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Logo */}
          <Link to="/" className="btn btn-ghost text-xl font-bold hidden sm:inline-flex">
            Beacon Hill Compliance Tracker
          </Link>
          <Link to="/" className="btn btn-ghost text-xl font-bold sm:hidden">
            B • H • C • T
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link 
                to="/dashboard" 
                className={isActive('/dashboard') ? 'active' : ''}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={isActive('/about') ? 'active' : ''}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                to="/faq"
                className={isActive('/faq') ? 'active' : ''}
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                to="/updates"
                className={isActive('/updates') ? 'active' : ''}
              >
                Updates
              </Link>
            </li>
            {user && (
              <li>
                <Link 
                  to="/views" 
                  className={isActive('/views') ? 'active' : ''}
                >
                  Saved Views
                </Link>
              </li>
            )}
            {user?.role === 'privileged' || user?.role === 'admin' ? (
              <li>
                <Link 
                  to="/keys" 
                  className={isActive('/keys') ? 'active' : ''}
                >
                  Signing Keys
                </Link>
              </li>
            ) : null}
            {user?.role === 'admin' && (
              <li>
                <Link 
                  to="/admin" 
                  className={isActive('/admin') ? 'active' : ''}
                >
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* User Menu */}
        <div className="navbar-end">
          {user ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                <div className="flex items-center space-x-2">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-8">
                      <span className="text-xs">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user.email}</span>
                    {user.role !== 'user' && (
                      <span className="badge badge-primary badge-xs">{user.role}</span>
                    )}
                  </div>
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span>Account</span>
                </li>
                {user.role !== 'user' && (
                  <li><Link to="/views">My Saved Views</Link></li>
                )}
                {user.role === 'privileged' || user.role === 'admin' ? (
                  <li><Link to="/keys">My Signing Keys</Link></li>
                ) : null}
                <li className="menu-title">
                  <span>Actions</span>
                </li>
                <li><a onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-100 text-base-content">
        <aside>
          <p className="font-bold text-lg">Beacon Hill Compliance Tracker</p>
          <p className="text-base-content/70">
            Tracking legislative compliance in Massachusetts with transparency and accountability.
          </p>
          <p className="text-sm text-base-content/50">
            Copyright © 2025 - All rights reserved
          </p>
        </aside>

        <nav className="grid gap-4">
          <div className="grid grid-flow-col gap-4">
            <Link to="/about" className="link link-hover">About</Link>
            <Link to="/faq" className="link link-hover">FAQ</Link>
            <Link to="/contact" className="link link-hover">Contact</Link>
            <Link to="/press" className="link link-hover">Press Kit</Link>
            <Link to="/privacy" className="link link-hover">Privacy Policy</Link>
            <Link to="/tos" className="link link-hover">Terms of Service</Link>
          </div>

          {/* Social Icons */}
          <div className="grid grid-flow-col gap-6 mt-2">
            {/* Reddit */}
            <a
              href="https://old.reddit.com/user/BeaconHillTracker/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-content/70 hover:text-base-content transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm5.485 11.261a2.027 2.027 0 0 1-.63 1.444c-1.087 1.084-3.29 1.165-4.852 1.165s-3.764-.081-4.852-1.165a2.027 2.027 0 0 1-.63-1.444 2.06 2.06 0 0 1 3.052-1.792 7.435 7.435 0 0 1 4.86 0 2.06 2.06 0 0 1 3.052 1.792ZM9.25 12.25A1.25 1.25 0 1 0 10.5 13.5a1.25 1.25 0 0 0-1.25-1.25Zm5.5 0A1.25 1.25 0 1 0 16 13.5a1.25 1.25 0 0 0-1.25-1.25Zm-2.75 5.236c1.308 0 2.48-.32 3.326-.9a.75.75 0 1 0-.852-1.238c-.626.431-1.55.638-2.474.638s-1.848-.207-2.474-.638a.75.75 0 1 0-.852 1.238c.846.58 2.018.9 3.326.9Z"/>
              </svg>
            </a>

            {/* Bluesky */}
            <a
              href="https://bsky.app/profile/beaconhilltracker.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-content/70 hover:text-base-content transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 9.95c1.582-3.146 5.236-5.737 7.443-5.737 1.264 0 1.957 1.03 1.957 2.237 0 1.582-1.028 3.185-2.059 4.36-.88 1.006-.88 1.611 0 2.617 1.03 1.175 2.059 2.778 2.059 4.36 0 1.207-.693 2.237-1.957 2.237-2.207 0-5.861-2.591-7.443-5.737-1.582 3.146-5.236 5.737-7.443 5.737-1.264 0-1.957-1.03-1.957-2.237 0-1.582 1.029-3.185 2.059-4.36.88-1.006.88-1.611 0-2.617-1.03-1.175-2.059-2.778-2.059-4.36 0-1.207.693-2.237 1.957-2.237 2.207 0 5.861 2.591 7.443 5.737Z" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://x.com/BeaconHillTrack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-content/70 hover:text-base-content transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2H21l-6.51 7.445L22 22h-7.173l-4.7-6.146L4.6 22H2l7.028-8.043L2 2h7.173l4.274 5.684L18.244 2Zm-2.48 17.329h1.863L8.31 4.56H6.33l9.434 14.769Z"/>
              </svg>
            </a>
          </div>
        </nav>
      </footer>
    </div>
  )
}

export default Layout