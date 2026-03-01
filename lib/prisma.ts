import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaLibSql({
  // Keep fallback aligned with `.env.example` so local dev works without extra setup.
  url: process.env.DATABASE_URL || 'file:./dev.db'
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
