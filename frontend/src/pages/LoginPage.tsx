import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  // Check for verification status in query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const verified = searchParams.get('verified')
    const errorParam = searchParams.get('error')

    if (verified === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.')
    } else if (verified === 'false') {
      if (errorParam === 'invalid_token') {
        setError('Invalid or already used verification link.')
      } else if (errorParam === 'expired') {
        setError('Verification link has expired. Please contact support.')
      } else {
        setError('Email verification failed. Please try again or contact support.')
      }
    }

    // Clear the query parameters from the URL
    if (verified) {
      navigate('/login', { replace: true, state: location.state })
    }
  }, [location.search, navigate, location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-base-content">
                Sign in to your account
              </h2>
              <p className="mt-2 text-base-content/70">
                Or{' '}
                <Link
                  to="/register"
                  className="link link-primary font-medium"
                >
                  create a new account
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {successMessage && (
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}
              
              {error && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text font-medium">Email address</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input input-bordered w-full"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="password">
                  <span className="label-text font-medium">Password</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input input-bordered w-full"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="label">
                  <span className="label-text-alt"></span>
                  <Link
                    to="/forgot-password"
                    className="label-text-alt link link-hover link-primary"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="divider">OR</div>

              <div className="text-center">
                <p className="text-sm text-base-content/70">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="link link-primary font-medium"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
