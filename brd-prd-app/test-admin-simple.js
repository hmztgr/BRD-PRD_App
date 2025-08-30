#!/usr/bin/env node

const { execSync } = require('child_process');

function runCommand(command, description) {
  try {
    console.log(`\n📋 ${description}`);
    console.log(`💻 Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
    console.log(`✅ Success: ${output.trim()}`);
    return output;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.stdout) console.log(`Output: ${error.stdout}`);
    if (error.stderr) console.log(`Error: ${error.stderr}`);
    return null;
  }
}

async function testAdminAuth() {
  console.log('🔐 Testing Admin Authentication Flow...\n');
  
  // Step 1: Check signin page accessibility
  const signinCheck = runCommand(
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/auth/signin',
    'Testing signin page accessibility'
  );
  
  if (signinCheck !== '200') {
    console.log('❌ Signin page not accessible');
    return false;
  }
  
  // Step 2: Check admin panel without auth (should redirect)
  const adminUnauthedCheck = runCommand(
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/admin',
    'Testing admin panel without authentication (should redirect)'
  );
  
  if (adminUnauthedCheck !== '307' && adminUnauthedCheck !== '302') {
    console.log(`⚠️ Expected redirect (307/302), got: ${adminUnauthedCheck}`);
  }
  
  // Step 3: Get CSRF token
  console.log('\n📋 Getting CSRF token');
  const csrfResponse = runCommand(
    'curl -s http://localhost:3000/api/auth/csrf',
    'Getting CSRF token'
  );
  
  if (!csrfResponse) {
    console.log('❌ Could not get CSRF token');
    return false;
  }
  
  let csrfToken;
  try {
    const csrfData = JSON.parse(csrfResponse);
    csrfToken = csrfData.csrfToken;
    console.log(`✅ CSRF Token: ${csrfToken.substring(0, 20)}...`);
  } catch (e) {
    console.log('❌ Could not parse CSRF response');
    return false;
  }
  
  // Step 4: Attempt login
  const loginCommand = `curl -s -X POST http://localhost:3000/api/auth/callback/credentials \\
    -H "Content-Type: application/x-www-form-urlencoded" \\
    -d "email=admin%40smartdocs.ai&password=admin123&csrfToken=${encodeURIComponent(csrfToken)}&callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fen%2Fadmin&json=true" \\
    -c /tmp/admin-cookies.txt -b /tmp/admin-cookies.txt`;
  
  const loginResponse = runCommand(loginCommand, 'Attempting admin login');
  
  if (!loginResponse) {
    console.log('❌ Login request failed');
    return false;
  }
  
  console.log(`📄 Login Response: ${loginResponse}`);
  
  // Step 5: Check session with cookies
  const sessionCheck = runCommand(
    'curl -s http://localhost:3000/api/auth/session -b /tmp/admin-cookies.txt',
    'Checking session after login'
  );
  
  if (!sessionCheck) {
    console.log('❌ Session check failed');
    return false;
  }
  
  let session;
  try {
    session = JSON.parse(sessionCheck);
    console.log(`👤 Session User: ${JSON.stringify(session.user || {}, null, 2)}`);
    
    if (session.user && session.user.email === 'admin@smartdocs.ai' && session.user.role === 'ADMIN') {
      console.log('✅ Admin session established successfully!');
      
      // Step 6: Test admin panel access with authentication
      const adminAuthedCheck = runCommand(
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/admin -b /tmp/admin-cookies.txt',
        'Testing admin panel access with authentication'
      );
      
      if (adminAuthedCheck === '200') {
        console.log('\n🎉 SUCCESS: Admin authentication flow is working correctly!');
        console.log('✅ Admin can successfully log in and access admin panel');
        console.log('✅ The "admin-access-required" error has been resolved');
        return true;
      } else if (adminAuthedCheck === '403') {
        console.log('\n❌ FAILURE: Admin access denied (403)');
        console.log('❌ The "admin-access-required" error is NOT resolved');
        return false;
      } else {
        console.log(`\n⚠️ UNEXPECTED: Admin panel returned status ${adminAuthedCheck}`);
        return false;
      }
    } else {
      console.log('❌ Admin session not established properly');
      return false;
    }
  } catch (e) {
    console.log('❌ Could not parse session response');
    console.log(`Raw response: ${sessionCheck}`);
    return false;
  }
}

// Run the test
testAdminAuth().then(success => {
  console.log(`\n🏁 Test Result: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`\n💥 Test Error: ${error.message}`);
  process.exit(1);
});