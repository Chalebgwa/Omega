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
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/entries', {
          headers: { Authorization: `Bearer ${token}` }
        })
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                Omega
              </Link>
              <Link href="/public" className="text-gray-700 hover:text-gray-900">
                Soap Box
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your messages and journal entries</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('messages')}
              className={`${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
            >
              Messages ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`${
                activeTab === 'entries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
            >
              Journal Entries ({entries.length})
            </button>
          </nav>
        </div>

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Private Messages</h2>
              <Link
                href="/dashboard/create-message"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Message
              </Link>
            </div>
            <div className="grid gap-4">
              {messages.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                  No messages yet. Create your first message to get started.
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{message.title}</h3>
                        <p className="text-sm text-gray-600">
                          Type: {message.type} | Created: {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Recipients: {message.recipients.map(r => r.recipient.name).join(', ')}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/messages/${message.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Entries Tab */}
        {activeTab === 'entries' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Journal Entries</h2>
              {canCreateEntry() ? (
                <Link
                  href="/dashboard/create-entry"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Entry
                </Link>
              ) : (
                <div className="text-sm text-gray-600">
                  Next entry available: {entries[0]?.nextEntryDate ? new Date(entries[0].nextEntryDate).toLocaleDateString() : 'N/A'}
                </div>
              )}
            </div>
            <div className="grid gap-4">
              {entries.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                  No entries yet. Create your first journal entry.
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{entry.title}</h3>
                        <p className="text-sm text-gray-600">
                          Type: {entry.type} | {entry.isPublic ? 'Public' : 'Private'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Created: {new Date(entry.createdAt).toLocaleDateString()} | Interval: {entry.entryInterval} days
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/entries/${entry.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
