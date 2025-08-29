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

    // First, let's just try to update an existing user or create basic user first
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail]
    )

    if (existingUser.rows.length > 0) {
      console.log('👤 User exists, updating admin permissions...')
      
      // Update existing user - using proper quoting
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
      console.log('🆕 User does not exist.')
      console.log('📝 Please create user account first by:')
      console.log('1. Going to: http://localhost:3000/en/auth/signup')
      console.log('2. Register with email: admin@test.com')
      console.log('3. Password: Admin123!')
      console.log('4. Then run this script again to make the user admin')
      return
    }

    console.log('\n🔐 Admin Login Credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    
    console.log('\n🎯 Test admin access:')
    console.log('1. Login at: http://localhost:3000/en/auth/signin')
    console.log('2. Access admin at: http://localhost:3000/en/admin')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Details:', error.code)
  } finally {
    await client.end()
  }
}

createAdminUser()