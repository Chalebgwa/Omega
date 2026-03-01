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
    <div className="omega-page">
      <header className="omega-shell">
        <nav className="omega-nav fade-up">
          <Link href="/" className="omega-brand">
            <span className="brand-dot" aria-hidden="true" />
            Omega
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-pill">
              Home
            </Link>
            <Link href="/login" className="nav-pill">
              Login
            </Link>
            <Link href="/register" className="btn btn-primary">
              Join
            </Link>
          </div>
        </nav>
      </header>

      <main className="omega-shell mt-5">
        <div className="section-head fade-up">
          <div>
            <span className="eyebrow">Community stream</span>
            <h1 className="section-title mt-2">Soap Box</h1>
            <p className="section-subtitle">Public thoughts and messages from the Omega community.</p>
          </div>
          <Link href="/dashboard/create-entry" className="btn btn-secondary">
            Create Public Entry
          </Link>
        </div>

        {loading ? (
          <div className="panel p-10 text-center mt-4">
            <p className="section-subtitle text-base">Loading public entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state mt-4 float-in">
            <h2 className="text-2xl">No public entries yet.</h2>
            <p className="section-subtitle mt-2">Publish the first message and set the tone for everyone else.</p>
          </div>
        ) : (
          <div className="stack mt-4">
            {entries.map((entry, index) => (
              <article
                key={entry.id}
                className="panel panel-strong p-5 md:p-6 float-in"
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl md:text-3xl font-semibold">{entry.title}</h2>
                  <span className="pill">{entry.type}</span>
                </div>

                <p className="entity-meta mt-2">
                  By {entry.author.name} | {new Date(entry.createdAt).toLocaleDateString()}
                </p>

                {entry.type === 'video' && entry.videoUrl ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-300/40 bg-white/70 p-2">
                    <video controls className="w-full rounded-xl">
                      <source src={entry.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-[0.98rem] text-slate-700">{entry.content}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
