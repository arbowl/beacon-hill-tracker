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
          <p className="font-bold text-lg">
            Beacon Hill Compliance Tracker
          </p>
          <p className="text-base-content/70">
            Tracking legislative compliance in Massachusetts with transparency and accountability.
          </p>
          <p className="text-sm text-base-content/50">
            Copyright © 2025 - All rights reserved
          </p>
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-4">
            <Link to="/about" className="link link-hover">About</Link>
            <Link to="/faq" className="link link-hover">FAQ</Link>
            <Link to="/contact" className="link link-hover">Contact</Link>
            <Link to="/press" className="link link-hover">Press Kit</Link>
            <Link to="/privacy" className="link link-hover">Privacy Policy</Link>
            <Link to="/tos" className="link link-hover">Terms of Service</Link>
          </div>
        </nav>
      </footer>
    </div>
  )
}

export default Layout