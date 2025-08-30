const nextJest = require("next/jest")

const createJestConfig = nextJest({ dir: "./" })

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testEnvironmentOptions: {
    url: "http://localhost"
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/types.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}"
  ]
})
