const fs = require('fs')
const path = require('path')

// Error logging function
function logError(error, context) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] JEST CONFIG ERROR in ${context}:\n${error.stack || error.message}\n\n`
  
  try {
    fs.appendFileSync(path.join(__dirname, 'jest-debug.log'), logMessage)
    console.error(`Jest Config Error (${context}):`, error)
  } catch (logErr) {
    console.error('Failed to log error:', logErr)
    console.error('Original error:', error)
  }
}

try {
  const nextJest = require("next/jest")

  let createJestConfig
  try {
    createJestConfig = nextJest({ dir: "./" })
  } catch (error) {
    logError(error, 'nextJest initialization')
    throw error
  }

  const config = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
    testEnvironmentOptions: {
      url: "http://localhost"
    },
    testPathIgnorePatterns: [
      "<rootDir>/node_modules/",
      "<rootDir>/tests/"
    ],
    // Memory and performance optimizations
    maxWorkers: "50%",
    workerIdleMemoryLimit: "512MB",
    testTimeout: 10000,
    // Transform configuration - Removed problematic options
    transformIgnorePatterns: [
      "node_modules/(?!(.*\\.mjs$|@testing-library|@radix-ui|lucide-react))"
    ],
    collectCoverageFrom: [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/types.ts",
      "!src/**/*.stories.{js,jsx,ts,tsx}"
    ],
    // Prevent memory leaks
    clearMocks: true,
    restoreMocks: true,
    // Handle large files
    maxConcurrency: 5,
    // Error handling and debugging
    verbose: true,
    detectOpenHandles: true,
    forceExit: true,
    // Add custom error handlers
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "<rootDir>/jest.debug.js"]
  }

  try {
    module.exports = createJestConfig(config)
  } catch (error) {
    logError(error, 'createJestConfig execution')
    throw error
  }

} catch (error) {
  logError(error, 'main jest.config.js')
  
  // Fallback basic configuration if Next.js config fails
  module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "<rootDir>/jest.debug.js"],
    moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
    maxWorkers: 1, // Single worker for debugging
    testTimeout: 15000,
    verbose: true,
    detectOpenHandles: true,
    forceExit: true
  }
}
