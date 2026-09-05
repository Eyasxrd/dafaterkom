import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For Electron app, we need to dynamically set the database path
const getDatabasePath = (): string => {
  // For web development - default path
  return 'file:./dev.db';
};

const getPrismaClient = (): PrismaClient => {
  if (!globalForPrisma.prisma) {
    const databaseUrl = process.env.DATABASE_URL || getDatabasePath();
    
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  return globalForPrisma.prisma;
};

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// For Electron: Initialize database in userData directory
export const initializeElectronDatabase = async (): Promise<void> => {
  if (typeof window !== 'undefined' && (window as any).electron) {
    try {
      const databasePath = await (window as any).electron.getDatabasePath();
      console.log('Database initialized at:', databasePath);
      
      // Update DATABASE_URL for subsequent calls
      process.env.DATABASE_URL = databasePath;
      
      // Recreate prisma client with new database path
      globalForPrisma.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    } catch (error) {
      console.error('Failed to initialize Electron database:', error);
    }
  }
};
