import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteEntry, fetchMyEntries, fetchMyMessages } from '../lib/data'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'
import type { Entry, Message } from '../types/models'

type Tab = 'messages' | 'entries'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('messages')

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        setError('')
        setLoading(true)
        const [nextMessages, nextEntries] = await Promise.all([fetchMyMessages(user.uid), fetchMyEntries(user.uid)])
        setMessages(nextMessages)
        setEntries(nextEntries)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user])

  const canCreateEntry = useMemo(() => {
    const lastEntry = entries[0]
    if (!lastEntry?.nextEntryDate) return true
    return lastEntry.nextEntryDate <= new Date()
  }, [entries])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleDeleteEntry = async (entry: Entry) => {
    const confirmed = window.confirm(`Delete "${entry.title}"? This cannot be undone.`)
    if (!confirmed) return

    setError('')
    setDeletingEntryId(entry.id)
    try {
      await deleteEntry(entry.id)
      setEntries((prev) => prev.filter((item) => item.id !== entry.id))
    } catch (err) {
      console.error('Failed to delete entry:', err)
      setError('Failed to delete post.')
    } finally {
      setDeletingEntryId(null)
    }
  }

  if (loading) {
    return (
      <div className="omega-page flex items-center justify-center px-4">
        <div className="panel p-7 text-center">
          <h1 className="text-2xl">Loading dashboard...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="omega-page">
      <header className="omega-shell">
        <nav className="omega-nav fade-up">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="omega-brand">
              <span className="brand-dot" aria-hidden="true" />
              {APP_NAME}
            </Link>
            <Link to="/public" className="nav-pill">
              {SOAP_BOX_NAME}
            </Link>
          </div>

          <div className="nav-links">
            <span className="pill">{user?.name || 'Member'}</span>
            <button onClick={handleLogout} className="btn btn-ghost" type="button">
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="omega-shell mt-5">
        {error && <div className="notice-error mb-4">{error}</div>}

        <section className="panel panel-strong p-5 md:p-6 fade-up">
          <div className="section-head mb-4">
            <div>
              <h1 className="section-title">Dashboard</h1>
              <p className="section-subtitle">Manage your direct messages and keep your personal feed active.</p>
            </div>
            <div className="button-row">
              <Link to="/dashboard/create-message" className="btn btn-secondary">
                New Message
              </Link>
              <Link to="/dashboard/create-entry" className="btn btn-primary">
                New Entry
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="entity-card">
              <p className="pill">Messages</p>
              <h2 className="mt-2 text-3xl font-semibold">{messages.length}</h2>
              <p className="entity-meta">Direct messages to your people</p>
            </div>
            <div className="entity-card">
              <p className="pill">Posts</p>
              <h2 className="mt-2 text-3xl font-semibold">{entries.length}</h2>
              <p className="entity-meta">Your timeline posts and announcements</p>
            </div>
            <div className="entity-card">
              <p className="pill">Next post</p>
              <h2 className="mt-2 text-xl font-semibold">
                {canCreateEntry ? 'Ready now' : entries[0]?.nextEntryDate?.toLocaleDateString() || 'N/A'}
              </h2>
              <p className="entity-meta">When your next scheduled post unlocks</p>
            </div>
          </div>
        </section>

        <section className="mt-4">
          <div className="tab-row fade-up" style={{ animationDelay: '110ms' }}>
            <button
              onClick={() => setActiveTab('messages')}
              className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
              type="button"
            >
              Messages ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`tab-btn ${activeTab === 'entries' ? 'active' : ''}`}
              type="button"
            >
              Posts ({entries.length})
            </button>
          </div>
        </section>

        {activeTab === 'messages' && (
          <section className="panel panel-strong p-5 md:p-6 mt-4 float-in" style={{ animationDelay: '130ms' }}>
            <div className="section-head">
              <div>
                <h2 className="text-2xl">Private Messages</h2>
                <p className="section-subtitle">A private lane for birthdays, check-ins, and everything personal.</p>
              </div>
              <Link to="/dashboard/create-message" className="btn btn-primary">
                Create Message
              </Link>
            </div>

            <div className="card-list">
              {messages.length === 0 ? (
                <div className="empty-state">No messages yet. Create your first private note to get started.</div>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className="entity-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{message.title}</h3>
                        <p className="entity-meta">Type: {message.type}</p>
                        <p className="entity-meta">Created: {message.createdAt?.toLocaleDateString() || 'Recently'}</p>
                        <p className="entity-meta">
                          Recipients:{' '}
                          {message.recipientNames.length > 0
                            ? message.recipientNames.join(', ')
                            : message.recipientEmails.join(', ')}
                        </p>
                      </div>
                      <span className="pill">Saved</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'entries' && (
          <section className="panel panel-strong p-5 md:p-6 mt-4 float-in" style={{ animationDelay: '130ms' }}>
            <div className="section-head">
              <div>
                <h2 className="text-2xl">My Posts</h2>
                <p className="section-subtitle">Plan posts, then choose private-only or public on {SOAP_BOX_NAME}.</p>
              </div>
              {canCreateEntry ? (
                <Link to="/dashboard/create-entry" className="btn btn-primary">
                  Create Post
                </Link>
              ) : (
                <p className="entity-meta">Next post available: {entries[0]?.nextEntryDate?.toLocaleDateString() || 'N/A'}</p>
              )}
            </div>

            <div className="card-list">
              {entries.length === 0 ? (
                <div className="empty-state">No posts yet. Drop your first update and start your personal stream.</div>
              ) : (
                entries.map((entry) => (
                  <article key={entry.id} className="entity-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{entry.title}</h3>
                        <p className="entity-meta">Type: {entry.type}</p>
                        <p className="entity-meta">Visibility: {entry.isPublic ? 'Public' : 'Private'}</p>
                        <p className="entity-meta">Attribution: {entry.isAnonymous ? 'Anonymous' : 'Named'}</p>
                        <p className="entity-meta">
                          Created: {entry.createdAt?.toLocaleDateString() || 'Recently'} | Interval: {entry.entryInterval} days
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="pill">{entry.isPublic ? (entry.isAnonymous ? 'Public / Anonymous' : 'Public / Named') : 'Private'}</span>
                        <div className="button-row">
                          <Link to={`/dashboard/edit-entry/${entry.id}`} className="btn btn-ghost">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={deletingEntryId === entry.id}
                            onClick={() => void handleDeleteEntry(entry)}
                          >
                            {deletingEntryId === entry.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
