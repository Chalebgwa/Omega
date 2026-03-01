'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
}

interface Message {
  id: string
  title: string
  type: string
  createdAt: string
  recipients: { recipient: { name: string } }[]
}

interface Entry {
  id: string
  title: string
  type: string
  isPublic: boolean
  createdAt: string
  nextEntryDate: string | null
  entryInterval: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'messages' | 'entries'>('messages')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDashboardData(token)
  }, [router])

  const fetchDashboardData = async (token: string) => {
    try {
      const [messagesRes, entriesRes] = await Promise.all([
        fetch('/api/messages', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/entries', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        setMessages(messagesData.messages || [])
        if (messagesData.user) {
          setUser(messagesData.user)
        }
      }

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json()
        setEntries(entriesData.entries || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const canCreateEntry = () => {
    const lastEntry = entries[0]
    if (!lastEntry) return true
    if (!lastEntry.nextEntryDate) return true
    return new Date(lastEntry.nextEntryDate) <= new Date()
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
            <Link href="/dashboard" className="omega-brand">
              <span className="brand-dot" aria-hidden="true" />
              Omega
            </Link>
            <Link href="/public" className="nav-pill">
              Soap Box
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
        <section className="panel panel-strong p-5 md:p-6 fade-up">
          <div className="section-head mb-4">
            <div>
              <h1 className="section-title">Dashboard</h1>
              <p className="section-subtitle">Manage your private messages and scheduled journal entries.</p>
            </div>
            <div className="button-row">
              <Link href="/dashboard/create-message" className="btn btn-secondary">
                New Message
              </Link>
              <Link href="/dashboard/create-entry" className="btn btn-primary">
                New Entry
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="entity-card">
              <p className="pill">Messages</p>
              <h2 className="mt-2 text-3xl font-semibold">{messages.length}</h2>
              <p className="entity-meta">Private notes addressed to recipients</p>
            </div>
            <div className="entity-card">
              <p className="pill">Entries</p>
              <h2 className="mt-2 text-3xl font-semibold">{entries.length}</h2>
              <p className="entity-meta">Journal moments across your timeline</p>
            </div>
            <div className="entity-card">
              <p className="pill">Next entry</p>
              <h2 className="mt-2 text-xl font-semibold">
                {canCreateEntry()
                  ? 'Ready now'
                  : entries[0]?.nextEntryDate
                    ? new Date(entries[0].nextEntryDate).toLocaleDateString()
                    : 'N/A'}
              </h2>
              <p className="entity-meta">When your next timed journal entry unlocks</p>
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
              Journal Entries ({entries.length})
            </button>
          </div>
        </section>

        {activeTab === 'messages' && (
          <section className="panel panel-strong p-5 md:p-6 mt-4 float-in" style={{ animationDelay: '130ms' }}>
            <div className="section-head">
              <div>
                <h2 className="text-2xl">Private Messages</h2>
                <p className="section-subtitle">A direct line to the people you choose.</p>
              </div>
              <Link href="/dashboard/create-message" className="btn btn-primary">
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
                        <p className="entity-meta">Created: {new Date(message.createdAt).toLocaleDateString()}</p>
                        <p className="entity-meta">Recipients: {message.recipients.map((r) => r.recipient.name).join(', ')}</p>
                      </div>
                      <Link href={`/dashboard/messages/${message.id}`} className="btn btn-ghost">
                        View
                      </Link>
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
                <h2 className="text-2xl">Journal Entries</h2>
                <p className="section-subtitle">Recurring reflections with optional public sharing.</p>
              </div>
              {canCreateEntry() ? (
                <Link href="/dashboard/create-entry" className="btn btn-primary">
                  Create Entry
                </Link>
              ) : (
                <p className="entity-meta">
                  Next entry available:{' '}
                  {entries[0]?.nextEntryDate ? new Date(entries[0].nextEntryDate).toLocaleDateString() : 'N/A'}
                </p>
              )}
            </div>

            <div className="card-list">
              {entries.length === 0 ? (
                <div className="empty-state">No entries yet. Add your first journal note to begin the cadence.</div>
              ) : (
                entries.map((entry) => (
                  <article key={entry.id} className="entity-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{entry.title}</h3>
                        <p className="entity-meta">Type: {entry.type}</p>
                        <p className="entity-meta">Visibility: {entry.isPublic ? 'Public' : 'Private'}</p>
                        <p className="entity-meta">
                          Created: {new Date(entry.createdAt).toLocaleDateString()} | Interval: {entry.entryInterval} days
                        </p>
                      </div>
                      <Link href={`/dashboard/entries/${entry.id}`} className="btn btn-ghost">
                        View
                      </Link>
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
