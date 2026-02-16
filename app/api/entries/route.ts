import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const entries = await prisma.entry.findMany({
      where: { authorId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, type, isPublic, entryInterval, videoUrl } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    if (type === 'text' && !content) {
      return NextResponse.json({ error: 'Content is required for text entries' }, { status: 400 })
    }

    const interval = entryInterval || 30
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + interval)

    const entry = await prisma.entry.create({
      data: {
        title,
        content: content || '',
        type,
        isPublic: isPublic || false,
        videoUrl,
        authorId: payload.userId,
        entryInterval: interval,
        nextEntryDate: nextDate
      }
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
