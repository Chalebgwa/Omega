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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true }
    })

    const messages = await prisma.message.findMany({
      where: { authorId: payload.userId },
      include: {
        recipients: {
          include: {
            recipient: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ user, messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
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
    const { title, content, type, recipientEmails, videoUrl } = body

    if (!title || !type || !recipientEmails || recipientEmails.length === 0) {
      return NextResponse.json(
        { error: 'Title, type, and recipients are required' },
        { status: 400 }
      )
    }

    if (type === 'text' && !content) {
      return NextResponse.json({ error: 'Content is required for text messages' }, { status: 400 })
    }

    const recipients = await prisma.user.findMany({
      where: {
        email: { in: recipientEmails }
      }
    })

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        title,
        content: content || '',
        type,
        videoUrl,
        authorId: payload.userId,
        recipients: {
          create: recipients.map((recipient: { id: string }) => ({
            recipientId: recipient.id
          }))
        }
      },
      include: {
        recipients: {
          include: {
            recipient: true
          }
        }
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
