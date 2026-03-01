import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createMessage } from '../lib/data'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'

export function CreateMessagePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    recipientEmails: '',
    videoUrl: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      const recipientEmails = formData.recipientEmails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0)

      await createMessage({
        title: formData.title,
        content: formData.content,
        type: formData.type === 'video' ? 'video' : 'text',
        recipientEmails,
        videoUrl: formData.type === 'video' ? formData.videoUrl : undefined,
        author: user,
      })

      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create message'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="omega-page">
      <header className="omega-shell">
        <nav className="omega-nav fade-up">
          <Link to="/dashboard" className="omega-brand">
            <span className="brand-dot" aria-hidden="true" />
            {APP_NAME}
          </Link>
          <div className="nav-links">
            <Link to="/dashboard" className="nav-pill">
              Dashboard
            </Link>
            <Link to="/public" className="nav-pill">
              {SOAP_BOX_NAME}
            </Link>
          </div>
        </nav>
      </header>

      <main className="omega-shell mt-5">
        <section className="panel panel-strong p-5 md:p-6 float-in">
          <div className="section-head mb-4">
            <div>
              <span className="eyebrow">Compose</span>
              <h1 className="section-title mt-2">Create Direct Message</h1>
              <p className="section-subtitle">Send a private message for any occasion, with text or video.</p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost">
              Back to Dashboard
            </Link>
          </div>

          {error && <div className="notice-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label htmlFor="title">Message Title *</label>
              <input
                type="text"
                id="title"
                required
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="type">Message Type *</label>
              <select
                id="type"
                required
                className="select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="text">Text</option>
                <option value="video">Video</option>
              </select>
            </div>

            {formData.type === 'text' ? (
              <div className="field">
              <label htmlFor="content">Message Content *</label>
              <textarea
                id="content"
                required
                rows={8}
                className="textarea"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your message..."
              />
            </div>
            ) : (
              <div className="field">
                <label htmlFor="videoUrl">Video URL *</label>
                <input
                  type="url"
                  id="videoUrl"
                  required
                  className="input"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                />
                <p className="field-help">Enter a direct URL to your video file hosted online.</p>
              </div>
            )}

            <div className="field">
              <label htmlFor="recipients">Recipient Email Addresses *</label>
              <input
                type="text"
                id="recipients"
                required
                className="input"
                value={formData.recipientEmails}
                onChange={(e) => setFormData({ ...formData, recipientEmails: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="field-help">
                Separate multiple addresses with commas. Recipients must already be registered on {APP_NAME}.
              </p>
            </div>

            <div className="button-row pt-2">
              <button type="submit" disabled={loading} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
              <Link to="/dashboard" className="btn btn-ghost">
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
