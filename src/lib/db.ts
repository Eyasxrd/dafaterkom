import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getPrismaClient = (): PrismaClient => {
  if (!globalForPrisma.prisma) {
    const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
    
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  }
  return globalForPrisma.prisma
}

export const prisma = getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
