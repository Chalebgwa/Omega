import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AppUserProfile, ContentType, Entry, EntryComment, EntryReactionType, Message } from '../types/models'

const usersRef = collection(db, 'users')
const messagesRef = collection(db, 'messages')
const entriesRef = collection(db, 'entries')
const entryCommentsRef = collection(db, 'entryComments')
const entryReactionsRef = collection(db, 'entryReactions')

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function chunkArray<T>(input: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size))
  }
  return chunks
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value
  if (value instanceof Timestamp) return value.toDate()
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

export const ENTRY_REACTION_TYPES: EntryReactionType[] = ['love', 'facts', 'wow', 'support']

function isEntryReactionType(value: unknown): value is EntryReactionType {
  return typeof value === 'string' && ENTRY_REACTION_TYPES.includes(value as EntryReactionType)
}

function emptyReactionCounts(): Record<EntryReactionType, number> {
  return {
    love: 0,
    facts: 0,
    wow: 0,
    support: 0,
  }
}

export async function ensureUserProfile(profile: AppUserProfile): Promise<void> {
  await setDoc(
    doc(db, 'users', profile.uid),
    {
      name: profile.name,
      email: normalizeEmail(profile.email),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getUserProfile(uid: string): Promise<AppUserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid: snap.id,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
  }
}

async function resolveRecipients(recipientEmails: string[]): Promise<AppUserProfile[]> {
  const normalized = [...new Set(recipientEmails.map(normalizeEmail).filter(Boolean))]
  if (normalized.length === 0) return []

  const buckets = chunkArray(normalized, 10)
  const usersByEmail = new Map<string, AppUserProfile>()

  for (const bucket of buckets) {
    const q = query(usersRef, where('email', 'in', bucket))
    const snapshot = await getDocs(q)
    snapshot.forEach((recipient) => {
      const data = recipient.data()
      const email = normalizeEmail(String(data.email ?? ''))
      if (!email) return
      usersByEmail.set(email, {
        uid: recipient.id,
        name: String(data.name ?? email),
        email,
      })
    })
  }

  return normalized
    .map((email) => usersByEmail.get(email))
    .filter((recipient): recipient is AppUserProfile => Boolean(recipient))
}

function mapMessage(id: string, data: Record<string, unknown>): Message {
  return {
    id,
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
    type: (data.type === 'video' ? 'video' : 'text') as ContentType,
    videoUrl: data.videoUrl ? String(data.videoUrl) : null,
    createdAt: toDate(data.createdAt),
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? ''),
    recipientIds: Array.isArray(data.recipientIds) ? data.recipientIds.map(String) : [],
    recipientNames: Array.isArray(data.recipientNames) ? data.recipientNames.map(String) : [],
    recipientEmails: Array.isArray(data.recipientEmails) ? data.recipientEmails.map(String) : [],
  }
}

function mapEntry(id: string, data: Record<string, unknown>): Entry {
  return {
    id,
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
    type: (data.type === 'video' ? 'video' : 'text') as ContentType,
    videoUrl: data.videoUrl ? String(data.videoUrl) : null,
    isPublic: Boolean(data.isPublic),
    isAnonymous: data.isAnonymous !== false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    nextEntryDate: toDate(data.nextEntryDate),
    entryInterval: Number(data.entryInterval ?? 30),
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? ''),
  }
}

