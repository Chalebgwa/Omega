export type ContentType = 'text' | 'video'
export type EntryReactionType = 'love' | 'facts' | 'wow' | 'support'

export interface AppUserProfile {
  uid: string
  name: string
  email: string
}

export interface Message {
  id: string
  title: string
  content: string
  type: ContentType
  videoUrl: string | null
  createdAt: Date | null
  authorId: string
  authorName: string
  recipientIds: string[]
  recipientNames: string[]
  recipientEmails: string[]
}

export interface Entry {
  id: string
  title: string
  content: string
  type: ContentType
  videoUrl: string | null
  isPublic: boolean
  isAnonymous: boolean
  createdAt: Date | null
  updatedAt: Date | null
  nextEntryDate: Date | null
  entryInterval: number
  authorId: string
  authorName: string
}

export interface EntryComment {
  id: string
  entryId: string
  content: string
  authorId: string
  authorName: string
  createdAt: Date | null
  updatedAt: Date | null
}
