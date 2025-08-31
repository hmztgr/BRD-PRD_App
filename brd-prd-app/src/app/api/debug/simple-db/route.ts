import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('[Simple DB Test] Creating Prisma client...')
    console.log('[Simple DB Test] DATABASE_URL configured:', !!process.env.DATABASE_URL)
    console.log('[Simple DB Test] DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...')
    
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    })
    
    console.log('[Simple DB Test] Attempting simple query...')
    
    // Simple test query with 10 second timeout
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as test, now() as timestamp`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ])
    
    const duration = Date.now() - startTime
    console.log('[Simple DB Test] Query successful:', result, `Duration: ${duration}ms`)
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      status: 'success',
      result,
      duration,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error('[Simple DB Test] Error:', {
      message: errorMessage,
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack?.substring(0, 300) : undefined,
      duration
    })
    
    return NextResponse.json({
      status: 'error',
      error: errorMessage,
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}