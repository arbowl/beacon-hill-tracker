import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { keysService } from '../services/api'

interface SigningKey {
  id: number
  key_id: string
  created_at: string
  revoked_at: string | null
  is_revoked: boolean
}

const KeysPage: React.FC = () => {
  const { user } = useAuth()
  const [keys, setKeys] = useState<SigningKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [newKeyData, setNewKeyData] = useState<{key_id: string, secret: string} | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const response = await keysService.getKeys()
      setKeys(response.data.keys || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch keys')
    } finally {
      setLoading(false)
    }
  }

  const generateKey = async () => {
    try {
      setGenerating(true)
      setError('')
      setNewKeyData(null)
      const response = await keysService.generateKey('Generated from dashboard')
      // Show the secret immediately after generation
      setNewKeyData({
        key_id: response.data.key.key_id,
        secret: response.data.key.secret
      })
      await fetchKeys() // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate key')
    } finally {
      setGenerating(false)
    }
  }

  const revokeKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) {
      return
    }

    try {
      await keysService.revokeKey(keyId)
      await fetchKeys() // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      alert('Key copied to clipboard!')
    })
  }

  // Check if user has permission to access this page
  if (!user || (user.role !== 'privileged' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>You need privileged or admin access to view signing keys.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Signing Keys</h1>
            <p className="text-base-content/70 mt-2">
              Manage your signing keys for trusted data submissions. These keys identify you as an authorized contributor.
            </p>
          </div>
          <button 
            className={`btn btn-primary w-full sm:w-auto ${generating ? 'loading' : ''}`}
            onClick={generateKey}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate New Key'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* New Key Display (one-time only) */}
        {newKeyData && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold mb-2">🔑 New Signing Key Generated!</h3>
              <p className="text-sm mb-4">⚠️ This is the only time the secret will be displayed. Store both values securely.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Key ID (for signing_key_id parameter):</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 font-mono text-sm min-w-0"
                      value={newKeyData.key_id}
                      readOnly
                    />
                    <button
                      className="btn btn-outline w-full sm:w-auto"
                      onClick={() => copyToClipboard(newKeyData.key_id)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Secret (for signing_key_secret parameter):</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 font-mono text-sm min-w-0"
                      value={newKeyData.secret}
                      readOnly
                    />
                    <button
                      className="btn btn-outline join-item"
                      onClick={() => copyToClipboard(newKeyData.secret)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setNewKeyData(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="card bg-info text-info-content">
          <div className="card-body">
            <h2 className="card-title">About Signing Keys</h2>
            <div className="space-y-2 text-sm">
              <p>
                • Signing keys are cryptographic key pairs that identify you as a trusted contributor
              </p>
              <p>
                • Each key has a unique ID and public key that can be shared externally
              </p>
              <p>
                • Keys can be revoked if compromised, but this action is permanent
              </p>
              <p>
                • Only privileged users and administrators can generate signing keys
              </p>
            </div>
          </div>
        </div>

        {/* Keys List */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Your Signing Keys</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-base-content/50">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No signing keys yet</p>
                  <p>Generate your first signing key to start contributing trusted data.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {keys.map((key) => (
                  <div key={key.id} className={`card ${!key.is_revoked ? 'bg-base-200' : 'bg-base-300'} shadow-sm`}>
                    <div className="card-body">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <h3 className="font-mono text-xs font-bold">
                              Key ID: {key.key_id}
                            </h3>
                            <div className={`badge ${!key.is_revoked ? 'badge-success' : 'badge-error'} self-start sm:self-center`}>
                              {!key.is_revoked ? 'Active' : 'Revoked'}
                            </div>
                          </div>
                          
                          <div className="text-sm text-base-content/70">
                            <p>Created: {new Date(key.created_at).toLocaleDateString()}</p>
                            {key.revoked_at && (
                              <p>Revoked: {new Date(key.revoked_at).toLocaleDateString()}</p>
                            )}
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">Key ID (Public Identifier)</span>
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                className="input input-bordered flex-1 font-mono text-xs min-w-0"
                                value={key.key_id}
                                readOnly
                              />
                              <button
                                className="btn btn-outline w-full sm:w-auto"
                                onClick={() => copyToClipboard(key.key_id)}
                              >
                                <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span class="hidden sm:inline">Copy</span>
                              </button>
                            </div>
                            <div className="label">
                              <span className="label-text-alt text-base-content/50">Secret is not displayed for security reasons</span>
                            </div>
                          </div>
                        </div>

                        {!key.is_revoked && (
                          <div className="card-actions">
                            <button
                              className="btn btn-error btn-sm"
                              onClick={() => revokeKey(key.id)}
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Usage Instructions</h2>
            <div className="prose max-w-none">
              <ol className="space-y-2">
                <li>
                  <strong>Generate a signing key</strong> using the button above. This creates a unique key pair for you.
                </li>
                <li>
                  <strong>Copy your Key ID and Public Key</strong> from the list above.
                </li>
                <li>
                  <strong>Share your credentials</strong> with authorized systems that need to verify your submissions.
                </li>
                <li>
                  <strong>Keep your keys secure</strong> - treat them like passwords and don't share them unnecessarily.
                </li>
                <li>
                  <strong>Revoke compromised keys</strong> immediately if you suspect they've been compromised.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeysPage
