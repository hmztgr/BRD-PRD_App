/**
 * Database Utilities - Production-Ready Connection Management
 * Provides retry logic, timeout protection, and connection monitoring
 */

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  timeoutMs?: number
  onRetry?: (error: any, attempt: number) => void
}

interface ConnectionMetrics {
  attempt: number
  startTime: number
  endTime?: number
  success: boolean
  error?: string
  retryCount: number
}

// Global metrics storage for monitoring
const connectionMetrics: ConnectionMetrics[] = []
const MAX_METRICS_HISTORY = 1000

/**
 * Production-ready retry wrapper with exponential backoff and jitter
 * Handles transient database connection failures gracefully
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeoutMs = 30000,
    onRetry
  } = options

  const startTime = Date.now()
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptStartTime = Date.now()
    
    try {
      // Wrap operation with timeout protection
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
      )
      
      const result = await Promise.race([operation(), timeoutPromise])
      
      // Record successful attempt
      recordConnectionMetric({
        attempt: attempt + 1,
        startTime: attemptStartTime,
        endTime: Date.now(),
        success: true,
        retryCount: attempt
      })
      
      if (attempt > 0) {
        console.log(`[DB Utils] Operation succeeded on attempt ${attempt + 1}/${maxRetries + 1}`)
      }
      
      return result as T
      
    } catch (error) {
      lastError = error
      const attemptEndTime = Date.now()
      
      // Record failed attempt
      recordConnectionMetric({
        attempt: attempt + 1,
        startTime: attemptStartTime,
        endTime: attemptEndTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        retryCount: attempt
      })
      
      console.error(`[DB Utils] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, {
        error: error instanceof Error ? error.message : error,
        code: (error as any)?.code,
        duration: attemptEndTime - attemptStartTime,
        willRetry: attempt < maxRetries
      })
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Call retry callback if provided
      if (onRetry) {
        try {
          onRetry(error, attempt + 1)
        } catch (callbackError) {
          console.warn('[DB Utils] Retry callback error:', callbackError)
        }
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      const jitter = Math.random() * 0.3 * exponentialDelay // 30% jitter
      const delay = Math.floor(exponentialDelay + jitter)
      
      console.log(`[DB Utils] Retrying in ${delay}ms (attempt ${attempt + 2}/${maxRetries + 1})`)
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // All attempts failed
  const totalDuration = Date.now() - startTime
  console.error(`[DB Utils] All ${maxRetries + 1} attempts failed after ${totalDuration}ms`, {
    finalError: lastError instanceof Error ? lastError.message : lastError,
    totalDuration
  })
  
  throw lastError
}

/**
 * Record connection attempt metrics for monitoring
 */
function recordConnectionMetric(metric: ConnectionMetrics) {
  connectionMetrics.unshift(metric)
  
  // Keep only recent metrics
  if (connectionMetrics.length > MAX_METRICS_HISTORY) {
    connectionMetrics.splice(MAX_METRICS_HISTORY)
  }
}

/**
 * Get connection metrics for monitoring dashboard
 */
export function getConnectionMetrics(limit: number = 100) {
  const recent = connectionMetrics.slice(0, limit)
  
  if (recent.length === 0) {
    return {
      total: 0,
      success: 0,
      failure: 0,
      successRate: 0,
      averageResponseTime: 0,
      retryRate: 0,
      recentMetrics: []
    }
  }
  
  const successful = recent.filter(m => m.success)
  const failed = recent.filter(m => !m.success)
  const withRetries = recent.filter(m => m.retryCount > 0)
  
  const responseTimes = recent
    .filter(m => m.endTime)
    .map(m => m.endTime! - m.startTime)
  
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0
  
  return {
    total: recent.length,
    success: successful.length,
    failure: failed.length,
    successRate: (successful.length / recent.length) * 100,
    averageResponseTime: Math.round(averageResponseTime),
    retryRate: (withRetries.length / recent.length) * 100,
    recentMetrics: recent.slice(0, 10).map(m => ({
      timestamp: new Date(m.startTime).toISOString(),
      success: m.success,
      duration: m.endTime ? m.endTime - m.startTime : null,
      error: m.error,
      retryCount: m.retryCount
    }))
  }
}

