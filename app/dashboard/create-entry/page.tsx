'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateEntryPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    isPublic: false,
    entryInterval: '30',
    videoUrl: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          isPublic: formData.isPublic,
          entryInterval: parseInt(formData.entryInterval),
          videoUrl: formData.type === 'video' ? formData.videoUrl : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create entry')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="omega-page">
      <header className="omega-shell">
        <nav className="omega-nav fade-up">
          <Link href="/dashboard" className="omega-brand">
            <span className="brand-dot" aria-hidden="true" />
            Omega
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-pill">
              Dashboard
            </Link>
            <Link href="/public" className="nav-pill">
              Soap Box
            </Link>
          </div>
        </nav>
      </header>

      <main className="omega-shell mt-5">
        <section className="panel panel-strong p-5 md:p-6 float-in">
          <div className="section-head mb-4">
            <div>
              <span className="eyebrow">Journal</span>
              <h1 className="section-title mt-2">Create Journal Entry</h1>
              <p className="section-subtitle">Capture a new reflection and set when the next one is available.</p>
            </div>
            <Link href="/dashboard" className="btn btn-ghost">
              Back to Dashboard
            </Link>
          </div>

          {error && <div className="notice-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label htmlFor="title">Entry Title *</label>
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
              <label htmlFor="type">Entry Type *</label>
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
                <label htmlFor="content">Entry Content *</label>
                <textarea
                  id="content"
                  required
                  rows={10}
                  className="textarea"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your journal entry here..."
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
                <p className="field-help">Enter a direct URL to the video file you want to attach.</p>
              </div>
            )}

            <div className="field">
              <label htmlFor="entryInterval">Next Entry Interval (days) *</label>
              <input
                type="number"
                id="entryInterval"
                required
                min="1"
                className="input"
                value={formData.entryInterval}
                onChange={(e) => setFormData({ ...formData, entryInterval: e.target.value })}
              />
              <p className="field-help">How many days until the next journal entry can be created.</p>
            </div>

            <label htmlFor="isPublic" className="checkbox-row">
              <input
                type="checkbox"
                id="isPublic"
                className="h-4 w-4"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <span>Make this entry public on Soap Box.</span>
            </label>

            <div className="button-row pt-2">
              <button type="submit" disabled={loading} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Creating...' : 'Create Entry'}
              </button>
              <Link href="/dashboard" className="btn btn-ghost">
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
