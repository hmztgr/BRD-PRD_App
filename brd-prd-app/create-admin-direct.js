require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')
const bcrypt = require('bcryptjs')

async function createAdminUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🔗 Connected to database directly')

    const adminEmail = 'admin@test.com'
    const adminPassword = 'Admin123!'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Check if user exists
    const userCheck = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail]
    )

    if (userCheck.rows.length > 0) {
      console.log('🔄 User exists, updating to admin...')
      
      // Update existing user to admin
      await client.query(`
        UPDATE users 
        SET is_super_admin = $1, 
            "adminPermissions" = $2
        WHERE email = $3
      `, [
        true,
        JSON.stringify(['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system']),
        adminEmail
      ])
      
      console.log('✅ User updated to admin!')
    } else {
      console.log('🔄 Creating new admin user...')
      
      // Create new admin user
      await client.query(`
        INSERT INTO users (
          id, name, email, password, "emailVerified", 
          "createdAt", "updatedAt", 
          "subscriptionTier", "subscriptionStatus", 
          "tokensLimit", "tokensUsed", 
          is_super_admin, "adminPermissions",
          "referralCode", "totalReferralTokens", language
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 
          $5, $6, 
          $7, $8, 
          $9, $10, 
          $11, $12,
          $13, $14, $15
        )
      `, [
        'Admin User', adminEmail, hashedPassword, new Date(),
        new Date(), new Date(),
        'enterprise', 'active',
        1000000, 0,
        true, JSON.stringify(['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system']),
        'admin-' + Math.random().toString(36).substring(7), 0, 'en'
      ])
      
      console.log('✅ Admin user created!')
    }

    console.log('\n🔐 Admin Login Credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\n📝 Next Steps:')
    console.log('1. The authentication issues need to be fixed first')
    console.log('2. Once auth is working, login with these credentials')
    console.log('3. Navigate to /en/admin to access admin panel')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

createAdminUser()