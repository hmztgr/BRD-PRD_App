// Prevent Jest from running during Next.js development
if (process.env.NODE_ENV !== 'test' && process.argv.some(arg => arg.includes('next'))) {
  // Export minimal config that won't interfere with Next.js
  module.exports = {}
  return
}

const nextJest = require("next/jest")

const createJestConfig = nextJest({ dir: "./" })

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
  // Single worker to prevent child process exceptions
  maxWorkers: 1,
  testTimeout: 30000,
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$|@testing-library|@radix-ui|lucide-react))"
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/types.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}"
  ],
  clearMocks: true,
  restoreMocks: true,
  forceExit: true,
  detectOpenHandles: false,
  // Disable worker threads completely
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: false
    }
  }
}

module.exports = createJestConfig(config)
