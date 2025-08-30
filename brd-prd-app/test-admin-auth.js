#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL, URLSearchParams } = require('url');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data
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

async function testAdminAuth() {
  console.log('🔐 Testing Admin Authentication Flow...\n');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // Step 1: Check if signin page is accessible
    console.log('1️⃣ Testing signin page accessibility...');
    const signinResponse = await axios.get(`${baseURL}/en/auth/signin`);
    console.log(`   ✅ Signin page accessible (${signinResponse.status})`);
    
    // Step 2: Check admin panel without authentication (should redirect)
    console.log('\n2️⃣ Testing admin panel without auth...');
    try {
      const adminResponse = await axios.get(`${baseURL}/en/admin`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 307 || status === 302
      });
      console.log(`   ✅ Admin panel properly redirects unauthenticated users (${adminResponse.status})`);
    } catch (err) {
      if (err.response && (err.response.status === 307 || err.response.status === 302)) {
        console.log(`   ✅ Admin panel properly redirects unauthenticated users (${err.response.status})`);
      } else {
        throw err;
      }
    }
    
    // Step 3: Test authentication API
    console.log('\n3️⃣ Testing authentication API...');
    
    // Get CSRF token first
    const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`);
    const csrfToken = csrfResponse.data.csrfToken;
    console.log(`   ✅ CSRF token obtained: ${csrfToken.substring(0, 10)}...`);
    
    // Create a session to maintain cookies
    const axiosSession = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    // Attempt login
    const loginData = new URLSearchParams({
      email: 'admin@smartdocs.ai',
      password: 'admin123',
      csrfToken: csrfToken,
      callbackUrl: `${baseURL}/en/admin`,
      json: 'true'
    });
    
    try {
      const loginResponse = await axiosSession.post('/api/auth/callback/credentials', loginData, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      if (loginResponse.status === 200) {
        const result = loginResponse.data;
        if (result.url) {
          console.log(`   ✅ Login successful, redirecting to: ${result.url}`);
        } else if (result.error) {
          console.log(`   ❌ Login failed: ${result.error}`);
          return false;
        } else {
          console.log(`   ✅ Login response received (${loginResponse.status})`);
        }
      } else if (loginResponse.status === 302 || loginResponse.status === 307) {
        console.log(`   ✅ Login successful, redirecting (${loginResponse.status})`);
      }
      
      // Step 4: Test session after login
      console.log('\n4️⃣ Testing session after login...');
      const sessionResponse = await axiosSession.get('/api/auth/session');
      const session = sessionResponse.data;
      
      if (session.user) {
        console.log(`   ✅ Session established for user: ${session.user.email}`);
        console.log(`   ✅ User role: ${session.user.role}`);
        
        if (session.user.role === 'ADMIN') {
          console.log('\n5️⃣ Testing admin panel access with authentication...');
          try {
            const adminPanelResponse = await axiosSession.get('/en/admin');
            if (adminPanelResponse.status === 200) {
              console.log(`   ✅ Admin panel accessible with authentication (${adminPanelResponse.status})`);
              console.log('\n🎉 All tests passed! Admin authentication is working correctly.');
              return true;
            }
          } catch (err) {
            if (err.response && err.response.status === 403) {
              console.log(`   ❌ Admin panel access denied (403) - admin access error not resolved`);
              return false;
            } else {
              console.log(`   ❌ Admin panel access failed: ${err.message}`);
              return false;
            }
          }
        } else {
          console.log(`   ❌ User is not admin (role: ${session.user.role})`);
          return false;
        }
      } else {
        console.log('   ❌ No session established after login');
        return false;
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Login failed (${error.response.status}): ${error.response.data?.error || 'Unknown error'}`);
      } else {
        console.log(`   ❌ Login request failed: ${error.message}`);
      }
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Run the test
testAdminAuth().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});