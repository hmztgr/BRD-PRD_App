/**
 * Test script for fallback authentication system
 * Verifies that emergency admin login works when database is unavailable
 */

const { getEmergencyAdminCredentials } = require('../src/lib/fallback-auth')

console.log('🔒 Testing Fallback Authentication System')
console.log('=====================================\n')

// Test 1: Get emergency admin credentials
console.log('📋 Test 1: Emergency Admin Credentials')
try {
  const creds = getEmergencyAdminCredentials()
  console.log('✅ Emergency admin credentials retrieved successfully')
  console.log(`   Email: ${creds.email}`)
  console.log(`   Password: ${creds.password}`)
  console.log('')
} catch (error) {
  console.error('❌ Failed to get emergency admin credentials:', error.message)
}

// Test 2: Test authentication function
console.log('🔐 Test 2: Authentication Function')
async function testAuth() {
  try {
    const { authenticateFallbackUser } = require('../src/lib/fallback-auth')
    
    // Test valid credentials
    console.log('   Testing valid credentials...')
    const validUser = await authenticateFallbackUser('admin@smartdocs.ai', 'admin123')
    if (validUser) {
      console.log('   ✅ Valid credentials accepted')
      console.log(`      User ID: ${validUser.id}`)
      console.log(`      Role: ${validUser.role}`)
      console.log(`      Permissions: ${validUser.adminPermissions.join(', ')}`)
      console.log(`      Fallback Mode: ${validUser.isFallbackUser}`)
    } else {
      console.log('   ❌ Valid credentials rejected')
    }
    
    console.log('')
    
    // Test invalid credentials
    console.log('   Testing invalid credentials...')
    const invalidUser = await authenticateFallbackUser('admin@smartdocs.ai', 'wrongpassword')
    if (!invalidUser) {
      console.log('   ✅ Invalid credentials properly rejected')
    } else {
      console.log('   ❌ Invalid credentials were accepted')
    }
    
    console.log('')
    
    // Test unauthorized email
    console.log('   Testing unauthorized email...')
    const unauthorizedUser = await authenticateFallbackUser('hacker@evil.com', 'admin123')
    if (!unauthorizedUser) {
      console.log('   ✅ Unauthorized email properly rejected')
    } else {
      console.log('   ❌ Unauthorized email was accepted')
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message)
  }
}

// Test 3: Database availability check
console.log('🗄️ Test 3: Database Availability Check')
async function testDatabaseCheck() {
  try {
    const { isDatabaseAvailable } = require('../src/lib/fallback-auth')
    
    console.log('   Checking database availability...')
    const isAvailable = await isDatabaseAvailable()
    console.log(`   Database status: ${isAvailable ? '✅ Available' : '❌ Unavailable'}`)
    
    if (!isAvailable) {
      console.log('   🔄 Fallback mode should be active')
    }
    
  } catch (error) {
    console.log('   ❌ Database unavailable (expected for fallback mode)')
    console.log('   🔄 This confirms fallback mode is needed')
  }
}

// Test 4: Session data
console.log('📊 Test 4: Session Data Retrieval')
function testSessionData() {
  try {
    const { getFallbackUserSession } = require('../src/lib/fallback-auth')
    
    console.log('   Getting fallback session data...')
    const sessionData = getFallbackUserSession('admin@smartdocs.ai')
    
    if (sessionData) {
      console.log('   ✅ Session data retrieved successfully')
      console.log(`      ID: ${sessionData.id}`)
      console.log(`      Email: ${sessionData.email}`)
      console.log(`      Role: ${sessionData.role}`)
      console.log(`      Subscription: ${sessionData.subscriptionTier}`)
    } else {
      console.log('   ❌ Failed to retrieve session data')
    }
    
  } catch (error) {
    console.error('❌ Session data test failed:', error.message)
  }
}

// Run all tests
async function runAllTests() {
  await testAuth()
  console.log('')
  await testDatabaseCheck()
  console.log('')
  testSessionData()
  
  console.log('\n🎯 Test Summary')
  console.log('===============')
  console.log('✅ If all tests pass, the fallback authentication system is ready')
  console.log('🔑 Emergency admin can login with: admin@smartdocs.ai / admin123')
  console.log('🛡️ Admin will have super_admin role with all permissions')
  console.log('📍 Access admin dashboard at: http://localhost:3000/en/admin')
}

runAllTests()