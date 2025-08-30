import { PrismaClient } from '@prisma/client'

declare global {
  var __globalPrisma: PrismaClient | undefined
}

// Force load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' })
}

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not defined in environment variables')
    throw new Error('DATABASE_URL is required but not found in environment variables')
  }
  return url
}

export const prisma = globalThis.__globalPrisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__globalPrisma = prisma
}