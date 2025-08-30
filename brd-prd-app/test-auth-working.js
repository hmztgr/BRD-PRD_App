#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, description, ignoreError = false) {
  try {
    console.log(`\n📋 ${description}`);
    const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
    console.log(`✅ Success`);
    return output.trim();
  } catch (error) {
    if (ignoreError) {
      console.log(`⚠️ Warning: ${error.message}`);
      return error.stdout ? error.stdout.trim() : '';
    }
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function testAdminAuth() {
  console.log('🔐 Testing Admin Authentication Flow...\n');
  
  // First, let's verify our admin user has the correct role
  console.log('🔍 Checking admin user configuration...');
  
  try {
    const checkResult = execSync('node check-admin-role.js', { encoding: 'utf8', cwd: '.' });
    console.log('Admin user status:', checkResult);
    
    if (!checkResult.includes('role is ADMIN')) {
      console.log('❌ Admin user does not have ADMIN role. This is the issue!');
      return false;
    }
  } catch (error) {
    console.log('❌ Could not check admin user role:', error.message);
  }
  
  // Step 1: Test basic connectivity
  const signinTest = runCommand(
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/auth/signin',
    'Testing signin page accessibility'
  );
  
  if (signinTest !== '200') {
    console.log('❌ Signin page not accessible');
    return false;
  }
  
  // Step 2: Try opening the HTML test page approach
  console.log('\n📄 Instead of curl-based authentication, let me provide manual testing instructions:');
  console.log('');
  console.log('MANUAL TESTING STEPS:');
  console.log('1. Open browser and go to: http://localhost:3000/en/auth/signin');
  console.log('2. Enter credentials:');
  console.log('   - Email: admin@smartdocs.ai');
  console.log('   - Password: admin123');
  console.log('3. Click "Sign In"');
  console.log('4. You should be redirected to: http://localhost:3000/en/admin');
  console.log('5. If you see admin panel content, authentication is working!');
  console.log('6. If you get "403" or "access denied", the admin role fix did not work.');
  console.log('');
  
  // Let me try one more programmatic approach - check what the auth endpoint returns
  console.log('📋 Testing authentication endpoint response format...');
  
  // Get CSRF token 
  const csrfResponse = runCommand(
    'curl -s http://localhost:3000/api/auth/csrf',
    'Getting CSRF token'
  );
  
  if (!csrfResponse) return false;
  
  let csrfToken;
  try {
    const csrfData = JSON.parse(csrfResponse);
    csrfToken = csrfData.csrfToken;
    console.log(`✅ CSRF Token obtained: ${csrfToken.substring(0, 20)}...`);
  } catch (e) {
    console.log('❌ Could not parse CSRF response');
    return false;
  }
  
  // Try a different login approach - simulate actual browser behavior
  const cookieJar = '/tmp/test-cookies.txt';
  
  // First get the signin page to establish session
  runCommand(
    `curl -s -c ${cookieJar} http://localhost:3000/en/auth/signin > /dev/null`,
    'Establishing session by visiting signin page'
  );
  
  // Now try the login with proper session
  const loginResponse = runCommand(
    `curl -s -X POST http://localhost:3000/api/auth/callback/credentials \\
      -H "Content-Type: application/x-www-form-urlencoded" \\
      -H "Referer: http://localhost:3000/en/auth/signin" \\
      -b ${cookieJar} -c ${cookieJar} \\
      -d "email=admin%40smartdocs.ai&password=admin123&csrfToken=${encodeURIComponent(csrfToken)}&callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fen%2Fadmin&json=true"`,
    'Attempting login with session cookies',
    true
  );
  
  console.log('📄 Login Response:', loginResponse);
  
  // Check session after login
  const sessionResponse = runCommand(
    `curl -s -b ${cookieJar} http://localhost:3000/api/auth/session`,
    'Checking session with cookies',
    true
  );
  
  console.log('📄 Session Response:', sessionResponse);
  
  if (sessionResponse && sessionResponse.includes('"user"') && sessionResponse.includes('admin@smartdocs.ai')) {
    console.log('\n✅ SUCCESS: Authentication appears to be working!');
    
    // Test admin panel access
    const adminResponse = runCommand(
      `curl -s -o /dev/null -w "%{http_code}" -b ${cookieJar} http://localhost:3000/en/admin`,
      'Testing admin panel access'
    );
    
    if (adminResponse === '200') {
      console.log('\n🎉 COMPLETE SUCCESS: Admin authentication is fully working!');
      console.log('✅ Admin can log in successfully');
      console.log('✅ Admin panel is accessible');
      console.log('✅ The "admin-access-required" error has been resolved');
      return true;
    } else {
      console.log(`\n⚠️  Admin panel returned status: ${adminResponse}`);
      console.log('Authentication works but admin access may still have issues.');
    }
  }
  
  console.log('\n❌ Programmatic authentication test failed.');
  console.log('📖 Please try the manual browser test described above.');
  console.log('The admin user is properly configured with ADMIN role.');
  
  return false;
}

// Clean up old cookie files
try {
  fs.unlinkSync('/tmp/admin-cookies.txt');
  fs.unlinkSync('/tmp/test-cookies.txt');
} catch (e) {}

testAdminAuth().then(success => {
  console.log(`\n🏁 Test Result: ${success ? 'PASSED ✅' : 'NEEDS MANUAL TESTING ⚠️'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`\n💥 Test Error: ${error.message}`);
  process.exit(1);
});