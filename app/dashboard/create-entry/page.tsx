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
    videoUrl: ''
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          isPublic: formData.isPublic,
          entryInterval: parseInt(formData.entryInterval),
          videoUrl: formData.type === 'video' ? formData.videoUrl : null
        })
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Omega
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Journal Entry</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Entry Title *
            </label>
            <input
              type="text"
              id="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Entry Type *
            </label>
            <select
              id="type"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="text">Text</option>
              <option value="video">Video</option>
            </select>
          </div>

          {formData.type === 'text' ? (
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Entry Content *
              </label>
              <textarea
                id="content"
                required
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your journal entry here..."
              />
            </div>
          ) : (
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Video URL *
              </label>
              <input
                type="url"
                id="videoUrl"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a URL to your video file. You can upload videos to services like YouTube or Vimeo.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="entryInterval" className="block text-sm font-medium text-gray-700 mb-2">
              Next Entry Interval (days) *
            </label>
            <input
              type="number"
              id="entryInterval"
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.entryInterval}
              onChange={(e) => setFormData({ ...formData, entryInterval: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              How many days until you can add another entry? Default is 30 days.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Make this entry public (visible on Soap Box)
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Entry'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
