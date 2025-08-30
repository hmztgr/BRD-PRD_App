const puppeteer = require('puppeteer');

/**
 * Comprehensive Admin Authentication Flow Test using Puppeteer
 */
async function runAdminAuthTest() {
  const baseURL = 'http://localhost:3001';
  const adminCredentials = {
    email: 'admin@smartdocs.ai',
    password: 'admin123'
  };

  console.log('🚀 Starting comprehensive admin authentication test with Puppeteer...');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('📍 Step 1: Launching browser...');
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
    
    // Step 2: Navigate to signin page
    console.log('📍 Step 2: Navigating to signin page');
    await page.goto(`${baseURL}/en/auth/signin`, { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    console.log('✓ Page title:', title);
    
    // Capture initial cookies
    const initialCookies = await page.cookies();
    console.log('📄 Initial cookies:', initialCookies.length);
    initialCookies.forEach(cookie => console.log('  -', cookie.name, ':', cookie.value.substring(0, 20) + '...'));
    
    // Step 3: Check signin form elements
    console.log('📍 Step 3: Checking signin form elements');
    
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"], input[name="password"]');
    await page.waitForSelector('button[type="submit"], button:contains("Sign In")');
    
    console.log('✓ All form elements are present');
    
    // Step 4: Fill the login form
    console.log('📍 Step 4: Filling login form with admin credentials');
    
    await page.type('input[type="email"], input[name="email"]', adminCredentials.email);
    await page.type('input[type="password"], input[name="password"]', adminCredentials.password);
    
    console.log('✓ Credentials entered');
    
    // Step 5: Submit form and monitor network
    console.log('📍 Step 5: Submitting form and monitoring network');
    
    // Set up response monitoring
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
      
      if (response.url().includes('/api/auth/')) {
        console.log('🔐 Auth API Response:', response.status(), response.url());
      }
    });
    
    // Click submit button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or response
    await page.waitForTimeout(3000);
    
    const currentURL = page.url();
    console.log('🔄 Current URL after submission:', currentURL);
    
    // Step 6: Check cookies after authentication
    console.log('📍 Step 6: Checking cookies after authentication');
    
    const postAuthCookies = await page.cookies();
    console.log('🍪 Post-auth cookies count:', postAuthCookies.length);
    
    const sessionCookies = postAuthCookies.filter(cookie => 
      cookie.name.toLowerCase().includes('session') ||
      cookie.name.toLowerCase().includes('token') ||
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('next-auth')
    );
    
    console.log('🔑 Session-related cookies:');
    sessionCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 30)}... (domain: ${cookie.domain})`);
    });
    
    // Step 7: Test session endpoint
    console.log('📍 Step 7: Testing session endpoint');
    
    await page.goto(`${baseURL}/api/debug/session`, { waitUntil: 'networkidle2' });
    const sessionContent = await page.content();
    console.log('📊 Session endpoint content:', sessionContent.substring(0, 1000));
    
    // Step 8: Test admin panel access
    console.log('📍 Step 8: Testing admin panel access');
    
    await page.goto(`${baseURL}/en/admin`, { waitUntil: 'networkidle2' });
    const adminURL = page.url();
    console.log('🎛️  Admin panel URL result:', adminURL);
    
    if (adminURL.includes('admin-access-required')) {
      console.log('❌ ISSUE: Redirected to admin-access-required');
      
      const pageContent = await page.content();
      console.log('📄 Admin access page content (first 500 chars):', pageContent.substring(0, 500));
      
    } else if (adminURL.includes('/admin')) {
      console.log('✅ SUCCESS: Successfully accessed admin panel');
      
      const adminElements = await page.$$eval('[data-testid], h1, h2, nav', elements => 
        elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
      );
      console.log('🎛️  Admin panel elements:', adminElements.slice(0, 10));
      
    } else {
      console.log('🔄 Unexpected redirect to:', adminURL);
    }
    
    // Step 9: Test specific admin API endpoints
    console.log('📍 Step 9: Testing admin API endpoints');
    
    const adminAPIEndpoints = [
      '/api/admin/analytics/users',
      '/api/admin/activity',
      '/api/admin/setup-stripe'
    ];
    
    for (const endpoint of adminAPIEndpoints) {
      try {
        await page.goto(`${baseURL}${endpoint}`, { waitUntil: 'networkidle2' });
        const response = page.url();
        const content = await page.content();
        
        console.log(`📊 API ${endpoint}:`);
        console.log(`  URL: ${response}`);
        console.log(`  Content (first 200 chars): ${content.substring(0, 200)}...`);
        
      } catch (error) {
        console.log(`⚠️  API ${endpoint} error:`, error.message);
      }
    }
    
    // Step 10: Direct authentication API test
    console.log('📍 Step 10: Testing direct authentication API');
    
    // Test credentials endpoint directly
    const authResponse = await page.evaluate(async (baseURL, credentials) => {
      try {
        const response = await fetch(`${baseURL}/api/auth/callback/credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: credentials.email,
            password: credentials.password,
            csrfToken: 'test'
          })
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          text: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    }, baseURL, adminCredentials);
    
    console.log('🔌 Direct auth API result:', authResponse);
    
    // Step 11: Final summary
    console.log('📍 Step 11: Test Summary');
    console.log('=====================================');
    console.log('🔍 Total network responses captured:', responses.length);
    
    const authResponses = responses.filter(r => r.url.includes('/api/auth/'));
    console.log('🔐 Auth-related responses:', authResponses.length);
    authResponses.forEach(r => console.log(`  - ${r.status} ${r.url}`));
    
    const errorResponses = responses.filter(r => r.status >= 400);
    console.log('❌ Error responses:', errorResponses.length);
    errorResponses.forEach(r => console.log(`  - ${r.status} ${r.url}`));
    
    console.log('🏁 Admin authentication flow test completed');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runAdminAuthTest().catch(console.error);
}

module.exports = { runAdminAuthTest };