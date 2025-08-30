#!/usr/bin/env node

/**
 * Comprehensive Admin Authentication Validation Suite
 * Tests all aspects of the admin system including login, authorization, and security
 */

const { spawn } = require('child_process');
const { promisify } = require('util');
// Use Node.js built-in fetch (available in Node 18+)
const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@smartdocs.ai';
const ADMIN_PASSWORD = 'admin123';

class AdminAuthTester {
  constructor() {
    this.results = [];
    this.sessionCookies = '';
    this.authToken = '';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.results.push(logEntry);
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${type.toUpperCase()}: ${message}${colors.reset}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkServerRunning() {
    try {
      const response = await fetch(`${BASE_URL}/api/debug/session`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async makeRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.sessionCookies,
        ...options.headers
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, finalOptions);
      
      // Extract cookies from response
      const setCookie = response.headers.raw()['set-cookie'];
      if (setCookie) {
        this.sessionCookies = setCookie.join('; ');
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: await response.json().catch(() => ({})),
        text: await response.text().catch(() => '')
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error.message
      };
    }
  }

  async testServerAvailability() {
    this.log('Testing server availability...');
    
    const isRunning = await this.checkServerRunning();
    if (!isRunning) {
      this.log('Server is not running on localhost:3000', 'error');
      this.log('Please start the server with: npm run dev', 'warning');
      return false;
    }
    
    this.log('Server is running and responsive', 'success');
    return true;
  }

  async testDebugEndpoint() {
    this.log('Testing debug session endpoint...');
    
    const response = await this.makeRequest(`${BASE_URL}/api/debug/session`);
    
    if (response.ok) {
      this.log('Debug endpoint accessible', 'success');
      this.log(`Session data: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      this.log(`Debug endpoint failed: ${response.status} ${response.statusText}`, 'error');
      return false;
    }
  }

  async testAdminLogin() {
    this.log('Testing admin login process...');
    
    // First, get the CSRF token from the sign-in page
    const signInPageResponse = await this.makeRequest(`${BASE_URL}/en/auth/signin`);
    
    if (!signInPageResponse.ok) {
      this.log(`Failed to access sign-in page: ${signInPageResponse.status}`, 'error');
      return false;
    }

    // Attempt to sign in with admin credentials
    const loginData = {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      redirect: false
    };

    const loginResponse = await this.makeRequest(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      body: JSON.stringify(loginData)
    });

    if (loginResponse.ok || loginResponse.status === 302) {
      this.log('Admin login successful', 'success');
      this.log(`Login response: ${JSON.stringify(loginResponse.data, null, 2)}`);
      return true;
    } else {
      this.log(`Admin login failed: ${loginResponse.status} ${loginResponse.statusText}`, 'error');
      this.log(`Response: ${JSON.stringify(loginResponse.data, null, 2)}`);
      return false;
    }
  }

  async testSessionCreation() {
    this.log('Testing session creation after login...');
    
    const sessionResponse = await this.makeRequest(`${BASE_URL}/api/debug/session`);
    
    if (sessionResponse.ok && sessionResponse.data.hasSession) {
      this.log('Session created successfully', 'success');
      this.log(`User role: ${sessionResponse.data.session?.user?.role}`);
      this.log(`Admin permissions: ${JSON.stringify(sessionResponse.data.session?.user?.adminPermissions)}`);
      return true;
    } else {
      this.log('Session not created or invalid', 'error');
      return false;
    }
  }

  async testAdminPanelAccess() {
    this.log('Testing admin panel access...');
    
    const adminResponse = await this.makeRequest(`${BASE_URL}/en/admin`);
    
    if (adminResponse.ok) {
      this.log('Admin panel accessible', 'success');
      return true;
    } else if (adminResponse.status === 302 || adminResponse.status === 307) {
      this.log('Redirected from admin panel - checking redirect location', 'warning');
      const location = adminResponse.headers.get('location');
      this.log(`Redirect location: ${location}`);
      
      if (location && location.includes('/auth/signin')) {
        this.log('Redirected to sign-in (authentication required)', 'error');
        return false;
      } else {
        this.log('Redirected but not to sign-in page', 'warning');
        return false;
      }
    } else {
      this.log(`Admin panel access failed: ${adminResponse.status}`, 'error');
      return false;
    }
  }

  async testAdminAPI() {
    this.log('Testing admin API endpoints...');
    
    const apiEndpoints = [
      '/api/admin/analytics/users',
      '/api/admin/analytics/system',
      '/api/admin/activity'
    ];

    let allPassed = true;

    for (const endpoint of apiEndpoints) {
      const response = await this.makeRequest(`${BASE_URL}${endpoint}`);
      
      if (response.ok) {
        this.log(`API endpoint ${endpoint} accessible`, 'success');
      } else if (response.status === 401) {
        this.log(`API endpoint ${endpoint} requires authentication (401)`, 'error');
        allPassed = false;
      } else if (response.status === 403) {
        this.log(`API endpoint ${endpoint} forbidden (403) - insufficient permissions`, 'error');
        allPassed = false;
      } else {
        this.log(`API endpoint ${endpoint} failed: ${response.status}`, 'error');
        allPassed = false;
      }
    }

    return allPassed;
  }

  async testNonAdminUserBlocking() {
    this.log('Testing non-admin user blocking...');
    
    // Clear session cookies to simulate non-admin user
    const originalCookies = this.sessionCookies;
    this.sessionCookies = '';

    const adminResponse = await this.makeRequest(`${BASE_URL}/en/admin`);
    
    if (adminResponse.status === 302 || adminResponse.status === 307) {
      const location = adminResponse.headers.get('location');
      if (location && location.includes('/auth/signin')) {
        this.log('Non-authenticated users properly blocked from admin area', 'success');
        this.sessionCookies = originalCookies; // Restore cookies
        return true;
      }
    }
    
    this.log('Non-admin user blocking may not be working properly', 'warning');
    this.sessionCookies = originalCookies; // Restore cookies
    return false;
  }

  async testMiddlewareSecurity() {
    this.log('Testing middleware security...');
    
    // Test direct API access without authentication
    this.sessionCookies = '';
    
    const secureEndpoints = [
      '/api/admin/analytics/users',
      '/api/admin/analytics/system'
    ];

    let allSecure = true;

    for (const endpoint of secureEndpoints) {
      const response = await this.makeRequest(`${BASE_URL}${endpoint}`);
      
      if (response.status === 401 || response.status === 403) {
        this.log(`Endpoint ${endpoint} properly secured (${response.status})`, 'success');
      } else {
        this.log(`Endpoint ${endpoint} may not be properly secured: ${response.status}`, 'warning');
        allSecure = false;
      }
    }

    return allSecure;
  }

  async testCurlCommands() {
    this.log('Testing with curl commands...');
    
    const curlTests = [
      {
        name: 'Test session endpoint',
        command: `curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/debug/session"`
      },
      {
        name: 'Test admin panel redirect',
        command: `curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/en/admin"`
      },
      {
        name: 'Test admin API security',
        command: `curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/admin/analytics/users"`
      }
    ];

    for (const test of curlTests) {
      try {
        const result = await this.executeCurl(test.command);
        this.log(`${test.name}: HTTP ${result}`, result === '200' ? 'success' : 'warning');
      } catch (error) {
        this.log(`${test.name} failed: ${error.message}`, 'error');
      }
    }
  }

  async executeCurl(command) {
    return new Promise((resolve, reject) => {
      const process = spawn('sh', ['-c', command]);
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  async generateReport() {
    const report = {
      testSuite: 'Admin Authentication Validation',
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.type === 'success').length,
        failed: this.results.filter(r => r.type === 'error').length,
        warnings: this.results.filter(r => r.type === 'warning').length
      },
      results: this.results
    };

    const reportPath = path.join(__dirname, '..', 'admin-auth-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report generated: ${reportPath}`, 'info');
    
    // Console summary
    console.log('\n' + '='.repeat(60));
    console.log('ADMIN AUTHENTICATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`\x1b[32mPassed: ${report.summary.passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${report.summary.failed}\x1b[0m`);
    console.log(`\x1b[33mWarnings: ${report.summary.warnings}\x1b[0m`);
    console.log('='.repeat(60));
    
    return report;
  }

  async runAllTests() {
    this.log('Starting comprehensive admin authentication validation...', 'info');
    
    try {
      // Test 1: Server availability
      if (!await this.testServerAvailability()) {
        this.log('Server not available - stopping tests', 'error');
        return;
      }

      // Test 2: Debug endpoint
      await this.testDebugEndpoint();

      // Test 3: Admin login
      await this.testAdminLogin();

      // Test 4: Session creation
      await this.testSessionCreation();

      // Test 5: Admin panel access
      await this.testAdminPanelAccess();

      // Test 6: Admin API endpoints
      await this.testAdminAPI();

      // Test 7: Non-admin blocking
      await this.testNonAdminUserBlocking();

      // Test 8: Middleware security
      await this.testMiddlewareSecurity();

      // Test 9: Curl commands
      await this.testCurlCommands();

      // Generate final report
      await this.generateReport();
      
    } catch (error) {
      this.log(`Test suite failed with error: ${error.message}`, 'error');
      console.error(error);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AdminAuthTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AdminAuthTester;