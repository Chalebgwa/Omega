import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ENTRY_REACTION_TYPES,
  createEntryComment,
  deleteEntry,
  deleteEntryComment,
  fetchEntryComments,
  fetchEntryReactions,
  fetchPublicEntries,
  toggleEntryReaction,
} from '../lib/data'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'
import { renderMarkupToHtml } from '../lib/markup'
import type { Entry, EntryComment, EntryReactionType } from '../types/models'

const REACTION_LABELS: Record<EntryReactionType, string> = {
  love: 'Love',
  facts: 'Facts',
  wow: 'Wow',
  support: 'Support',
}

function makeEmptyReactionCounts(): Record<EntryReactionType, number> {
  return {
    love: 0,
    facts: 0,
    wow: 0,
    support: 0,
  }
}

function reactionTotal(counts: Record<EntryReactionType, number>): number {
  return ENTRY_REACTION_TYPES.reduce((total, reactionType) => total + (counts[reactionType] || 0), 0)
}

function formatDate(value: Date | null): string {
  return value ? value.toLocaleDateString() : 'Recently'
}

export function PublicPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [commentsByEntry, setCommentsByEntry] = useState<Record<string, EntryComment[]>>({})
  const [reactionCountsByEntry, setReactionCountsByEntry] = useState<Record<string, Record<EntryReactionType, number>>>({})
  const [userReactionByEntry, setUserReactionByEntry] = useState<Record<string, EntryReactionType | null>>({})
  const [commentDraftByEntry, setCommentDraftByEntry] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [reactingEntryId, setReactingEntryId] = useState<string | null>(null)
  const [commentingEntryId, setCommentingEntryId] = useState<string | null>(null)

  const overallReactionCounts = useMemo(() => {
    const totals = makeEmptyReactionCounts()
    Object.values(reactionCountsByEntry).forEach((counts) => {
      ENTRY_REACTION_TYPES.forEach((reactionType) => {
        totals[reactionType] += counts[reactionType] || 0
      })
    })
    return totals
  }, [reactionCountsByEntry])

  const totalComments = useMemo(
    () => Object.values(commentsByEntry).reduce((total, comments) => total + comments.length, 0),
    [commentsByEntry],
  )

  const totalReactions = useMemo(() => reactionTotal(overallReactionCounts), [overallReactionCounts])

  const hottestReaction = useMemo(() => {
    let topType: EntryReactionType | null = null
    let topValue = -1

    ENTRY_REACTION_TYPES.forEach((reactionType) => {
      const value = overallReactionCounts[reactionType] || 0
      if (value > topValue) {
        topType = reactionType
        topValue = value
      }
    })

    if (!topType || topValue <= 0) {
      return 'No reactions yet'
    }

    return `${REACTION_LABELS[topType]} (${topValue})`
  }, [overallReactionCounts])

  useEffect(() => {
    const load = async () => {
      try {
        setError('')
        setLoading(true)
        const nextEntries = await fetchPublicEntries()
        setEntries(nextEntries)

        const entryIds = nextEntries.map((entry) => entry.id)
        if (entryIds.length === 0) {
          setCommentsByEntry({})
          setReactionCountsByEntry({})
          setUserReactionByEntry({})
          return
        }

        const [comments, reactions] = await Promise.all([
          fetchEntryComments(entryIds),
          fetchEntryReactions(entryIds, user?.uid),
        ])

        setCommentsByEntry(comments)
        setReactionCountsByEntry(reactions.countsByEntry)
        setUserReactionByEntry(reactions.userReactionByEntry)
      } catch (err) {
        console.error('Failed to load public entries:', err)
        setError('Failed to load public entries.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user?.uid])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const removeEntryFromInteractionState = (entryId: string) => {
    setCommentsByEntry((prev) => {
      const next = { ...prev }
      delete next[entryId]
      return next
    })

    setReactionCountsByEntry((prev) => {
      const next = { ...prev }
      delete next[entryId]
      return next
    })

    setUserReactionByEntry((prev) => {
      const next = { ...prev }
      delete next[entryId]
      return next
    })

    setCommentDraftByEntry((prev) => {
      const next = { ...prev }
      delete next[entryId]
      return next
    })
  }

  const handleDeleteEntry = async (entry: Entry) => {
    const confirmed = window.confirm(`Delete "${entry.title}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingEntryId(entry.id)
    try {
      await deleteEntry(entry.id)
      setEntries((prev) => prev.filter((item) => item.id !== entry.id))
      removeEntryFromInteractionState(entry.id)
    } catch (err) {
      console.error('Failed to delete entry:', err)
      setError('Failed to delete post.')
    } finally {
      setDeletingEntryId(null)
    }
  }

  const handleToggleReaction = async (entryId: string, reactionType: EntryReactionType) => {
    if (!user) {
      navigate('/login')
      return
    }

    setReactingEntryId(entryId)
    const previousReaction = userReactionByEntry[entryId] ?? null
    const nextReaction = previousReaction === reactionType ? null : reactionType

    setUserReactionByEntry((prev) => ({ ...prev, [entryId]: nextReaction }))
    setReactionCountsByEntry((prev) => {
      const nextCounts = { ...makeEmptyReactionCounts(), ...(prev[entryId] ?? {}) }
      if (previousReaction) {
        nextCounts[previousReaction] = Math.max(0, nextCounts[previousReaction] - 1)
      }
      if (nextReaction) {
        nextCounts[nextReaction] += 1
      }
      return { ...prev, [entryId]: nextCounts }
    })

    try {
      await toggleEntryReaction({ entryId, reactionType, user, currentReaction: previousReaction })
    } catch (err) {
      console.error('Failed to update reaction:', err)
      setError('Failed to update reaction.')

      setUserReactionByEntry((prev) => ({ ...prev, [entryId]: previousReaction }))
      setReactionCountsByEntry((prev) => {
        const nextCounts = { ...makeEmptyReactionCounts(), ...(prev[entryId] ?? {}) }
        if (nextReaction) {
          nextCounts[nextReaction] = Math.max(0, nextCounts[nextReaction] - 1)
        }
        if (previousReaction) {
          nextCounts[previousReaction] += 1
        }
        return { ...prev, [entryId]: nextCounts }
      })
    } finally {
      setReactingEntryId(null)
    }
  }

  const handleCommentSubmit = async (entryId: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    const content = (commentDraftByEntry[entryId] ?? '').trim()
    if (!content) return

    setCommentingEntryId(entryId)
    try {
      const comment = await createEntryComment({
        entryId,
        content,
        author: user,
      })

      setCommentsByEntry((prev) => ({
        ...prev,
        [entryId]: [...(prev[entryId] ?? []), comment],
      }))

      setCommentDraftByEntry((prev) => ({ ...prev, [entryId]: '' }))
    } catch (err) {
      console.error('Failed to post comment:', err)
      setError('Failed to post comment.')
    } finally {
      setCommentingEntryId(null)
    }
  }

  const handleDeleteComment = async (entryId: string, commentId: string) => {
    const confirmed = window.confirm('Delete this comment?')
    if (!confirmed) return

    setDeletingCommentId(commentId)
    try {
      await deleteEntryComment(commentId)
      setCommentsByEntry((prev) => ({
        ...prev,
        [entryId]: (prev[entryId] ?? []).filter((comment) => comment.id !== commentId),
      }))
    } catch (err) {
      console.error('Failed to delete comment:', err)
      setError('Failed to delete comment.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <div className="omega-page">
      <header className="omega-shell">
        <nav className="omega-nav fade-up">
          <Link to="/" className="omega-brand">
            <span className="brand-dot" aria-hidden="true" />
            {APP_NAME}
          </Link>
          <div className="nav-links">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-pill">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost" type="button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="nav-pill">
                  Home
                </Link>
                <Link to="/login" className="nav-pill">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Join
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="omega-shell mt-5">
        <div className="section-head fade-up">
          <div>
            <span className="eyebrow">Community stream</span>
            <h1 className="section-title mt-2">{SOAP_BOX_NAME}</h1>
            <p className="section-subtitle">Hot takes, shout-outs, and stories from the {APP_NAME} community.</p>
          </div>
          <Link to="/dashboard/create-entry" className="btn btn-secondary">
            Create Soap Box Post
          </Link>
        </div>

        {!loading && entries.length > 0 && (
          <section className="panel p-4 md:p-5 fade-up" style={{ animationDelay: '70ms' }}>
            <div className="grid gap-3 md:grid-cols-4">
              <article className="entity-card">
                <p className="pill">Live Posts</p>
                <h2 className="mt-2 text-2xl font-semibold">{entries.length}</h2>
                <p className="entity-meta">active on {SOAP_BOX_NAME}</p>
              </article>
              <article className="entity-card">
                <p className="pill">Reactions</p>
                <h2 className="mt-2 text-2xl font-semibold">{totalReactions}</h2>
                <p className="entity-meta">community responses</p>
              </article>
              <article className="entity-card">
                <p className="pill">Comments</p>
                <h2 className="mt-2 text-2xl font-semibold">{totalComments}</h2>
                <p className="entity-meta">conversation depth</p>
              </article>
              <article className="entity-card">
                <p className="pill">Hottest vibe</p>
                <h2 className="mt-2 text-xl font-semibold">{hottestReaction}</h2>
                <p className="entity-meta">current top reaction</p>
              </article>
            </div>
          </section>
        )}

        {loading ? (
          <div className="panel p-10 text-center mt-4">
            <p className="section-subtitle text-base">Loading public entries...</p>
          </div>
        ) : error ? (
          <div className="notice-error mt-4">{error}</div>
        ) : entries.length === 0 ? (
          <div className="empty-state mt-4 float-in">
            <h2 className="text-2xl">No public posts yet.</h2>
            <p className="section-subtitle mt-2">Drop the first post on {SOAP_BOX_NAME} and kick off the conversation.</p>
          </div>
        ) : (
          <div className="stack mt-4">
            {entries.map((entry, index) => {
              const authorLabel = entry.isAnonymous ? 'Anonymous' : entry.authorName || 'Anonymous'
              const comments = commentsByEntry[entry.id] ?? []
              const counts = reactionCountsByEntry[entry.id] ?? makeEmptyReactionCounts()
              const selectedReaction = userReactionByEntry[entry.id] ?? null

              return (
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
                    By {authorLabel} | {formatDate(entry.createdAt)}
                  </p>

                  {user?.uid === entry.authorId && (
                    <div className="button-row mt-3">
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
                  )}

                  {entry.type === 'video' && entry.videoUrl ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-300/40 bg-white/70 p-2">
                      <video controls className="w-full rounded-xl">
                        <source src={entry.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div
                      className="markup-content mt-4 text-[0.98rem] text-slate-700"
                      dangerouslySetInnerHTML={{ __html: renderMarkupToHtml(entry.content) }}
                    />
                  )}

                  <section className="interaction-panel mt-4">
                    <div className="reaction-row">
                      {ENTRY_REACTION_TYPES.map((reactionType) => {
                        const active = selectedReaction === reactionType
                        return (
                          <button
                            key={reactionType}
                            type="button"
                            className={`reaction-btn ${active ? 'active' : ''}`}
                            onClick={() => void handleToggleReaction(entry.id, reactionType)}
                            disabled={reactingEntryId === entry.id}
                          >
                            {REACTION_LABELS[reactionType]} ({counts[reactionType] || 0})
                          </button>
                        )
                      })}
                    </div>

                    <p className="entity-meta mt-2">
                      {reactionTotal(counts)} reactions | {comments.length} comments
                    </p>

                    <div className="comment-stack mt-3">
                      {comments.length === 0 ? (
                        <p className="entity-meta">No comments yet. Start the conversation.</p>
                      ) : (
                        comments.map((comment) => (
                          <article key={comment.id} className="comment-card">
                            <div className="comment-head">
                              <p className="comment-author">{comment.authorName || 'Member'}</p>
                              <p className="entity-meta">{formatDate(comment.createdAt)}</p>
                            </div>
                            <p className="comment-content">{comment.content}</p>
                            {user?.uid === comment.authorId && (
                              <button
                                type="button"
                                className="comment-action"
                                disabled={deletingCommentId === comment.id}
                                onClick={() => void handleDeleteComment(entry.id, comment.id)}
                              >
                                {deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                          </article>
                        ))
                      )}
                    </div>

                    {user ? (
                      <form
                        className="comment-form mt-3"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void handleCommentSubmit(entry.id)
                        }}
                      >
                        <textarea
                          className="textarea comment-input"
                          rows={3}
                          placeholder="Add your comment..."
                          value={commentDraftByEntry[entry.id] ?? ''}
                          onChange={(event) =>
                            setCommentDraftByEntry((prev) => ({
                              ...prev,
                              [entry.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="button-row">
                          <button type="submit" className="btn btn-secondary" disabled={commentingEntryId === entry.id}>
                            {commentingEntryId === entry.id ? 'Posting...' : 'Post Comment'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="entity-meta mt-3">
                        <Link to="/login" className="inline-link">
                          Login
                        </Link>{' '}
                        to react, comment, and join the conversation.
                      </p>
                    )}
                  </section>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
