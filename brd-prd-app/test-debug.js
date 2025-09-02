#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🐛 Starting Jest Debug Runner')
console.log('This will run Jest with comprehensive error catching and logging')

// Setup debug log
const debugLogPath = path.join(__dirname, 'jest-debug.log')

// Clear previous debug log
try {
  fs.writeFileSync(debugLogPath, `=== Jest Debug Runner Started at ${new Date().toISOString()} ===\n`)
} catch (err) {
  console.error('Could not initialize debug log:', err)
}

function logError(error, context) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] DEBUG RUNNER - ${context}:\n${error}\n\n`
  
  try {
    fs.appendFileSync(debugLogPath, logMessage)
    console.error(`❌ ${context}:`, error)
  } catch (logErr) {
    console.error('Failed to log error:', logErr)
    console.error('Original error:', error)
  }
}

// Setup global error handlers for the main process
process.on('uncaughtException', (error) => {
  logError(error.stack || error.message, 'MAIN_PROCESS_UNCAUGHT_EXCEPTION')
  console.error('🚨 Uncaught Exception in main process!')
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  logError(error.stack || error.message, 'MAIN_PROCESS_UNHANDLED_REJECTION')
  console.error('🚨 Unhandled Rejection in main process!')
})

// Run Jest with debug options
const jestArgs = [
  'jest',
  '--verbose',
  '--detectOpenHandles',
  '--forceExit',
  '--no-cache',
  '--runInBand', // Run tests serially to better isolate errors
  '--bail=1',    // Stop on first failure
  ...process.argv.slice(2) // Pass through any additional arguments
]

console.log('🚀 Running Jest with args:', jestArgs.join(' '))

const jestProcess = spawn('npx', jestArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: __dirname,
  shell: true, // Fix for Windows
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096 --trace-warnings'
  }
})

// Capture and log stdout
jestProcess.stdout.on('data', (data) => {
  const output = data.toString()
  process.stdout.write(output)
  
  // Log any error-looking output
  if (output.includes('FAIL') || output.includes('Error') || output.includes('Exception')) {
    logError(output, 'JEST_STDOUT_ERROR')
  }
})

// Capture and log stderr
jestProcess.stderr.on('data', (data) => {
  const error = data.toString()
  process.stderr.write(error)
  logError(error, 'JEST_STDERR')
  
  // Check for worker exceptions
  if (error.includes('worker encountered') || error.includes('child process exceptions')) {
    console.error('🎯 FOUND WORKER EXCEPTION!')
    logError(`WORKER EXCEPTION DETECTED:\n${error}`, 'WORKER_EXCEPTION_FOUND')
  }
})

// Handle Jest process events
jestProcess.on('error', (error) => {
  logError(error.stack || error.message, 'JEST_PROCESS_ERROR')
  console.error('🚨 Jest process error!')
})

jestProcess.on('exit', (code, signal) => {
  const exitInfo = `Exit code: ${code}, Signal: ${signal}`
  logError(exitInfo, 'JEST_PROCESS_EXIT')
  
  console.log(`\n📊 Jest Debug Runner finished`)
  console.log(`Exit code: ${code}`)
  console.log(`Signal: ${signal}`)
  
  if (code !== 0) {
    console.log(`\n📋 Check the debug log for details: ${debugLogPath}`)
    
    // Try to read and display the last few lines of the debug log
    try {
      const debugContent = fs.readFileSync(debugLogPath, 'utf8')
      const lines = debugContent.split('\n')
      const lastLines = lines.slice(-20).join('\n')
      console.log('\n🔍 Last 20 lines from debug log:')
      console.log('═'.repeat(50))
      console.log(lastLines)
      console.log('═'.repeat(50))
    } catch (err) {
      console.error('Could not read debug log:', err)
    }
  }
  
  process.exit(code)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, terminating Jest...')
  jestProcess.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, terminating Jest...')
  jestProcess.kill('SIGTERM')
})