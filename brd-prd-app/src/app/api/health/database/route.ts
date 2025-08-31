import { NextResponse } from 'next/server'
import { getConnectionStats, testDatabaseConnection } from '@/lib/prisma'
import { getDatabaseHealth } from '@/lib/db-utils'

export async function GET() {
  try {
    // Get comprehensive database health metrics
    const healthData = await getDatabaseHealth()
    
    // Test actual connection with retry logic
    const connectionTest = await testDatabaseConnection()
    
    // Get detailed connection statistics
    const connectionStats = await getConnectionStats()
    
    const response = {
      status: connectionTest.success ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      connection: {
        available: connectionTest.success,
        latency: connectionTest.latency,
        error: connectionTest.error
      },
      pool: connectionStats ? {
        current_connections: connectionStats.current_connections,
        max_connections: connectionStats.max_connections,
        active_connections: connectionStats.active_connections,
        idle_connections: connectionStats.idle_connections,
        utilization_percent: connectionStats.utilization_percent
      } : null,
      environment: {
        node_env: process.env.NODE_ENV,
        database_configured: !!process.env.DATABASE_URL,
        database_host: process.env.DATABASE_URL ? 
          new URL(process.env.DATABASE_URL).hostname : null
      }
    }
    
    // Return appropriate HTTP status based on health
    const httpStatus = connectionTest.success ? 200 : 503
    
    return NextResponse.json(response, { status: httpStatus })
    
  } catch (error) {
    console.error('[Health Check] Database health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: {
        available: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }, { status: 503 })
  }
}