function mapEntryComment(id: string, data: Record<string, unknown>): EntryComment {
  return {
    id,
    entryId: String(data.entryId ?? ''),
    content: String(data.content ?? ''),
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? 'Member'),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export async function fetchMyMessages(uid: string): Promise<Message[]> {
  const q = query(messagesRef, where('authorId', '==', uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => mapMessage(d.id, d.data()))
}

export async function fetchMyEntries(uid: string): Promise<Entry[]> {
  const q = query(entriesRef, where('authorId', '==', uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => mapEntry(d.id, d.data()))
}

export async function fetchPublicEntries(): Promise<Entry[]> {
  const q = query(entriesRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => mapEntry(d.id, d.data()))
}

export async function fetchEntryById(entryId: string): Promise<Entry | null> {
  const snapshot = await getDoc(doc(db, 'entries', entryId))
  if (!snapshot.exists()) return null
  return mapEntry(snapshot.id, snapshot.data())
}

export interface FetchEntryReactionsResult {
  countsByEntry: Record<string, Record<EntryReactionType, number>>
  userReactionByEntry: Record<string, EntryReactionType | null>
}

export interface CreateEntryCommentInput {
  entryId: string
  content: string
  author: AppUserProfile
}

export interface ToggleEntryReactionInput {
  entryId: string
  reactionType: EntryReactionType
  user: AppUserProfile
  currentReaction?: EntryReactionType | null
}

export async function fetchEntryComments(entryIds: string[]): Promise<Record<string, EntryComment[]>> {
  const distinctIds = [...new Set(entryIds.filter(Boolean))]
  const commentsByEntry: Record<string, EntryComment[]> = {}

  distinctIds.forEach((entryId) => {
    commentsByEntry[entryId] = []
  })

  if (distinctIds.length === 0) {
    return commentsByEntry
  }

  const chunks = chunkArray(distinctIds, 10)
  const snapshots = await Promise.all(chunks.map((chunk) => getDocs(query(entryCommentsRef, where('entryId', 'in', chunk)))))

  snapshots.forEach((snapshot) => {
    snapshot.forEach((commentDoc) => {
      const comment = mapEntryComment(commentDoc.id, commentDoc.data())
      if (!commentsByEntry[comment.entryId]) {
        commentsByEntry[comment.entryId] = []
      }
      commentsByEntry[comment.entryId].push(comment)
    })
  })

  Object.values(commentsByEntry).forEach((comments) => {
    comments.sort((a, b) => {
      const left = a.createdAt ? a.createdAt.getTime() : 0
      const right = b.createdAt ? b.createdAt.getTime() : 0
      return left - right
    })
  })

  return commentsByEntry
}

export async function fetchEntryReactions(entryIds: string[], currentUserId?: string): Promise<FetchEntryReactionsResult> {
  const distinctIds = [...new Set(entryIds.filter(Boolean))]
  const countsByEntry: Record<string, Record<EntryReactionType, number>> = {}
  const userReactionByEntry: Record<string, EntryReactionType | null> = {}

  distinctIds.forEach((entryId) => {
    countsByEntry[entryId] = emptyReactionCounts()
    userReactionByEntry[entryId] = null
  })

  if (distinctIds.length === 0) {
    return { countsByEntry, userReactionByEntry }
  }

  const chunks = chunkArray(distinctIds, 10)
  const snapshots = await Promise.all(chunks.map((chunk) => getDocs(query(entryReactionsRef, where('entryId', 'in', chunk)))))

  snapshots.forEach((snapshot) => {
    snapshot.forEach((reactionDoc) => {
      const data = reactionDoc.data()
      const entryId = String(data.entryId ?? '')
      const reactionType = isEntryReactionType(data.reactionType) ? data.reactionType : null
      if (!entryId || !reactionType) return

      if (!countsByEntry[entryId]) {
        countsByEntry[entryId] = emptyReactionCounts()
        userReactionByEntry[entryId] = null
      }

      countsByEntry[entryId][reactionType] += 1

      if (currentUserId && String(data.userId ?? '') === currentUserId) {
        userReactionByEntry[entryId] = reactionType
      }
    })
  })

  return { countsByEntry, userReactionByEntry }
}

export async function createEntryComment(input: CreateEntryCommentInput): Promise<EntryComment> {
  const entryId = input.entryId.trim()
  const content = input.content.trim()

  if (!entryId || !content) {
    throw new Error('Entry and comment content are required')
  }

  const commentRef = await addDoc(entryCommentsRef, {
    entryId,
    content,
    authorId: input.author.uid,
    authorName: input.author.name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const snapshot = await getDoc(commentRef)
  if (!snapshot.exists()) {
    throw new Error('Failed to create comment')
  }

  return mapEntryComment(snapshot.id, snapshot.data())
}

export async function deleteEntryComment(commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'entryComments', commentId))
}

function reactionDocId(entryId: string, userId: string): string {
  return `${entryId}_${userId}`
}

export async function toggleEntryReaction(input: ToggleEntryReactionInput): Promise<void> {
  const entryId = input.entryId.trim()
  if (!entryId) {
    throw new Error('Entry is required')
  }

  const reactionRef = doc(db, 'entryReactions', reactionDocId(entryId, input.user.uid))
  const currentReaction = input.currentReaction ?? null

  if (currentReaction === input.reactionType) {
    await deleteDoc(reactionRef)
    return
  }

  await setDoc(
    reactionRef,
    {
      entryId,
      userId: input.user.uid,
      userName: input.user.name,
      reactionType: input.reactionType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export interface CreateMessageInput {
  title: string
  content: string
  type: ContentType
  recipientEmails: string[]
  videoUrl?: string
  author: AppUserProfile
}

export async function createMessage(input: CreateMessageInput): Promise<void> {
  const title = input.title.trim()
  const type = input.type
  const content = input.content.trim()
  const recipients = await resolveRecipients(input.recipientEmails)

  if (!title || recipients.length === 0) {
    throw new Error('Title and at least one valid recipient are required')
  }
  if (type === 'text' && !content) {
    throw new Error('Message content is required for text messages')
  }
  if (type === 'video' && !input.videoUrl?.trim()) {
    throw new Error('Video URL is required for video messages')
  }

  await addDoc(messagesRef, {
    title,
    content: type === 'text' ? content : '',
    type,
    videoUrl: type === 'video' ? input.videoUrl?.trim() ?? null : null,
    authorId: input.author.uid,
    authorName: input.author.name,
    recipientIds: recipients.map((r) => r.uid),
    recipientNames: recipients.map((r) => r.name),
    recipientEmails: recipients.map((r) => r.email),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export interface CreateEntryInput {
  title: string
  content: string
  type: ContentType
  isPublic: boolean
  isAnonymous?: boolean
  entryInterval: number
  videoUrl?: string
  author: AppUserProfile
}

export interface UpdateEntryInput {
  title: string
  content: string
  type: ContentType
  isPublic: boolean
  isAnonymous?: boolean
  entryInterval: number
  videoUrl?: string
}

export async function createEntry(input: CreateEntryInput): Promise<void> {
  const title = input.title.trim()
  const type = input.type
  const content = input.content.trim()
  const interval = Number.isFinite(input.entryInterval) ? Math.max(1, Math.floor(input.entryInterval)) : 30

  if (!title) {
    throw new Error('Entry title is required')
  }
  if (type === 'text' && !content) {
    throw new Error('Entry content is required for text entries')
  }
  if (type === 'video' && !input.videoUrl?.trim()) {
    throw new Error('Video URL is required for video entries')
  }

  const nextEntryDate = new Date()
  nextEntryDate.setDate(nextEntryDate.getDate() + interval)

  await addDoc(entriesRef, {
    title,
    content: type === 'text' ? content : '',
    type,
    videoUrl: type === 'video' ? input.videoUrl?.trim() ?? null : null,
    isPublic: input.isPublic,
    isAnonymous: input.isAnonymous ?? true,
    entryInterval: interval,
    nextEntryDate: Timestamp.fromDate(nextEntryDate),
    authorId: input.author.uid,
    authorName: input.author.name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateEntry(entryId: string, input: UpdateEntryInput): Promise<void> {
  const title = input.title.trim()
  const type = input.type
  const content = input.content.trim()
  const interval = Number.isFinite(input.entryInterval) ? Math.max(1, Math.floor(input.entryInterval)) : 30

  if (!title) {
    throw new Error('Entry title is required')
  }
  if (type === 'text' && !content) {
    throw new Error('Entry content is required for text entries')
  }
  if (type === 'video' && !input.videoUrl?.trim()) {
    throw new Error('Video URL is required for video entries')
  }

  const nextEntryDate = new Date()
  nextEntryDate.setDate(nextEntryDate.getDate() + interval)

  await updateDoc(doc(db, 'entries', entryId), {
    title,
    content: type === 'text' ? content : '',
    type,
    videoUrl: type === 'video' ? input.videoUrl?.trim() ?? null : null,
    isPublic: input.isPublic,
    isAnonymous: input.isAnonymous ?? true,
    entryInterval: interval,
    nextEntryDate: Timestamp.fromDate(nextEntryDate),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'entries', entryId))
}
