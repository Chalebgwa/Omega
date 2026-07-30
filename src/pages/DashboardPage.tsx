import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteEntry, fetchInboxMessages, fetchMyEntries, fetchMyMessages } from '../lib/data'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'
import { renderMarkupToHtml } from '../lib/markup'
import type { Entry, Message } from '../types/models'

type Tab = 'messages' | 'entries'
type MessageView = 'inbox' | 'sent'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sentMessages, setSentMessages] = useState<Message[]>([])
  const [inboxMessages, setInboxMessages] = useState<Message[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('messages')
  const [activeMessageView, setActiveMessageView] = useState<MessageView>('inbox')
  const lastLoadedUidRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) return

    // Avoid duplicate fetches/logs caused by React StrictMode double-invoking effects in dev.
    if (import.meta.env.DEV && lastLoadedUidRef.current === user.uid) {
      return
    }
    lastLoadedUidRef.current = user.uid

    const load = async () => {
      try {
        setError('')
        setLoading(true)

        const [sentResult, inboxResult, entriesResult] = await Promise.allSettled([
          fetchMyMessages(user.uid),
          fetchInboxMessages(user.uid),
          fetchMyEntries(user.uid),
        ])

        const notices: string[] = []

        if (sentResult.status === 'fulfilled') {
          setSentMessages(sentResult.value)
        } else {
          console.error('Failed to load sent messages:', sentResult.reason)
          notices.push('Sent messages could not be loaded.')
        }

        if (inboxResult.status === 'fulfilled') {
          setInboxMessages(inboxResult.value)
        } else {
          console.error('Failed to load inbox messages:', inboxResult.reason)
          const reason = inboxResult.reason as { code?: string } | undefined
          if (reason?.code === 'permission-denied') {
            notices.push('Inbox is unavailable due to Firestore permissions. Deploy the latest rules/indexes.')
          } else {
            notices.push('Inbox messages could not be loaded.')
          }
        }

        if (entriesResult.status === 'fulfilled') {
          setEntries(entriesResult.value)
        } else {
          console.error('Failed to load entries:', entriesResult.reason)
          notices.push('Posts could not be loaded.')
        }

        setError(notices.join(' '))
      } catch (err) {
        console.error('Unexpected dashboard load failure:', err)
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

  const totalMessages = sentMessages.length + inboxMessages.length

  const visibleMessages = activeMessageView === 'inbox' ? inboxMessages : sentMessages

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
              <h2 className="mt-2 text-3xl font-semibold">{totalMessages}</h2>
              <p className="entity-meta">Inbox: {inboxMessages.length} | Sent: {sentMessages.length}</p>
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
              Messages ({totalMessages})
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
                <p className="section-subtitle">
                  {activeMessageView === 'inbox'
                    ? 'Messages you received from other members.'
                    : 'Messages you have sent to other members.'}
                </p>
              </div>
              <Link to="/dashboard/create-message" className="btn btn-primary">
                Create Message
              </Link>
            </div>

            <div className="tab-row mb-4">
              <button
                type="button"
                className={`tab-btn ${activeMessageView === 'inbox' ? 'active' : ''}`}
                onClick={() => setActiveMessageView('inbox')}
              >
                Inbox ({inboxMessages.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeMessageView === 'sent' ? 'active' : ''}`}
                onClick={() => setActiveMessageView('sent')}
              >
                Sent ({sentMessages.length})
              </button>
            </div>

            <div className="card-list">
              {visibleMessages.length === 0 ? (
                <div className="empty-state">
                  {activeMessageView === 'inbox'
                    ? 'Your inbox is empty. Messages sent to you will appear here.'
                    : 'No sent messages yet. Create your first private note to get started.'}
                </div>
              ) : (
                visibleMessages.map((message) => (
                  <article key={message.id} className="entity-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{message.title}</h3>
                        <p className="entity-meta">Type: {message.type}</p>
                        <p className="entity-meta">Created: {message.createdAt?.toLocaleDateString() || 'Recently'}</p>
                        {activeMessageView === 'inbox' ? (
                          <p className="entity-meta">From: {message.authorName || 'Member'}</p>
                        ) : (
                          <p className="entity-meta">
                            To:{' '}
                            {message.recipientNames.length > 0
                              ? message.recipientNames.join(', ')
                              : message.recipientEmails.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="pill">{activeMessageView === 'inbox' ? 'Incoming' : 'Sent'}</span>
                    </div>

                    {message.type === 'video' && message.videoUrl ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-300/40 bg-white/70 p-2">
                        <video controls className="w-full rounded-xl" src={message.videoUrl}>
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <div
                        className="markup-content mt-4 text-[0.95rem] text-slate-700"
                        dangerouslySetInnerHTML={{ __html: renderMarkupToHtml(message.content) }}
                      />
                    )}
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
