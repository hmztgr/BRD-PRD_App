require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')
const bcrypt = require('bcryptjs')

async function createAdminUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🔗 Connected to Supabase database')

    const adminEmail = 'admin@test.com'
    const adminPassword = 'Admin123!'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    const now = new Date()

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail]
    )

    let userId
    if (existingUser.rows.length > 0) {
      console.log('👤 User already exists, updating to admin...')
      userId = existingUser.rows[0].id
      
      // Update existing user to admin
      await client.query(`
        UPDATE users 
        SET is_super_admin = $1,
            "adminPermissions" = $2,
            role = $3
        WHERE email = $4
      `, [
        true,
        JSON.stringify(['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system']),
        'super_admin',
        adminEmail
      ])
      
    } else {
      console.log('🆕 Creating new admin user...')
      
      // Generate a UUID for the new user
      const uuidResult = await client.query('SELECT gen_random_uuid() as id')
      userId = uuidResult.rows[0].id
      
      // Create new admin user with all required fields
      await client.query(`
        INSERT INTO users (
          id, name, email, password, "emailVerified", 
          "createdAt", "updatedAt", 
          "subscriptionTier", "subscriptionStatus", 
          "tokensLimit", "tokensUsed", 
          is_super_admin, "adminPermissions", role,
          "referralCode", "totalReferralTokens", 
          language, "billingCycle", "systemRole", is_sso_user, is_anonymous
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, 
          $8, $9, 
          $10, $11, 
          $12, $13, $14,
          $15, $16, 
          $17, $18, $19, $20, $21
        )
      `, [
        userId, 'Admin User', adminEmail, hashedPassword, now,
        now, now,
        'enterprise', 'active',
        1000000, 0,
        true, JSON.stringify(['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system']), 'super_admin',
        'admin-' + Math.random().toString(36).substring(7), 0,
        'en', 'monthly', 'user', false, false
      ])
    }

    console.log('✅ Admin user setup complete!')
    console.log('\n🔐 Admin Login Credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('User ID:', userId)
    
    console.log('\n📝 Next Steps:')
    console.log('1. Test authentication by visiting: http://localhost:3000/en/auth/signin')
    console.log('2. Login with the credentials above')
    console.log('3. Navigate to: http://localhost:3000/en/admin')
    console.log('4. The admin dashboard should now be accessible!')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    console.error('Error details:', error)
  } finally {
    await client.end()
  }
}

createAdminUser()