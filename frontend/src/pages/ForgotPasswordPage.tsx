import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await forgotPassword(email)
      setSuccess(true)
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
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
                Reset your password
              </h2>
              <p className="mt-2 text-base-content/70">
                Enter your email address and we'll send you a link to reset
                your password.
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
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
                  <div>
                    <div className="font-bold">Check your email</div>
                    <div className="text-sm">
                      If an account exists with this email, you will receive
                      password reset instructions.
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-sm text-base-content/70">
                    Didn't receive the email? Check your spam folder or try
                    again.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Send another email
                  </button>
                  <div className="divider">OR</div>
                  <Link to="/login" className="btn btn-primary w-full">
                    Back to login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="form-control">
                  <label className="label" htmlFor="email">
                    <span className="label-text font-medium">
                      Email address
                    </span>
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

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full ${
                    loading ? 'loading' : ''
                  }`}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>

                <div className="divider">OR</div>

                <div className="text-center">
                  <p className="text-sm text-base-content/70">
                    Remember your password?{' '}
                    <Link to="/login" className="link link-primary font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

