import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setErrorMessage('No verification token provided.')
        setTimeout(() => {
          navigate('/login?verified=false&error=invalid_token')
        }, 3000)
        return
      }

      try {
        // Call backend API with Accept header to get JSON response
        const response = await fetch(`${api.defaults.baseURL}/auth/verify/${token}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus('success')
          setTimeout(() => {
            navigate('/login?verified=true')
          }, 2000)
        } else {
          setStatus('error')
          setErrorMessage(data.message || 'Verification failed.')
          setTimeout(() => {
            navigate(`/login?verified=false&error=${data.error || 'unknown'}`)
          }, 3000)
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setErrorMessage('An error occurred during verification.')
        setTimeout(() => {
          navigate('/login?verified=false&error=server_error')
        }, 3000)
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center">
            {status === 'verifying' && (
              <>
                <div className="flex justify-center mb-4">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
                <h2 className="text-2xl font-bold text-base-content mb-2">
                  Verifying Your Email
                </h2>
                <p className="text-base-content/70">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-16 w-16 text-success" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-success mb-2">
                  Email Verified!
                </h2>
                <p className="text-base-content/70">
                  Your email has been successfully verified. Redirecting to login...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-16 w-16 text-error" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-error mb-2">
                  Verification Failed
                </h2>
                <p className="text-base-content/70 mb-4">
                  {errorMessage}
                </p>
                <p className="text-sm text-base-content/60">
                  Redirecting to login page...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage

