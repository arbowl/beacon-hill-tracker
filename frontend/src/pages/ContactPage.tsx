import React, { useState } from 'react'
import { sendContactMessage } from '../services/api'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await sendContactMessage(
        formData.name,
        formData.email,
        formData.subject,
        formData.message
      )
      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-xl text-gray-600">
          Get in touch with our team for questions, feedback, or support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="dashboard-card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Send us a message
          </h2>

          {success && (
            <div className="alert alert-success mb-6">
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
              <span>
                Message sent successfully! We'll get back to you soon.
              </span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="subject">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                className="form-input"
                placeholder="What is this regarding?"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                className="form-input"
                placeholder="Your message..."
                value={formData.message}
                onChange={handleChange}
                required
                minLength={10}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="dashboard-card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3 text-gray-600">
              <div>Email: info@beaconhilltracker.org</div>
            </div>
          </div>
          <div className="dashboard-card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Support</h3>
            <p className="text-gray-600 mb-4">
              For technical issues, bug reports, and feature requests, visit our GitHub repository.
            </p>
            <a 
              href="https://github.com/arbowl/beacon-hill-compliance-tracker" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage



