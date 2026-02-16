'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Entry {
  id: string
  title: string
  content: string
  type: string
  videoUrl: string | null
  createdAt: string
  author: {
    name: string
  }
}

export default function PublicPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicEntries()
  }, [])

  const fetchPublicEntries = async () => {
    try {
      const response = await fetch('/api/entries/public')
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching public entries:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Omega
            </Link>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md">
                Home
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📢 Soap Box</h1>
          <p className="text-gray-600">Public thoughts and messages from our community</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No public entries yet</h2>
            <p className="text-gray-600">Be the first to share your thoughts with the world!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <article key={entry.id} className="bg-white p-6 rounded-lg shadow">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{entry.title}</h2>
                  <div className="flex items-center text-sm text-gray-600">
                    <span>By {entry.author.name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{entry.type}</span>
                  </div>
                </div>
                
                {entry.type === 'video' && entry.videoUrl ? (
                  <div className="mb-4">
                    <video controls className="w-full rounded-lg">
                      <source src={entry.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
