const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Admin Authentication Flow Test
 * Tests the complete authentication process for admin users
 */
test.describe('Admin Authentication Flow', () => {
  const baseURL = 'http://localhost:3001';
  const adminCredentials = {
    email: 'admin@smartdocs.ai',
    password: 'admin123'
  };

  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Network monitoring
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('HTTP ERROR:', response.status(), response.url());
      }
    });
  });

  test('Complete Admin Authentication Flow Test', async ({ page }) => {
    console.log('🚀 Starting comprehensive admin authentication test...');
    
    // Step 1: Navigate to signin page
    console.log('📍 Step 1: Navigating to signin page');
    await page.goto(`${baseURL}/en/auth/signin`);
    
    // Wait for page load and capture initial state
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log('✓ Page title:', title);
    
    // Capture initial cookies
    const initialCookies = await page.context().cookies();
    console.log('📄 Initial cookies:', initialCookies.length);
    
    // Step 2: Check if signin form is present
    console.log('📍 Step 2: Checking signin form elements');
    
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")');
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    console.log('✓ All form elements are visible');
    
    // Step 3: Fill the login form
    console.log('📍 Step 3: Filling login form with admin credentials');
    
    await emailInput.fill(adminCredentials.email);
    await passwordInput.fill(adminCredentials.password);
    
    // Verify form data
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    
    console.log('✓ Email filled:', emailValue);
    console.log('✓ Password filled:', passwordValue.replace(/./g, '*'));
    
    // Step 4: Submit the form and monitor network
    console.log('📍 Step 4: Submitting form and monitoring network');
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/') && response.request().method() === 'POST'
    );
    
    await submitButton.click();
    
    // Wait for auth response
    try {
      const authResponse = await responsePromise;
      console.log('🔐 Auth response status:', authResponse.status());
      console.log('🔐 Auth response URL:', authResponse.url());
      
      if (authResponse.status() !== 200) {
        const responseText = await authResponse.text();
        console.log('❌ Auth response body:', responseText);
      }
    } catch (error) {
      console.log('⚠️  Auth response error:', error.message);
    }
    
    // Step 5: Wait for redirect and capture URL changes
    console.log('📍 Step 5: Monitoring redirects and URL changes');
    
    await page.waitForLoadState('networkidle');
    
    const currentURL = page.url();
    console.log('🔄 Current URL after submission:', currentURL);
    
    // Step 6: Check session state and cookies after auth
    console.log('📍 Step 6: Checking session state and cookies');
    
    const postAuthCookies = await page.context().cookies();
    console.log('🍪 Post-auth cookies count:', postAuthCookies.length);
    
    // Look for session cookies
    const sessionCookies = postAuthCookies.filter(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('token') || 
      cookie.name.includes('auth') ||
      cookie.name.includes('next-auth')
    );
    
    console.log('🔑 Session-related cookies:', sessionCookies.map(c => ({ name: c.name, domain: c.domain })));
    
    // Step 7: Test session endpoint
    console.log('📍 Step 7: Testing session endpoint');
    
    try {
      const sessionResponse = await page.goto(`${baseURL}/api/debug/session`);
      if (sessionResponse) {
        console.log('📊 Session endpoint status:', sessionResponse.status());
        const sessionData = await page.textContent('pre') || await page.textContent('body');
        console.log('📊 Session data:', sessionData);
      }
    } catch (error) {
      console.log('⚠️  Session endpoint error:', error.message);
    }
    
    // Step 8: Navigate back and test admin panel access
    console.log('📍 Step 8: Testing admin panel access');
    
    // Try to access admin panel
    const adminPanelURL = `${baseURL}/en/admin`;
    await page.goto(adminPanelURL);
    await page.waitForLoadState('networkidle');
    
    const adminURL = page.url();
    console.log('🎛️  Admin panel URL result:', adminURL);
    
    // Check if redirected to admin-access-required
    if (adminURL.includes('admin-access-required')) {
      console.log('❌ ISSUE: Redirected to admin-access-required');
      
      // Capture page content for debugging
      const pageContent = await page.textContent('body');
      console.log('📄 Admin access page content:', pageContent.substring(0, 500) + '...');
      
      // Check for specific error messages
      const errorElements = await page.locator('text="Admin access required", text="Unauthorized", text="Access denied"').all();
      for (const element of errorElements) {
        const errorText = await element.textContent();
        console.log('⚠️  Error message found:', errorText);
      }
    } else if (adminURL.includes('/admin')) {
      console.log('✅ SUCCESS: Successfully accessed admin panel');
      
      // Check for admin panel elements
      const adminElements = await page.locator('text="Admin", text="Dashboard", text="Users", text="Analytics"').all();
      console.log('🎛️  Admin panel elements found:', adminElements.length);
    } else {
      console.log('🔄 Unexpected redirect to:', adminURL);
    }
    
    // Step 9: Test direct admin routes
    console.log('📍 Step 9: Testing specific admin routes');
    
    const adminRoutes = [
      '/en/admin/users',
      '/en/admin/analytics', 
      '/en/admin/settings'
    ];
    
    for (const route of adminRoutes) {
      try {
        await page.goto(`${baseURL}${route}`);
        await page.waitForLoadState('networkidle');
        const routeURL = page.url();
        console.log(`📊 Route ${route} -> ${routeURL}`);
        
        if (routeURL.includes('admin-access-required')) {
          console.log(`❌ ${route}: Access denied`);
        } else if (routeURL.includes(route)) {
          console.log(`✅ ${route}: Access granted`);
        }
      } catch (error) {
        console.log(`⚠️  ${route}: Error - ${error.message}`);
      }
    }
    
    // Step 10: Final authentication state check
    console.log('📍 Step 10: Final authentication state summary');
    
    // Make a final call to check user role
    try {
      const response = await page.goto(`${baseURL}/api/auth/session`);
      if (response) {
        const sessionText = await page.textContent('body');
        console.log('👤 Final session check:', sessionText);
      }
    } catch (error) {
      console.log('⚠️  Final session check error:', error.message);
    }
    
    console.log('🏁 Admin authentication flow test completed');
  });
  
  test('Database User Role Verification', async ({ page }) => {
    console.log('🗄️  Verifying admin user in database...');
    
    // Navigate to a debug endpoint that shows user data
    await page.goto(`${baseURL}/api/debug/create-admin`);
    await page.waitForLoadState('networkidle');
    
    const content = await page.textContent('body');
    console.log('🗄️  Database admin creation result:', content);
  });
  
  test('Direct API Authentication Test', async ({ page }) => {
    console.log('🔌 Testing direct API authentication...');
    
    // Test the credentials authentication endpoint directly
    const authData = {
      email: adminCredentials.email,
      password: adminCredentials.password,
      csrfToken: 'test'
    };
    
    try {
      const response = await page.request.post(`${baseURL}/api/auth/callback/credentials`, {
        data: authData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('🔌 Direct auth API status:', response.status());
      console.log('🔌 Direct auth API headers:', response.headers());
      
      if (response.status() !== 200) {
        const responseText = await response.text();
        console.log('🔌 Direct auth API error:', responseText);
      }
    } catch (error) {
      console.log('🔌 Direct auth API error:', error.message);
    }
  });
});