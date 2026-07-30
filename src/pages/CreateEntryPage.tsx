import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EntryIntervalField } from '../components/EntryIntervalField'
import { MarkupEditor } from '../components/MarkupEditor'
import { VideoRecorderField } from '../components/VideoRecorderField'
import { createEntry, uploadRecordedVideo } from '../lib/data'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'

export function CreateEntryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    isPublic: false,
    isAnonymous: true,
    entryInterval: '30',
  })
  const [recordedVideoFile, setRecordedVideoFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      navigate('/login')
      return
    }

    if (formData.type === 'video' && !recordedVideoFile) {
      setError('Record a video before creating your post.')
      return
    }

    setLoading(true)
    try {
      const videoUrl =
        formData.type === 'video' && recordedVideoFile
          ? await uploadRecordedVideo({
              file: recordedVideoFile,
              ownerId: user.uid,
              scope: 'entries',
            })
          : undefined

      await createEntry({
        title: formData.title,
        content: formData.content,
        type: formData.type === 'video' ? 'video' : 'text',
        isPublic: formData.isPublic,
        isAnonymous: formData.isAnonymous,
        entryInterval: Number.parseInt(formData.entryInterval, 10),
        videoUrl,
        author: user,
      })

      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post'
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
              <span className="eyebrow">Post</span>
              <h1 className="section-title mt-2">Create Post</h1>
              <p className="section-subtitle">Share an update, story, or announcement and choose who sees it.</p>
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
              <MarkupEditor
                id="content"
                label="Post Content *"
                required
                rows={10}
                value={formData.content}
                onChange={(content) =>
                  setFormData((previous) => ({
                    ...previous,
                    content,
                  }))
                }
              />
            ) : (
              <VideoRecorderField
                id="entryVideo"
                label="Record Video *"
                onChange={setRecordedVideoFile}
                helperText="Record your post directly with camera + microphone."
              />
            )}

            <EntryIntervalField
              value={formData.entryInterval}
              onChange={(entryInterval) =>
                setFormData((previous) => ({
                  ...previous,
                  entryInterval,
                }))
              }
            />

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
              <button type="submit" disabled={loading} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Creating...' : 'Create Post'}
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
