import { PrismaClient } from '@prisma/client'

declare global {
  var __globalPrisma: PrismaClient | undefined
}

// Force load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' })
}

/**
 * Enhanced database URL configuration with connection parameters
 * Supports both development and production environments
 * Adds connection pool limits to prevent exhaustion
 */
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('[Prisma] DATABASE_URL is not defined in environment variables')
    throw new Error('DATABASE_URL is required but not found in environment variables')
  }
  
  // Parse URL and add connection pool parameters
  const urlObj = new URL(url)
  
  // Add connection pool parameters if not already set
  if (!urlObj.searchParams.has('connection_limit')) {
    urlObj.searchParams.set('connection_limit', '8') // Reduced from default 15
  }
  if (!urlObj.searchParams.has('pool_timeout')) {
    urlObj.searchParams.set('pool_timeout', '8') // 8 seconds timeout
  }
  if (!urlObj.searchParams.has('connect_timeout')) {
    urlObj.searchParams.set('connect_timeout', '10') // 10 seconds to connect
  }
  
  // Log connection configuration (without credentials)
  console.log('[Prisma] Database configuration:', {
    host: urlObj.hostname,
    port: urlObj.port,
    database: urlObj.pathname,
    parameters: Object.fromEntries(urlObj.searchParams.entries())
  })
  
  return urlObj.toString()
}

/**
 * Enhanced Prisma configuration with production-ready connection management
 * - Connection pooling optimizations
 * - Enhanced logging for debugging
 * - Proper singleton pattern for development
 * - Connection pool limits to prevent exhaustion
 */
export const prisma = globalThis.__globalPrisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
        { level: 'info', emit: 'stdout' }
      ]
    : [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' }
      ],
  errorFormat: 'colorless'
})

// Enhanced logging for development debugging
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (process.env.DEBUG === 'true') {
      console.log('[Prisma Query]', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        timestamp: new Date(e.timestamp).toISOString()
      })
    }
  })
}

// Connection event logging for monitoring - Use process events for Prisma 5+
process.on('beforeExit', async () => {
  console.log('[Prisma] Disconnecting from database...')
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('[Prisma] Error during disconnect:', error)
  }
})

// Singleton pattern for development (prevents multiple instances)
if (process.env.NODE_ENV !== 'production') {
  globalThis.__globalPrisma = prisma
}

/**
 * Enhanced connection test with retry logic
 * Used for health checks and startup verification
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    // Use our retry logic for connection testing
    const { withRetry } = await import('@/lib/db-utils')
    
    await withRetry(
      async () => {
        await prisma.$queryRaw`SELECT 1 as connection_test`
      },
      {
        maxRetries: 2,
        baseDelay: 500,
        timeoutMs: 5000
      }
    )
    
    const latency = Date.now() - startTime
    console.log(`[Prisma] Connection test successful (${latency}ms)`)
    
    return { success: true, latency }
    
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error(`[Prisma] Connection test failed after ${latency}ms:`, errorMessage)
    
    return { 
      success: false, 
      latency, 
      error: errorMessage 
    }
  }
}

/**
 * Get current connection pool statistics
 * Useful for monitoring and debugging
 */
export async function getConnectionStats() {
  try {
    // Query connection statistics from PostgreSQL
    const stats = await prisma.$queryRaw<Array<{
      current_connections: number
      max_connections: number
      active_connections: number
      idle_connections: number
    }>>`
      SELECT 
        (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
        (SELECT setting::int FROM pg_settings WHERE name='max_connections') as max_connections,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active' AND datname = current_database()) as active_connections,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle' AND datname = current_database()) as idle_connections
    `
    
    if (stats.length > 0) {
      const stat = stats[0]
      const utilization = ((stat.current_connections / stat.max_connections) * 100).toFixed(1)
      
      console.log('[Prisma] Connection stats:', {
        current: stat.current_connections,
        max: stat.max_connections,
        active: stat.active_connections,
        idle: stat.idle_connections,
        utilization: `${utilization}%`
      })
      
      return {
        current_connections: stat.current_connections,
        max_connections: stat.max_connections,
        active_connections: stat.active_connections,
        idle_connections: stat.idle_connections,
        utilization_percent: parseFloat(utilization)
      }
    }
    
    return null
    
  } catch (error) {
    console.error('[Prisma] Failed to get connection stats:', error)
    return null
  }
}

/**
 * Graceful shutdown handler
 * Ensures proper connection cleanup
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('[Prisma] Database disconnected successfully')
  } catch (error) {
    console.error('[Prisma] Error during database disconnection:', error)
  }
}

// Export configured Prisma instance
export default prisma