/**
 * Enhanced database availability check with retry logic
 * Replaces the basic check in fallback-auth.ts
 */
export async function checkDatabaseAvailability(
  retryCount: number = 3
): Promise<boolean> {
  console.log('[DB Utils] Starting database availability check...')
  
  try {
    const result = await withRetry(
      async () => {
        const { prisma } = await import('@/lib/prisma')
        await prisma.$queryRaw`SELECT 1 as test`
        return true
      },
      {
        maxRetries: retryCount - 1, // withRetry counts initial attempt as 0
        baseDelay: 1000,
        maxDelay: 4000,
        timeoutMs: 10000,
        onRetry: (error, attempt) => {
          console.log(`[DB Utils] Database check retry ${attempt}, error:`, error.message)
        }
      }
    )
    
    console.log('[DB Utils] Database availability check passed')
    return result
    
  } catch (error) {
    console.error('[DB Utils] Database availability check failed after all retries:', {
      error: error instanceof Error ? error.message : error,
      code: (error as any)?.code,
      retryCount
    })
    return false
  }
}

/**
 * Circuit breaker pattern for database operations
 * Prevents cascading failures by temporarily disabling operations
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private readonly failureThreshold = 5,
    private readonly timeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
        console.log('[Circuit Breaker] Attempting half-open state')
      } else {
        throw new Error('Circuit breaker is OPEN - database operations temporarily disabled')
      }
    }
    
    try {
      const result = await operation()
      
      // Success - reset circuit breaker
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failures = 0
        console.log('[Circuit Breaker] Reset to CLOSED state')
      }
      
      return result
      
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN'
        console.error(`[Circuit Breaker] OPENED after ${this.failures} failures`)
      }
      
      throw error
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Global circuit breaker instance
export const databaseCircuitBreaker = new CircuitBreaker()

/**
 * Wrapper for critical database operations with circuit breaker
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>
): Promise<T> {
  return databaseCircuitBreaker.execute(operation)
}

/**
 * Health check for monitoring endpoints
 */
export async function getDatabaseHealth() {
  const metrics = getConnectionMetrics(50)
  const circuitState = databaseCircuitBreaker.getState()
  
  const isHealthy = 
    metrics.successRate >= 95 && // 95%+ success rate
    circuitState.state !== 'OPEN' && // Circuit breaker not open
    metrics.averageResponseTime < 1000 // <1s average response
  
  return {
    status: isHealthy ? 'healthy' : 'degraded',
    metrics: {
      ...metrics,
      circuitBreaker: circuitState
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * Enhanced error classification for better debugging
 */
export function classifyDatabaseError(error: any): {
  type: 'connection' | 'timeout' | 'query' | 'unknown'
  isRetriable: boolean
  severity: 'low' | 'medium' | 'high'
} {
  const message = error?.message?.toLowerCase() || ''
  const code = error?.code
  
  // Connection errors (retriable)
  if (
    message.includes('econnrefused') ||
    message.includes('connection refused') ||
    message.includes('connect timeout') ||
    code === 'ECONNREFUSED'
  ) {
    return { type: 'connection', isRetriable: true, severity: 'medium' }
  }
  
  // Timeout errors (retriable)
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    code === 'ETIMEDOUT'
  ) {
    return { type: 'timeout', isRetriable: true, severity: 'medium' }
  }
  
  // Query errors (usually not retriable)
  if (
    message.includes('syntax error') ||
    message.includes('relation') ||
    message.includes('column') ||
    code?.startsWith('P')
  ) {
    return { type: 'query', isRetriable: false, severity: 'high' }
  }
  
  // Unknown errors (retriable with caution)
  return { type: 'unknown', isRetriable: true, severity: 'low' }
}