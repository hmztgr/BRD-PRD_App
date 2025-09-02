const fs = require('fs')
const path = require('path')

// Enhanced error logging with worker context
function logDebugError(error, context, workerId) {
  const timestamp = new Date().toISOString()
  const worker = workerId || process.env.JEST_WORKER_ID || 'main'
  const logMessage = `[${timestamp}] WORKER ${worker} - ${context}:\n${error.stack || error.message}\n\n`
  
  try {
    fs.appendFileSync(path.join(__dirname, 'jest-debug.log'), logMessage)
    console.error(`[Worker ${worker}] ${context}:`, error)
  } catch (logErr) {
    console.error('Failed to log debug error:', logErr)
    console.error('Original error:', error)
  }
}

// Clear the debug log at the start
try {
  fs.writeFileSync(path.join(__dirname, 'jest-debug.log'), `=== Jest Debug Session Started at ${new Date().toISOString()} ===\n`)
} catch (err) {
  console.error('Could not initialize debug log:', err)
}

console.log(`Jest Debug: Setting up error handlers in worker ${process.env.JEST_WORKER_ID || 'main'}`)

// Wrap all setup operations in try-catch
try {
  
  // Enhanced Jest setup error handling
  if (typeof beforeAll !== 'undefined') {
    beforeAll(() => {
      console.log(`Worker ${process.env.JEST_WORKER_ID || 'main'} starting tests`)
      
      // Add global error handlers
      process.on('uncaughtException', (error) => {
        logDebugError(error, 'UNCAUGHT_EXCEPTION', process.env.JEST_WORKER_ID)
        // Don't exit, let Jest handle it
      })
      
      process.on('unhandledRejection', (reason, promise) => {
        const error = reason instanceof Error ? reason : new Error(String(reason))
        logDebugError(error, `UNHANDLED_REJECTION at ${promise}`, process.env.JEST_WORKER_ID)
      })
      
      // Worker thread error handling
      if (typeof process.on === 'function') {
        process.on('exit', (code) => {
          logDebugError(new Error(`Process exiting with code ${code}`), 'PROCESS_EXIT', process.env.JEST_WORKER_ID)
        })
        
        process.on('SIGTERM', () => {
          logDebugError(new Error('Received SIGTERM'), 'SIGTERM', process.env.JEST_WORKER_ID)
        })
        
        process.on('SIGINT', () => {
          logDebugError(new Error('Received SIGINT'), 'SIGINT', process.env.JEST_WORKER_ID)
        })
      }
    })
    
    afterAll(() => {
      console.log(`Worker ${process.env.JEST_WORKER_ID || 'main'} finishing tests`)
      
      // Force cleanup
      try {
        if (global.gc) {
          global.gc()
        }
      } catch (e) {
        // Ignore GC errors
      }
      
      // Clean up any remaining timers
      try {
        const timers = require('timers')
        if (timers.clearImmediate) {
          // Clear any potential hanging immediates
        }
      } catch (e) {
        logDebugError(e, 'TIMER_CLEANUP', process.env.JEST_WORKER_ID)
      }
    })
  }

  // Wrap test functions to catch errors
  if (typeof global.test !== 'undefined') {
    const originalTest = global.test
    global.test = (name, fn, timeout) => {
      return originalTest(name, async (...args) => {
        try {
          console.log(`Starting test: ${name} in worker ${process.env.JEST_WORKER_ID || 'main'}`)
          const result = await fn(...args)
          console.log(`Completed test: ${name}`)
          return result
        } catch (error) {
          logDebugError(error, `TEST_ERROR: ${name}`, process.env.JEST_WORKER_ID)
          throw error
        }
      }, timeout)
    }
  }

  // Monitor memory usage
  if (typeof setInterval !== 'undefined') {
    let memoryInterval
    try {
      memoryInterval = setInterval(() => {
        const usage = process.memoryUsage()
        if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
          console.warn(`High memory usage in worker ${process.env.JEST_WORKER_ID || 'main'}:`, {
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(usage.external / 1024 / 1024)}MB`
          })
        }
      }, 5000)
      
      // Cleanup interval on exit
      process.on('beforeExit', () => {
        if (memoryInterval) {
          clearInterval(memoryInterval)
        }
      })
    } catch (e) {
      logDebugError(e, 'MEMORY_MONITOR_SETUP', process.env.JEST_WORKER_ID)
    }
  }

} catch (setupError) {
  logDebugError(setupError, 'JEST_DEBUG_SETUP', process.env.JEST_WORKER_ID)
}

console.log(`Jest Debug: Error handlers configured for worker ${process.env.JEST_WORKER_ID || 'main'}`)