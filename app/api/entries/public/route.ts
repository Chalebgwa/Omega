import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      where: { isPublic: true },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching public entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
