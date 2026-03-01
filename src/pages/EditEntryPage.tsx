import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchEntryById, updateEntry } from '../lib/data'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'
import { renderMarkupToHtml } from '../lib/markup'

export function EditEntryPage() {
  const navigate = useNavigate()
  const { entryId } = useParams<{ entryId: string }>()
  const { user } = useAuth()
  const [loadingEntry, setLoadingEntry] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    isPublic: false,
    isAnonymous: true,
    entryInterval: '30',
    videoUrl: '',
  })
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadEntry = async () => {
      if (!entryId || !user) return

      setLoadingEntry(true)
      setError('')

      try {
        const entry = await fetchEntryById(entryId)
        if (!entry) {
          setError('Entry not found.')
          return
        }

        if (entry.authorId !== user.uid) {
          setError('You can only edit your own entries.')
          return
        }

        setFormData({
          title: entry.title,
          content: entry.content,
          type: entry.type,
          isPublic: entry.isPublic,
          isAnonymous: entry.isAnonymous,
          entryInterval: String(entry.entryInterval),
          videoUrl: entry.videoUrl ?? '',
        })
      } catch (err) {
        console.error('Failed to load entry:', err)
        setError('Failed to load entry.')
      } finally {
        setLoadingEntry(false)
      }
    }

    void loadEntry()
  }, [entryId, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      navigate('/login')
      return
    }

    if (!entryId) {
      setError('Missing entry id.')
      return
    }

    setSaving(true)
    try {
      await updateEntry(entryId, {
        title: formData.title,
        content: formData.content,
        type: formData.type === 'video' ? 'video' : 'text',
        isPublic: formData.isPublic,
        isAnonymous: formData.isAnonymous,
        entryInterval: Number.parseInt(formData.entryInterval, 10),
        videoUrl: formData.type === 'video' ? formData.videoUrl : undefined,
      })

      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update post'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingEntry) {
    return (
      <div className="omega-page flex items-center justify-center px-4">
        <div className="panel p-7 text-center">
          <h1 className="text-2xl">Loading entry...</h1>
        </div>
      </div>
    )
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
              <span className="eyebrow">Post</span>
              <h1 className="section-title mt-2">Edit Post</h1>
              <p className="section-subtitle">Update your post details and visibility settings.</p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost">
              Back to Dashboard
            </Link>
          </div>

          {error && <div className="notice-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label htmlFor="title">Post Title *</label>
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
              <label htmlFor="type">Post Type *</label>
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
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="content">Post Content *</label>
                  <div className="tab-row" role="tablist" aria-label="Editor mode">
                    <button
                      type="button"
                      className={`tab-btn ${editorMode === 'write' ? 'active' : ''}`}
                      onClick={() => setEditorMode('write')}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${editorMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setEditorMode('preview')}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                {editorMode === 'write' ? (
                  <textarea
                    id="content"
                    required
                    rows={10}
                    className="textarea"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your post here..."
                  />
                ) : (
                  <div className="markup-preview">
                    <div
                      className="markup-content"
                      dangerouslySetInnerHTML={{ __html: renderMarkupToHtml(formData.content) }}
                    />
                  </div>
                )}
                <p className="field-help">
                  Markup supported: headings (#), bold (**text**), italics (*text*), links, lists, blockquotes, and code.
                </p>
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
              <label htmlFor="entryInterval">Next Post Interval (days) *</label>
              <input
                type="number"
                id="entryInterval"
                required
                min="1"
                className="input"
                value={formData.entryInterval}
                onChange={(e) => setFormData({ ...formData, entryInterval: e.target.value })}
              />
              <p className="field-help">How many days until your next scheduled post can be created.</p>
            </div>

            <label htmlFor="isPublic" className="checkbox-row">
              <input
                type="checkbox"
                id="isPublic"
                className="h-4 w-4"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <span>Share this post on {SOAP_BOX_NAME}.</span>
            </label>

            {formData.isPublic && (
              <label htmlFor="isAnonymous" className="checkbox-row">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  className="h-4 w-4"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                />
                <span>Post anonymously on {SOAP_BOX_NAME} (default).</span>
              </label>
            )}

            <div className="button-row pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-70">
                {saving ? 'Saving...' : 'Save Changes'}
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
