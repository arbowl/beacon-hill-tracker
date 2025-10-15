import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      await register(email, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center">
              <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-base-content mb-4">
                Check your email
              </h2>
              
              <div className="space-y-4">
                <p className="text-base-content/70">
                  We've sent a verification link to{' '}
                  <span className="font-semibold text-base-content">{email}</span>.
                </p>
                
                <p className="text-sm text-base-content/60">
                  Please check your email and click the link to activate your account.
                  The link will expire in 24 hours.
                </p>
              </div>
              
              <div className="card-actions justify-center mt-6">
                <Link to="/login" className="btn btn-primary">
                  Go to Sign In
                </Link>
                <button 
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="btn btn-ghost"
                >
                  Register Another Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-base-content">
                Create your account
              </h2>
              <p className="mt-2 text-base-content/70">
                Or{' '}
                <Link
                  to="/login"
                  className="link link-primary font-medium"
                >
                  sign in to your existing account
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  autoComplete="new-password"
                  required
                  className="input input-bordered w-full"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="label">
                  <span className="label-text-alt text-base-content/60">
                    Must be at least 8 characters long
                  </span>
                </div>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="confirmPassword">
                  <span className="label-text font-medium">Confirm Password</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input input-bordered w-full"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="divider">OR</div>

              <div className="text-center">
                <p className="text-sm text-base-content/70">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="link link-primary font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="text-xs text-base-content/50 text-center">
                By creating an account, you agree to our{' '}
                <Link to="/tos" className="link link-primary">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="link link-primary">
                  Privacy Policy
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Registration Benefits */}
        <div className="card bg-base-100 shadow-md mt-4">
          <div className="card-body py-4">
            <h3 className="card-title text-sm mb-3">Account Benefits</h3>
            <ul className="text-sm space-y-1 text-base-content/70">
              <li>• Save custom dashboard views</li>
              <li>• Export filtered compliance data</li>
              <li>• Submit data <strong>(trusted users only)</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
