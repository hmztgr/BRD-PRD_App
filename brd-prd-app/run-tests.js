#!/usr/bin/env node

/**
 * Simple Test Runner for Jest
 * Bypasses binary permission issues by running Jest programmatically
 */

const jest = require('jest');
const path = require('path');

console.log('🧪 Starting Test Suite...\n');

// Configure Jest programmatically
const jestConfig = {
  // Use the project's Jest config
  projects: [process.cwd()],
  // Run tests in the src/__tests__ directory
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testMatch: ['**/src/__tests__/**/*.test.(ts|tsx|js|jsx)'],
  verbose: true,
  collectCoverage: false, // Disable coverage for faster runs
  maxWorkers: 1, // Run tests serially to avoid resource issues
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true,
};

// Run Jest programmatically
jest.runCLI(jestConfig, [process.cwd()])
  .then((results) => {
    const { success, numTotalTests, numPassedTests, numFailedTests } = results.results;
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Total Tests: ${numTotalTests}`);
    console.log(`Passed: ${numPassedTests}`);
    console.log(`Failed: ${numFailedTests}`);
    
    if (success) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Error running tests:', error);
    process.exit(1);
  });