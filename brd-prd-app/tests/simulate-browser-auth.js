const http = require('http');
const https = require('https');
const { URL } = require('url');
const querystring = require('querystring');

/**
 * Simple browser authentication simulation
 * This simulates a complete browser session for admin authentication testing
 */
class BrowserAuthSimulator {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.cookies = new Map();
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  // Helper to make HTTP requests with cookie support
  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseURL);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          ...this.headers,
          ...options.headers
        }
      };

      // Add cookies to request
      if (this.cookies.size > 0) {
        const cookieString = Array.from(this.cookies.entries())
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        requestOptions.headers['Cookie'] = cookieString;
      }

      console.log(`🌐 ${options.method || 'GET'} ${url.toString()}`);
      
      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        
        // Process cookies from response
        if (res.headers['set-cookie']) {
          res.headers['set-cookie'].forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            this.cookies.set(name.trim(), value);
            console.log(`🍪 Cookie set: ${name.trim()}=${value?.substring(0, 20)}...`);
          });
        }

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            cookies: this.cookies
          });
        });
      });

      req.on('error', reject);
      
      if (options.data) {
        req.write(options.data);
      }
      
      req.end();
    });
  }

  // Extract CSRF token from HTML
  extractCSRFToken(html) {
    const csrfMatch = html.match(/name="csrfToken"[^>]*value="([^"]*)"/);
    return csrfMatch ? csrfMatch[1] : null;
  }

  // Extract form action URL
  extractFormAction(html) {
    const actionMatch = html.match(/<form[^>]*action="([^"]*)"/);
    return actionMatch ? actionMatch[1] : '/api/auth/callback/credentials';
  }

  // Simulate complete browser authentication flow
  async simulateAdminLogin(email, password) {
    console.log('🚀 Starting browser authentication simulation...');
    console.log('=====================================');
    
    try {
      // Step 1: Get signin page
      console.log('📍 Step 1: Loading signin page');
      const signinResponse = await this.makeRequest('/en/auth/signin');
      console.log(`✓ Signin page loaded: ${signinResponse.statusCode}`);
      
      if (signinResponse.statusCode !== 200) {
        console.log('⚠️  Signin page returned non-200 status, but continuing...');
      }

      // Step 2: Extract CSRF token
      console.log('📍 Step 2: Extracting CSRF token');
      const csrfToken = this.extractCSRFToken(signinResponse.body);
      console.log(csrfToken ? `✓ CSRF token found: ${csrfToken.substring(0, 20)}...` : '⚠️  No CSRF token found');

      // Step 3: Get fresh CSRF token from API
      console.log('📍 Step 3: Getting fresh CSRF token from API');
      const csrfResponse = await this.makeRequest('/api/auth/csrf');
      let apiCSRFToken = csrfToken;
      
      if (csrfResponse.statusCode === 200) {
        try {
          const csrfData = JSON.parse(csrfResponse.body);
          if (csrfData.csrfToken) {
            apiCSRFToken = csrfData.csrfToken;
            console.log(`✓ Fresh CSRF token: ${apiCSRFToken.substring(0, 20)}...`);
          }
        } catch (e) {
          console.log('⚠️  Could not parse CSRF response');
        }
      }

      // Step 4: Submit authentication
      console.log('📍 Step 4: Submitting authentication');
      const formData = querystring.stringify({
        email: email,
        password: password,
        csrfToken: apiCSRFToken || 'fallback',
        callbackUrl: `${this.baseURL}/en/admin`
      });

      const authResponse = await this.makeRequest('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': formData.length,
          'Referer': `${this.baseURL}/en/auth/signin`
        },
        data: formData
      });

      console.log(`✓ Authentication response: ${authResponse.statusCode}`);
      
      if (authResponse.statusCode === 302) {
        console.log('✅ Authentication successful (redirect received)');
        const location = authResponse.headers.location;
        console.log(`🔄 Redirect to: ${location}`);
      } else {
        console.log(`⚠️  Unexpected auth response: ${authResponse.statusCode}`);
      }

      // Step 5: Check session
      console.log('📍 Step 5: Checking session after authentication');
      const sessionResponse = await this.makeRequest('/api/auth/session');
      console.log(`✓ Session endpoint: ${sessionResponse.statusCode}`);
      
      let sessionData = {};
      try {
        sessionData = JSON.parse(sessionResponse.body);
        console.log('📊 Session data:', JSON.stringify(sessionData, null, 2));
      } catch (e) {
        console.log('⚠️  Session data not JSON:', sessionResponse.body.substring(0, 200));
      }

      // Step 6: Test debug session
      console.log('📍 Step 6: Testing debug session endpoint');
      const debugResponse = await this.makeRequest('/api/debug/session');
      console.log(`✓ Debug session: ${debugResponse.statusCode}`);
      
      try {
        const debugData = JSON.parse(debugResponse.body);
        console.log('🔍 Debug session data:', JSON.stringify(debugData, null, 2));
      } catch (e) {
        console.log('⚠️  Debug session not JSON:', debugResponse.body.substring(0, 200));
      }

      // Step 7: Test admin panel access
      console.log('📍 Step 7: Testing admin panel access');
      const adminResponse = await this.makeRequest('/en/admin');
      console.log(`✓ Admin panel: ${adminResponse.statusCode}`);
      
      if (adminResponse.statusCode === 302) {
        const location = adminResponse.headers.location;
        console.log(`🔄 Admin panel redirected to: ${location}`);
        
        if (location && location.includes('admin-access-required')) {
          console.log('❌ ISSUE: Redirected to admin-access-required page');
        }
      } else if (adminResponse.statusCode === 200) {
        console.log('✅ Admin panel loaded successfully');
      } else {
        console.log(`⚠️  Admin panel unexpected status: ${adminResponse.statusCode}`);
      }

      // Step 8: Test admin API endpoints
      console.log('📍 Step 8: Testing admin API endpoints');
      
      const adminEndpoints = [
        '/api/admin/analytics/users',
        '/api/admin/activity',
        '/api/admin/setup-stripe'
      ];

      for (const endpoint of adminEndpoints) {
        try {
          const response = await this.makeRequest(endpoint);
          console.log(`  📊 ${endpoint}: ${response.statusCode}`);
          
          if (response.statusCode === 200) {
            try {
              const data = JSON.parse(response.body);
              console.log(`    ✅ Success - Data keys: ${Object.keys(data).join(', ')}`);
            } catch (e) {
              console.log('    ✅ Success - Non-JSON response');
            }
          } else if (response.statusCode === 401) {
            console.log('    ❌ Access denied (401)');
          } else if (response.statusCode === 403) {
            console.log('    ❌ Forbidden (403)');
          } else {
            console.log(`    ⚠️  Unexpected status: ${response.statusCode}`);
          }
        } catch (error) {
          console.log(`    💥 Error: ${error.message}`);
        }
      }

      // Step 9: Summary
      console.log('📍 Step 9: Test Summary');
      console.log('===================');
      console.log(`🔐 Authentication Status: ${authResponse.statusCode === 302 ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📊 Session Status: ${sessionResponse.statusCode === 200 ? 'RESPONDING' : 'FAILED'}`);
      console.log(`👤 Session Data: ${Object.keys(sessionData).length > 0 ? 'PRESENT' : 'EMPTY'}`);
      console.log(`🎛️  Admin Panel: ${adminResponse.statusCode}`);
      console.log(`🍪 Cookies Collected: ${this.cookies.size}`);
      
      // Log all cookies for debugging
      console.log('🍪 Cookie Summary:');
      Array.from(this.cookies.entries()).forEach(([name, value]) => {
        console.log(`  - ${name}: ${value.substring(0, 30)}...`);
      });

      console.log('🏁 Browser authentication simulation completed');
      
      return {
        success: authResponse.statusCode === 302,
        hasSession: Object.keys(sessionData).length > 0,
        adminAccess: adminResponse.statusCode === 200,
        cookies: this.cookies.size,
        summary: {
          auth: authResponse.statusCode,
          session: sessionResponse.statusCode,
          admin: adminResponse.statusCode,
          sessionData: sessionData
        }
      };

    } catch (error) {
      console.error('💥 Browser simulation failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Run the simulation
async function runBrowserTest() {
  const simulator = new BrowserAuthSimulator('http://localhost:3000');
  
  const result = await simulator.simulateAdminLogin('admin@smartdocs.ai', 'admin123');
  
  console.log('\n🎯 FINAL RESULT:');
  console.log(JSON.stringify(result, null, 2));
}

// Execute if run directly
if (require.main === module) {
  runBrowserTest().catch(console.error);
}

module.exports = { BrowserAuthSimulator, runBrowserTest };