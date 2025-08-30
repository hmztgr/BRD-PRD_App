#!/usr/bin/env node

/**
 * Quick Admin Test - Simple validation script
 * Tests the core admin functionality quickly
 */

// Use Node.js built-in fetch (available in Node 18+)
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@smartdocs.ai';
const ADMIN_PASSWORD = 'admin123';

async function quickTest() {
  console.log('🚀 Quick Admin Authentication Test\n');

  try {
    // Test 1: Check server
    console.log('1️⃣ Checking server availability...');
    const serverTest = await fetch(`${BASE_URL}/api/debug/session`);
    
    if (serverTest.ok) {
      console.log('✅ Server is running');
      const data = await serverTest.json();
      console.log(`📊 Session status: ${data.hasSession ? 'Active' : 'None'}`);
      
      if (data.hasSession && data.session?.user) {
        console.log(`👤 User: ${data.session.user.email}`);
        console.log(`🔐 Role: ${data.session.user.role}`);
        console.log(`🛡️ Permissions: ${JSON.stringify(data.session.user.adminPermissions)}`);
      }
    } else {
      console.log('❌ Server not responding');
      return;
    }

    console.log();

    // Test 2: Admin panel access
    console.log('2️⃣ Testing admin panel access...');
    const adminTest = await fetch(`${BASE_URL}/en/admin`, { redirect: 'manual' });
    
    if (adminTest.status === 200) {
      console.log('✅ Admin panel accessible');
    } else if (adminTest.status === 302 || adminTest.status === 307) {
      const location = adminTest.headers.get('location');
      if (location && location.includes('/auth/signin')) {
        console.log('⚠️ Redirected to sign-in (no active admin session)');
      } else {
        console.log(`⚠️ Redirected to: ${location}`);
      }
    } else {
      console.log(`❌ Admin panel failed: ${adminTest.status}`);
    }

    console.log();

    // Test 3: Admin API security
    console.log('3️⃣ Testing admin API security...');
    const apiTest = await fetch(`${BASE_URL}/api/admin/analytics/users`);
    
    if (apiTest.status === 401) {
      console.log('✅ Admin API properly secured (401 Unauthorized)');
    } else if (apiTest.status === 403) {
      console.log('✅ Admin API properly secured (403 Forbidden)');
    } else if (apiTest.status === 200) {
      console.log('⚠️ Admin API accessible without authentication');
    } else {
      console.log(`❓ Admin API returned: ${apiTest.status}`);
    }

    console.log();

    // Test 4: Check admin user exists
    console.log('4️⃣ Checking admin user in database...');
    const debugData = await fetch(`${BASE_URL}/api/debug/session`).then(r => r.json());
    
    if (debugData.hasAdminUser) {
      console.log('✅ Admin user exists in database');
    } else {
      console.log('❌ No admin user found in database');
    }

    console.log('\n🏁 Quick test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
quickTest();