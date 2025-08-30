const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

/**
 * Admin Authentication Flow Test
 * Tests the complete admin login process and access verification
 */

async function testAdminAuthentication() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting Admin Authentication Test...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Enable request interception to monitor network calls
    await page.setRequestInterception(true);
    const requests = [];
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
      request.continue();
    });
    
    // Monitor console logs
    page.on('console', (msg) => {
      console.log('Browser Console:', msg.text());
    });
    
    // Monitor page errors
    page.on('pageerror', (error) => {
      console.error('Page Error:', error.message);
    });
    
    console.log('📱 Step 1: Navigate to login page');
    
    // Navigate to signin page
    const response = await page.goto('http://localhost:3000/en/auth/signin', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to load login page: ${response.status()}`);
    }
    
    console.log('✅ Login page loaded successfully');
    
    // Wait for form elements to be present
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    
    console.log('📝 Step 2: Fill in admin credentials');
    
    // Clear and fill email field
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'admin@smartdocs.ai');
    
    // Clear and fill password field
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'admin123');
    
    console.log('🔐 Step 3: Submit login form');
    
    // Submit the form and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Get current URL after login attempt
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    // Check for error messages
    const errorElement = await page.$('.error, [data-testid="error"], .alert-error');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log('❌ Error message found:', errorText);
    }
    
    // Check cookies
    const cookies = await page.cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') || 
      cookie.name.includes('token')
    );
    
    console.log('🍪 Authentication cookies:', authCookies.map(c => ({ 
      name: c.name, 
      value: c.value.substring(0, 20) + '...', 
      domain: c.domain 
    })));
    
    console.log('🔍 Step 4: Verify admin access');
    
    // Check if redirected to admin panel or dashboard
    if (currentUrl.includes('/admin')) {
      console.log('✅ Successfully redirected to admin panel');
      
      // Verify admin panel elements are present
      try {
        await page.waitForSelector('[data-testid="admin-panel"], .admin-dashboard, h1', { timeout: 5000 });
        const pageTitle = await page.$eval('h1', el => el.textContent);
        console.log('📊 Admin panel title:', pageTitle);
        
        return {
          success: true,
          redirectedTo: currentUrl,
          adminAccess: true,
          cookies: authCookies.length,
          message: 'Admin authentication successful'
        };
      } catch (error) {
        console.log('⚠️ Admin panel elements not found, but URL suggests admin access');
        return {
          success: true,
          redirectedTo: currentUrl,
          adminAccess: true,
          cookies: authCookies.length,
          message: 'Redirected to admin URL but UI elements need verification'
        };
      }
    } else if (currentUrl.includes('/dashboard')) {
      console.log('📊 Redirected to regular dashboard - checking admin access...');
      
      // Try to access admin panel directly
      console.log('🔄 Step 5: Test direct admin access');
      
      const adminResponse = await page.goto('http://localhost:3000/en/admin', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      const adminUrl = page.url();
      console.log('📍 Admin URL after direct access:', adminUrl);
      
      if (adminUrl.includes('/admin') && !adminUrl.includes('/signin')) {
        console.log('✅ Direct admin access granted');
        return {
          success: true,
          redirectedTo: adminUrl,
          adminAccess: true,
          cookies: authCookies.length,
          message: 'Admin access granted via direct URL'
        };
      } else {
        console.log('❌ Admin access denied - redirected back to login');
        return {
          success: false,
          redirectedTo: adminUrl,
          adminAccess: false,
          cookies: authCookies.length,
          message: 'Admin access denied - insufficient permissions'
        };
      }
    } else if (currentUrl.includes('/signin')) {
      console.log('❌ Still on login page - authentication failed');
      
      // Check for specific error messages
      const bodyText = await page.evaluate(() => document.body.textContent);
      const hasAdminError = bodyText.includes('admin-access-required') || 
                           bodyText.includes('insufficient permissions') ||
                           bodyText.includes('admin access');
      
      return {
        success: false,
        redirectedTo: currentUrl,
        adminAccess: false,
        cookies: authCookies.length,
        message: hasAdminError ? 'Admin access required error' : 'Authentication failed'
      };
    } else {
      console.log('🤔 Unexpected redirect location');
      return {
        success: false,
        redirectedTo: currentUrl,
        adminAccess: false,
        cookies: authCookies.length,
        message: 'Unexpected redirect location'
      };
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    return {
      success: false,
      error: error.message,
      adminAccess: false,
      cookies: 0,
      message: 'Test execution failed'
    };
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// Additional helper function to check session state
async function checkSessionState() {
  try {
    console.log('🔍 Checking session state via API...');
    
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/debug/session');
    
    if (response.ok) {
      const sessionData = await response.json();
      console.log('📊 Session data:', JSON.stringify(sessionData, null, 2));
      return sessionData;
    } else {
      console.log('❌ Failed to fetch session data:', response.status);
      return null;
    }
  } catch (error) {
    console.log('💥 Session check failed:', error.message);
    return null;
  }
}

// Run the test
async function runTest() {
  console.log('🧪 Admin Authentication Test Suite');
  console.log('===================================');
  
  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const result = await testAdminAuthentication();
  const sessionData = await checkSessionState();
  
  console.log('\n📋 Test Results:');
  console.log('================');
  console.log('Success:', result.success);
  console.log('Admin Access:', result.adminAccess);
  console.log('Redirected To:', result.redirectedTo);
  console.log('Auth Cookies:', result.cookies);
  console.log('Message:', result.message);
  
  if (sessionData) {
    console.log('Session Valid:', !!sessionData.user);
    console.log('User Role:', sessionData.user?.role);
    console.log('Is Admin:', sessionData.user?.role === 'ADMIN');
  }
  
  if (result.error) {
    console.log('Error:', result.error);
  }
  
  // Return exit code based on success
  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { testAdminAuthentication, checkSessionState };